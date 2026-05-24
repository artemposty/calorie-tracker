'use client';

import { useEffect, useRef, useState } from 'react';
import { Goals, DayTotals } from '@/lib/types';

interface Props {
  totals: DayTotals;
  goals: Goals;
}

export function CalorieDisplay({ totals, goals }: Props) {
  const eaten = Math.round(totals.kcal);
  const remaining = goals.kcal - eaten;
  const isOver = remaining < 0;

  const [mounted, setMounted] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      firstRender.current = false;
    }, 60);
    return () => clearTimeout(t);
  }, []);

  const R = 108;
  const circ = 2 * Math.PI * R;
  const progress = mounted ? Math.min(eaten / goals.kcal, 1) : 0;
  const offset = circ * (1 - progress);
  const isOverfill = mounted && eaten > goals.kcal;

  return (
    <div className="flex justify-center">
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        <svg
          width="240" height="240" viewBox="0 0 240 240"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          <g transform="rotate(-90 120 120)">
            {/* Track */}
            <circle cx="120" cy="120" r={R} fill="none"
              stroke="rgba(255,255,255,0.15)" strokeWidth="13" strokeLinecap="round" />
            {/* Overfill glow ring */}
            {isOverfill && (
              <circle cx="120" cy="120" r={R} fill="none"
                stroke="var(--kcal)" strokeWidth="13" strokeLinecap="round" opacity="0.18" />
            )}
            {/* Progress arc */}
            <circle
              cx="120" cy="120" r={R} fill="none"
              stroke="var(--kcal)" strokeWidth="13" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                filter: 'drop-shadow(0 0 8px rgba(255,55,95,0.55))',
              }}
            />
          </g>
        </svg>

        {/* Center text */}
        <div className="flex flex-col items-center select-none" style={{ zIndex: 1 }}>
          <p
            className="tabular-nums"
            style={{
              fontSize: 54,
              fontWeight: 200,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: 'var(--text-1)',
            }}
          >
            {eaten.toLocaleString('ru')}
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: 'var(--text-3)' }}>
            ккал
          </p>
          <p
            className="text-sm font-medium mt-2.5"
            style={{ color: isOver ? 'var(--danger)' : 'var(--success)' }}
          >
            {isOver
              ? `+${Math.abs(remaining).toLocaleString('ru')} лишнее`
              : `${remaining.toLocaleString('ru')} осталось`}
          </p>
        </div>
      </div>
    </div>
  );
}
