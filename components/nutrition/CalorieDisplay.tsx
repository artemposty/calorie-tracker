'use client';

import { useEffect, useState } from 'react';
import { Goals, DayTotals } from '@/lib/types';

interface Props {
  totals: DayTotals;
  goals: Goals;
  expenditure: number;   // base_tdee + workout_kcal
  workoutKcal: number;   // addon from today's session (0 if no workout)
}

const CX = 120, CY = 120, R = 108, SW = 13;
const CIRC = 2 * Math.PI * R;

function toXY(angleDeg: number, r: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

export function CalorieDisplay({ totals, goals, expenditure, workoutKcal }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const eaten    = Math.round(totals.kcal);
  const goalKcal = goals.kcal;
  const exp      = expenditure > 0 ? expenditure : goalKcal;

  // Arc progress values (0..1, overflow capped at 1 for the overflow arc)
  const mainProgress     = mounted ? Math.min(eaten / exp, 1) : 0;
  const overflowProgress = mounted ? Math.max(0, Math.min((eaten - exp) / exp, 1)) : 0;
  const goalProgress     = Math.min(goalKcal / exp, 1);

  const goalAngle = goalProgress * 360;
  const deficit   = exp - eaten;          // >0 = deficit (good), <0 = surplus
  const isDeficit = deficit >= 0;
  const hasOverflow = overflowProgress > 0;

  // Goal tick + label positions in SVG coordinate space
  const goalInner    = toXY(goalAngle, R - 8);
  const goalOuter    = toXY(goalAngle, R + 10);
  const goalLabelPos = toXY(goalAngle, R + 24);
  const anchor = goalLabelPos.x < CX - 10 ? 'end' : goalLabelPos.x > CX + 10 ? 'start' : 'middle';

  const transition = mounted
    ? 'stroke-dashoffset 1.1s cubic-bezier(0.25,0.46,0.45,0.94)'
    : 'none';

  return (
    <div className="flex justify-center">
      {/* Wrapper: extra top margin for the expenditure label */}
      <div style={{ position: 'relative', width: 240, height: 240, marginTop: 32 }}>

        {/* ── Expenditure label — above 12 o'clock ─────────────────────── */}
        <div style={{
          position: 'absolute', top: -28, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          pointerEvents: 'none',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.02em' }}>
            расход {exp.toLocaleString('ru')} ккал
          </p>
          {workoutKcal > 0 && (
            <p style={{ fontSize: 10, color: 'var(--text-4)' }}>🏋 +{workoutKcal}</p>
          )}
        </div>

        {/* ── SVG ──────────────────────────────────────────────────────── */}
        <svg width="240" height="240" viewBox="0 0 240 240"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>

          {/* Arcs — rotated so dashoffset starts from 12 o'clock */}
          <g transform="rotate(-90 120 120)">
            {/* Track */}
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke="rgba(255,255,255,0.07)" strokeWidth={SW} />

            {/* Main eaten arc — neutral silver-white */}
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke="rgba(235,235,255,0.83)" strokeWidth={SW}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - mainProgress)}
              style={{
                transition,
                filter: 'drop-shadow(0 0 5px rgba(190,190,255,0.32))',
              }}
            />

            {/* Overflow arc — alarm red, slightly thicker, glowing */}
            {hasOverflow && (
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke="#ff453a" strokeWidth={SW + 3}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - overflowProgress)}
                style={{
                  transition,
                  filter: 'drop-shadow(0 0 14px rgba(255,69,58,0.82))',
                }}
              />
            )}
          </g>

          {/* Goal tick — in screen coords (no rotation) */}
          <line
            x1={goalInner.x} y1={goalInner.y}
            x2={goalOuter.x} y2={goalOuter.y}
            stroke="rgba(255,255,255,0.42)" strokeWidth="2.5" strokeLinecap="round"
          />

          {/* Goal label */}
          <text
            x={goalLabelPos.x} y={goalLabelPos.y}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize="10" fontFamily="system-ui,-apple-system,sans-serif"
            fill="rgba(255,255,255,0.28)"
          >
            цель {goalKcal.toLocaleString('ru')}
          </text>
        </svg>

        {/* ── Center text ───────────────────────────────────────────────── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none"
          style={{ gap: 0 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.09em',
            textTransform: 'uppercase', color: 'var(--text-3)',
          }}>
            Съедено
          </p>
          <p style={{
            fontSize: 50, fontWeight: 200, lineHeight: 1.05,
            letterSpacing: '-0.04em', color: 'var(--text-1)', marginTop: 3,
          }}>
            {eaten.toLocaleString('ru')}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
            из {goalKcal.toLocaleString('ru')}
          </p>

          {/* Deficit / surplus chip */}
          <div style={{
            marginTop: 10,
            padding: '3px 10px', borderRadius: 20,
            background: isDeficit ? 'rgba(48,209,88,0.13)' : 'rgba(255,69,58,0.14)',
            border: `1px solid ${isDeficit ? 'rgba(48,209,88,0.30)' : 'rgba(255,69,58,0.30)'}`,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
              color: isDeficit ? '#30d158' : '#ff453a',
            }}>
              {isDeficit ? '−' : '+'}{Math.abs(deficit).toLocaleString('ru')}&thinsp;{isDeficit ? 'дефицит' : 'профицит'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
