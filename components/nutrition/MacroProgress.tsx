'use client';

import { useEffect, useState } from 'react';
import { Goals, DayTotals } from '@/lib/types';
import { useTweenedValue } from '@/hooks/useTweenedValue';

interface Props { totals: DayTotals; goals: Goals; }

interface MacroDef { key: keyof DayTotals; label: string; goal: number; color: string; }

function SmallRing({ value, goal, color, label, delay }: {
  value: number; goal: number; color: string; label: string; delay: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  const R     = 38;
  const R_OV  = 43;      // outer overflow ring
  const SW    = 5;
  const SW_OV = 2.5;
  const circ  = 2 * Math.PI * R;
  const circO = 2 * Math.PI * R_OV;

  const rounded = Math.round(value);
  const tweened = useTweenedValue(rounded);

  const isOver   = value > goal;
  const overage  = isOver ? Math.round(value - goal) : 0;

  // Base ring always fills to min(value, goal) in its original color
  const baseProg = mounted ? Math.min(tweened / goal, 1) : 0;
  // Outer ring: overflow beyond goal, cap at 1 revolution
  const ovProg   = mounted && isOver ? Math.max(0, Math.min((tweened - goal) / goal, 1)) : 0;

  const fade: React.CSSProperties = { opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' };

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="relative" style={{ width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96"
          style={{ ...fade, position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g transform="rotate(-90 48 48)">
            {/* Track */}
            <circle cx="48" cy="48" r={R} fill="none"
              stroke="rgba(255,255,255,0.08)" strokeWidth={SW} />

            {/* Base ring — macro color, never turns red */}
            <circle cx="48" cy="48" r={R} fill="none"
              stroke={color} strokeWidth={SW} strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - baseProg)}
              style={{
                transition: 'stroke-dashoffset 1.1s cubic-bezier(0.25,0.46,0.45,0.94)',
                filter: `drop-shadow(0 0 5px ${color}55)`,
              }}
            />

            {/* Outer overflow ring — red concentric ring, only when value > goal */}
            {isOver && (
              <circle cx="48" cy="48" r={R_OV} fill="none"
                stroke="#ff453a" strokeWidth={SW_OV} strokeLinecap="round"
                strokeDasharray={circO}
                strokeDashoffset={circO * (1 - ovProg)}
                style={{
                  transition: 'stroke-dashoffset 1.1s cubic-bezier(0.25,0.46,0.45,0.94)',
                  filter: 'drop-shadow(0 0 6px rgba(255,69,58,0.68))',
                }}
              />
            )}
          </g>
        </svg>

        {/* Center value — red number only on overflow */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={fade}>
          <p className="text-sm font-bold leading-none"
            style={{ color: isOver ? '#ff453a' : color, fontVariantNumeric: 'tabular-nums' }}>
            {rounded}
          </p>
          <p className="text-[10px] mt-0.5 font-semibold"
            style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
            /{goal}
          </p>
        </div>
      </div>

      <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</p>

      {/* Overflow chip */}
      {isOver && (
        <p style={{
          fontSize: 9, fontWeight: 700, color: '#ff453a',
          marginTop: -6, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums',
        }}>
          +{overage}&thinsp;г
        </p>
      )}
    </div>
  );
}

export function MacroProgress({ totals, goals }: Props) {
  const macros: MacroDef[] = [
    { key: 'p', label: 'Белок', goal: goals.protein, color: 'var(--protein)' },
    { key: 'f', label: 'Жиры',  goal: goals.fat,     color: 'var(--fat)'     },
    { key: 'c', label: 'Углев', goal: goals.carbs,   color: 'var(--carbs)'   },
  ];
  return (
    <div className="flex justify-around px-6 pb-2">
      {macros.map((m, i) => (
        <SmallRing
          key={String(m.key)}
          label={m.label}
          value={Number(totals[m.key])}
          goal={m.goal}
          color={m.color}
          delay={i * 80}
        />
      ))}
    </div>
  );
}
