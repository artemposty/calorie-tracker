'use client';

import { useEffect, useState } from 'react';
import { Goals, DayTotals } from '@/lib/types';
import { useTweenedValue } from '@/hooks/useTweenedValue';

interface Props {
  totals: DayTotals;
  goals: Goals;
  expenditure: number;
  workoutKcal: number;
}

const CX = 120, CY = 120, R = 108, SW = 13;
const CIRC = 2 * Math.PI * R;
const LABEL = 'rgba(255,255,255,0.28)';
const INNER_R = R - SW / 2;
const OUTER_R = R + SW / 2;

function toXY(angleDeg: number, r: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function DumbbellIcon() {
  return (
    <svg width="14" height="8" viewBox="0 0 14 8" fill="none"
      stroke={LABEL} strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="4" x2="10" y2="4" />
      <line x1="3" y1="1.5" x2="3" y2="6.5" />
      <line x1="11" y1="1.5" x2="11" y2="6.5" />
      <line x1="1.5" y1="2.5" x2="1.5" y2="5.5" />
      <line x1="12.5" y1="2.5" x2="12.5" y2="5.5" />
    </svg>
  );
}

// Smooth temperature gradient via CSS conic-gradient
function buildConicGradient(eatenFrac: number, goalFrac: number): string {
  if (eatenFrac <= 0.002) return 'transparent';

  const W = 'rgba(222,226,255,0.84)';
  const A = 'rgba(255,158,10,0.88)';
  const RED = 'rgba(255,69,58,1)';
  const T = 'transparent';

  const eatDeg = Math.min(eatenFrac, 1) * 360;
  const gDeg   = goalFrac * 360;
  const B      = 28; // blend zone degrees

  const stops: string[] = [`${W} 0deg`];

  const neutralEnd = Math.max(0, gDeg - B);

  if (eatDeg <= gDeg - B) {
    stops.push(`${W} ${eatDeg}deg`, `${T} ${eatDeg}deg`);
  } else if (eatDeg <= gDeg + B) {
    stops.push(`${W} ${neutralEnd}deg`, `${A} ${eatDeg}deg`, `${T} ${eatDeg}deg`);
  } else if (eatDeg <= 360 - B) {
    stops.push(`${W} ${neutralEnd}deg`, `${A} ${gDeg + B}deg`, `${A} ${eatDeg}deg`, `${T} ${eatDeg}deg`);
  } else {
    const amberEnd = Math.max(gDeg + B, 360 - B);
    stops.push(`${W} ${neutralEnd}deg`, `${A} ${gDeg + B}deg`, `${A} ${amberEnd}deg`, `${RED} ${Math.min(eatDeg, 360)}deg`, `${T} ${eatDeg}deg`);
  }

  stops.push(`${T} 360deg`);
  return `conic-gradient(${stops.join(', ')})`;
}

function endCapColor(eatenFrac: number, goalFrac: number): string {
  const B = 28 / 360;
  if (eatenFrac <= goalFrac - B) return 'rgba(222,226,255,0.84)';
  if (eatenFrac <= goalFrac + B) return 'rgba(255,158,10,0.88)';
  if (eatenFrac <= 1 - B)       return 'rgba(255,158,10,0.88)';
  return 'rgba(255,69,58,1)';
}

const RING_MASK = `radial-gradient(circle at 50% 50%, transparent ${INNER_R - 1}px, black ${INNER_R}px, black ${OUTER_R}px, transparent ${OUTER_R + 1}px)`;

export function CalorieDisplay({ totals, goals, expenditure, workoutKcal }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const eaten    = Math.round(totals.kcal);
  const goalKcal = goals.kcal;
  const exp      = expenditure > 0 ? expenditure : goalKcal;

  const tweenedEaten = useTweenedValue(eaten);
  const goalFrac     = Math.min(goalKcal / exp, 1);
  const eatenFrac    = Math.min(tweenedEaten / exp, 1);
  const overflowFrac = Math.max(0, Math.min((tweenedEaten - exp) / exp, 1));

  const isDeficit    = exp - eaten >= 0;
  const tweenedDef   = exp - tweenedEaten;

  const goalAngle    = goalFrac * 360;
  const eatenAngle   = eatenFrac * 360;
  const goalInner    = toXY(goalAngle, R - 8);
  const goalOuter    = toXY(goalAngle, R + 10);
  const goalLabelPos = toXY(goalAngle, R + 24);
  const goalAnchor   = goalLabelPos.x < CX - 10 ? 'end' : goalLabelPos.x > CX + 10 ? 'start' : 'middle';
  const endPos       = toXY(eatenAngle, R);

  const gradient = buildConicGradient(eatenFrac, goalFrac);
  const capColor = endCapColor(eatenFrac, goalFrac);

  const fade: React.CSSProperties = { opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' };

  return (
    <div className="flex justify-center">
      <div style={{ position: 'relative', width: 240, height: 240, marginTop: 40 }}>

        {/* ── Expenditure label ─────────────────────────────────────────── */}
        <div style={{
          ...fade, position: 'absolute', top: -38, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          pointerEvents: 'none',
        }}>
          <p style={{ fontSize: 10, color: LABEL, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
            расход {exp.toLocaleString('ru')}
          </p>
          {workoutKcal > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <DumbbellIcon />
              <p style={{ fontSize: 10, color: LABEL, fontVariantNumeric: 'tabular-nums' }}>+{workoutKcal}</p>
            </div>
          )}
        </div>

        {/* ── Layer 0: SVG track + overflow ─────────────────────────────── */}
        <svg width="240" height="240" viewBox="0 0 240 240"
          style={{ ...fade, position: 'absolute', inset: 0, overflow: 'visible', zIndex: 0 }}>
          <g transform="rotate(-90 120 120)">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={SW} />
            {overflowFrac > 0 && (
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke="#ff453a" strokeWidth={SW + 2} strokeLinecap="round"
                strokeDasharray={`${overflowFrac * CIRC} ${CIRC}`}
                strokeDashoffset={0}
                style={{ filter: 'drop-shadow(0 0 14px rgba(255,69,58,0.82))' }}
              />
            )}
          </g>
        </svg>

        {/* ── Layer 1: CSS conic-gradient ring ──────────────────────────── */}
        <div style={{
          ...fade, position: 'absolute', inset: 0, borderRadius: '50%',
          background: gradient,
          WebkitMask: RING_MASK, mask: RING_MASK, zIndex: 1,
        }} />

        {/* ── Layer 2: SVG caps + tick + label ──────────────────────────── */}
        <svg width="240" height="240" viewBox="0 0 240 240"
          style={{ ...fade, position: 'absolute', inset: 0, overflow: 'visible', zIndex: 2 }}>
          {eatenFrac > 0.01 && (
            <>
              <circle cx={CX} cy={CY - R} r={SW / 2} fill="rgba(222,226,255,0.84)" />
              <circle cx={endPos.x} cy={endPos.y} r={SW / 2} fill={capColor} />
            </>
          )}
          <line x1={goalInner.x} y1={goalInner.y} x2={goalOuter.x} y2={goalOuter.y}
            stroke="rgba(255,255,255,0.38)" strokeWidth="2.5" strokeLinecap="round" />
          <text x={goalLabelPos.x} y={goalLabelPos.y}
            textAnchor={goalAnchor} dominantBaseline="middle"
            fontSize="10" fontFamily="system-ui,-apple-system,sans-serif" fill={LABEL}>
            цель {goalKcal.toLocaleString('ru')}
          </text>
        </svg>

        {/* ── Layer 3: Center ───────────────────────────────────────────── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none"
          style={{ ...fade, zIndex: 3 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            Съедено
          </p>
          <div style={{ minWidth: 172, textAlign: 'center', marginTop: 4 }}>
            <span style={{
              fontSize: 50, fontWeight: 200, lineHeight: 1.05,
              letterSpacing: '-0.04em', color: 'var(--text-1)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {tweenedEaten.toLocaleString('ru')}
            </span>
          </div>
          <div style={{
            marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 11px', borderRadius: 20,
            background: isDeficit ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.14)',
            border: `1px solid ${isDeficit ? 'rgba(48,209,88,0.26)' : 'rgba(255,69,58,0.28)'}`,
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              stroke={isDeficit ? '#30d158' : '#ff453a'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isDeficit
                ? <polyline points="2,3.5 5,6.5 8,3.5" />
                : <polyline points="2,6.5 5,3.5 8,6.5" />}
            </svg>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
              fontVariantNumeric: 'tabular-nums',
              color: isDeficit ? '#30d158' : '#ff453a',
            }}>
              {Math.abs(tweenedDef).toLocaleString('ru')}&thinsp;{isDeficit ? 'дефицит' : 'профицит'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
