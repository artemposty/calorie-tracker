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

function SmallRing({ value, goal, color, label, delay }: { value: number; goal: number; color: string; label: string; delay: number }) {
  const [mounted, setMounted] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      firstRender.current = false;
    }, 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  const R = 38;
  const circ = 2 * Math.PI * R;
  const progress = mounted ? Math.min(value / goal, 1) : 0;
  const offset = circ * (1 - progress);
  const isOver = value > goal;

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="relative" style={{ width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g transform="rotate(-90 48 48)">
            <circle cx="48" cy="48" r={R} fill="none"
              stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
            {isOver && (
              <circle cx="48" cy="48" r={R} fill="none"
                stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.25" />
            )}
            <circle
              cx="48" cy="48" r={R} fill="none"
              stroke={color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                filter: `drop-shadow(0 0 6px ${color}88)`,
              }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-sm font-bold tabular-nums leading-none" style={{ color }}>
            {Math.round(value)}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--text-3)' }}>/{goal}</p>
        </div>
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</p>
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
