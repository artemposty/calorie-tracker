'use client';

import { useEffect, useRef, useState } from 'react';
import { Goals, DayTotals } from '@/lib/types';

interface Props {
  totals: DayTotals;
  goals: Goals;
}

interface MacroDef {
  key: keyof DayTotals;
  label: string;
  goal: number;
  color: string;
}

function SmallRing({ value, goal, color, label, delay }: {
  value: number; goal: number; color: string; label: string; delay: number;
}) {
  const [mounted, setMounted] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => { setMounted(true); firstRender.current = false; }, 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  const R = 38;
  const circ = 2 * Math.PI * R;
  const progress = mounted ? Math.min(value / goal, 1) : 0;
  const offset = circ * (1 - progress);
  const isOver = value > goal;
  const overage = isOver ? Math.round(value - goal) : 0;

  // Red when over target, original color otherwise
  const activeColor = isOver ? '#ff453a' : color;

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="relative" style={{ width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g transform="rotate(-90 48 48)">
            {/* Track */}
            <circle cx="48" cy="48" r={R} fill="none"
              stroke={isOver ? 'rgba(255,69,58,0.12)' : 'rgba(255,255,255,0.10)'}
              strokeWidth="5" />
            {/* Overflow full glow ring */}
            {isOver && (
              <circle cx="48" cy="48" r={R} fill="none"
                stroke="#ff453a" strokeWidth="5" opacity="0.22" />
            )}
            {/* Progress arc */}
            <circle
              cx="48" cy="48" r={R} fill="none"
              stroke={activeColor} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 1.1s cubic-bezier(0.25,0.46,0.45,0.94)',
                filter: isOver
                  ? 'drop-shadow(0 0 7px rgba(255,69,58,0.7))'
                  : `drop-shadow(0 0 5px ${color}66)`,
              }}
            />
          </g>
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-sm font-bold tabular-nums leading-none" style={{ color: activeColor }}>
            {Math.round(value)}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--text-4)' }}>
            /{goal}
          </p>
        </div>
      </div>

      <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</p>

      {/* Overflow chip */}
      {isOver && (
        <p style={{
          fontSize: 9, fontWeight: 700, color: '#ff453a',
          marginTop: -6, letterSpacing: '0.01em',
        }}>
          +{overage}&thinsp;г
        </p>
      )}
    </div>
  );
}

export function MacroProgress({ totals, goals }: Props) {
  const macros: MacroDef[] = [
    { key: 'p', label: 'Белок',  goal: goals.protein, color: 'var(--protein)' },
    { key: 'f', label: 'Жиры',   goal: goals.fat,     color: 'var(--fat)'     },
    { key: 'c', label: 'Углев',  goal: goals.carbs,   color: 'var(--carbs)'   },
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
