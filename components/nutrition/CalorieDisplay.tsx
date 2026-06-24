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
const INNER_R = R - SW / 2;
const OUTER_R = R + SW / 2;

function toXY(angleDeg: number, r: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function buildConicGradient(eatenFrac: number, goalFrac: number): string {
  if (eatenFrac <= 0.002) return 'transparent';
  const W = 'rgba(222,226,255,0.84)';
  const A = 'rgba(255,158,10,0.88)';
  const RED = 'rgba(255,69,58,1)';
  const T = 'transparent';
  const eatDeg = Math.min(eatenFrac, 1) * 360;
  const gDeg   = goalFrac * 360;
  const B      = 28;
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


const RING_MASK = `radial-gradient(circle at 50% 50%, transparent ${INNER_R - 1}px, black ${INNER_R}px, black ${OUTER_R}px, transparent ${OUTER_R + 1}px)`;

const BADGE: React.CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  padding: '3px 9px',
  borderRadius: 9,
  background: 'var(--bg)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.10)',
  fontSize: 10,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: '#8a8a96',
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  lineHeight: 1.4,
};

export function CalorieDisplay({ totals, goals, expenditure, workoutKcal }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const eaten    = Math.round(totals.kcal);
  const goalKcal = goals.kcal;
  const exp      = expenditure > 0 ? expenditure : goalKcal;

  // Tween everything: eaten, expenditure → goalFrac and all positions animate smoothly
  const tweenedEaten = useTweenedValue(eaten);
  const tweenedExp   = useTweenedValue(exp);

  const goalFrac     = Math.min(goalKcal / tweenedExp, 1);
  const eatenFrac    = Math.min(tweenedEaten / tweenedExp, 1);
  const overflowFrac = Math.max(0, Math.min((tweenedEaten - tweenedExp) / tweenedExp, 1));

  const isDeficit    = exp - eaten >= 0;
  const tweenedDef   = tweenedExp - tweenedEaten;

  // Positions — all derived from tweened values → animate per-frame
  const goalAngle  = goalFrac * 360;
  const eatenAngle = eatenFrac * 360;
  const goalInner  = toXY(goalAngle, R - 7);
  const goalOuter  = toXY(goalAngle, R + 8);

  // Badge positions: slightly outside ring
  const goalBadgePos = toXY(goalAngle, R + 20);
  const expBadgePos  = toXY(0, R + 20); // 12 o'clock
  // Tick at 12 o'clock
  const expInner = toXY(0, R - 7);
  const expOuter = toXY(0, R + 8);

  // Smart text-align for goal badge based on quadrant
  const goalBadgeAlign = goalBadgePos.x < CX - 20 ? 'translateX(-90%)' :
                         goalBadgePos.x > CX + 20 ? 'translateX(-10%)' : 'translateX(-50%)';

  const gradient = buildConicGradient(eatenFrac, goalFrac);

  const ease = 'cubic-bezier(0.2,0,0,1)';
  const fade: React.CSSProperties = {
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(8px)',
    filter: mounted ? 'blur(0px)' : 'blur(3px)',
    transition: `opacity 0.45s ${ease}, transform 0.45s ${ease}, filter 0.45s ${ease}`,
  };

  return (
    <div className="flex justify-center">
      <div style={{ position: 'relative', width: 240, height: 240, marginTop: 28 }}>

        {/* ── Layer 0: SVG track ────────────────────────────────────────── */}
        <svg width="240" height="240" viewBox="0 0 240 240"
          style={{ ...fade, position: 'absolute', inset: 0, overflow: 'visible', zIndex: 0 }}>
          <g transform="rotate(-90 120 120)">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={SW} />
          </g>
        </svg>

        {/* ── Layer 1: CSS conic-gradient ring ──────────────────────────── */}
        <div style={{
          ...fade, position: 'absolute', inset: 0, borderRadius: '50%',
          background: gradient,
          WebkitMask: RING_MASK, mask: RING_MASK, zIndex: 1,
        }} />

        {/* ── Layer 2: SVG overflow + caps + ticks ─────────────────────── */}
        <svg width="240" height="240" viewBox="0 0 240 240"
          style={{ ...fade, position: 'absolute', inset: 0, overflow: 'visible', zIndex: 2 }}>
          {overflowFrac > 0 && (
            <g transform="rotate(-90 120 120)">
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke="#ff453a" strokeWidth={SW + 2} strokeLinecap="round"
                strokeDasharray={`${overflowFrac * CIRC} ${CIRC}`}
                strokeDashoffset={0}
                style={{ filter: 'drop-shadow(0 0 14px rgba(255,69,58,0.82))' }}
              />
            </g>
          )}
          {/* Rounded caps: tiny SVG arcs with strokeLinecap round */}
          {eatenFrac > 0.01 && (
            <g transform="rotate(-90 120 120)">
              {/* Start cap at 0° (12 o'clock) */}
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke="rgba(222,226,255,0.84)" strokeWidth={SW} strokeLinecap="round"
                strokeDasharray={`0.5 ${CIRC}`} strokeDashoffset={0} />
              {/* End cap at eatenAngle */}
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke={eatenFrac <= goalFrac ? 'rgba(222,226,255,0.84)'
                      : eatenFrac >= 1 ? 'rgba(255,69,58,1)'
                      : 'rgba(255,158,10,0.88)'}
                strokeWidth={SW} strokeLinecap="round"
                strokeDasharray={`0.5 ${CIRC}`}
                strokeDashoffset={-(eatenAngle / 360 * CIRC)} />
            </g>
          )}
          {/* Expenditure tick (12 o'clock) */}
          <line x1={expInner.x} y1={expInner.y} x2={expOuter.x} y2={expOuter.y}
            stroke="rgba(255,255,255,0.22)" strokeWidth="2" strokeLinecap="round" />
          {/* Goal tick */}
          <line x1={goalInner.x} y1={goalInner.y} x2={goalOuter.x} y2={goalOuter.y}
            stroke="rgba(255,255,255,0.30)" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* ── Layer 3: Badges on the ring ──────────────────────────────── */}
        <div style={{ ...fade, position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          {/* Expenditure badge — 12 o'clock */}
          <div style={{
            ...BADGE,
            left: expBadgePos.x,
            top: expBadgePos.y,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {/* Fire icon */}
            <svg width="11" height="12" viewBox="0 0 889 1280" fill="#8a8a96" stroke="none" style={{ transform: 'scaleY(-1)' }}>
              <path d="M333 1264c-20-141-53-257-103-355-27-53-50-90-107-168-46-64-61-87-79-122-28-54-42-112-44-176-3-113 44-223 136-319 44-46 101-89 148-113 23-11 24-11 54-11l25 0 0 0c0 0-9 11-20 24-22 27-35 44-49 65-51 78-77 149-72 204 3 31 9 54 21 79 10 20 19 35 61 92 31 43 47 66 65 95 37 61 70 132 94 204l5 14 11-10c20-18 53-51 68-66 49-53 78-97 99-153 12-33 24-80 27-108 1-16 1-62-2-80-12-95-43-203-95-327-6-15-12-29-13-30l-1-2 15 0 16 0 23 18c39 30 57 46 84 72 94 92 151 192 176 305 8 38 11 68 11 111 0 43-3 70-11 112-31 158-126 316-281 469-64 63-130 118-213 178l-21 15-14 0-13 0-2-16z"/>
            </svg>
            {/* Dumbbell icon (workout days only) */}
            {workoutKcal > 0 && (
              <svg width="11" height="7" viewBox="0 0 14 8" fill="none"
                stroke="#8a8a96" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="10" y2="4" />
                <line x1="3" y1="1.5" x2="3" y2="6.5" />
                <line x1="11" y1="1.5" x2="11" y2="6.5" />
                <line x1="1.5" y1="2.5" x2="1.5" y2="5.5" />
                <line x1="12.5" y1="2.5" x2="12.5" y2="5.5" />
              </svg>
            )}
            {tweenedExp.toLocaleString('ru')}
          </div>
          {/* Goal badge — at goal angle */}
          <div style={{
            ...BADGE,
            left: goalBadgePos.x,
            top: goalBadgePos.y,
            transform: `${goalBadgeAlign} translateY(-50%)`,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {/* Crosshair icon */}
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#8a8a96" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="5" />
              <line x1="8" y1="1" x2="8" y2="4" />
              <line x1="8" y1="12" x2="8" y2="15" />
              <line x1="1" y1="8" x2="4" y2="8" />
              <line x1="12" y1="8" x2="15" y2="8" />
            </svg>
            {goalKcal.toLocaleString('ru')}
          </div>
        </div>

        {/* ── Layer 4: Center ───────────────────────────────────────────── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none"
          style={{ ...fade, zIndex: 4 }}>
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
          {/* Status chip */}
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
