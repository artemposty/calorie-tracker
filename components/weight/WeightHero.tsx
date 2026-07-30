'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { haptic } from '@/lib/haptics';

interface Props {
  /** Starting value for the ruler: today's saved weight, or last known. */
  initial: number;
  /** Today's persisted weight — null if not weighed today yet. */
  savedToday: number | null;
  /** First-ever entry, for the "от старта" chip. Null hides the chip. */
  startWeight: number | null;
  onSave: (weight: number) => void;
}

const PX_PER_KG = 80; // 8px per 0.1 kg tick
const RANGE_KG = 8;   // ruler spans initial ±8 kg

function todayLabel(): string {
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const d = new Date();
  return `Сегодня · ${d.getDate()} ${months[d.getMonth()]}`;
}

export function WeightHero({ initial, savedToday, startWeight, onSave }: Props) {
  const [value, setValue] = useState(() => Math.round(initial * 10) / 10);
  const [justSaved, setJustSaved] = useState(false);
  const [wrapWidth, setWrapWidth] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const startClientX = useRef(0);
  const startValue = useRef(value);
  const lastTick = useRef(value);
  const locked = useRef<'h' | 'v' | null>(null);
  const startClientY = useRef(0);

  // Ruler bounds are fixed at mount so the strip doesn't shift under the finger
  const minW = useRef(Math.max(30, Math.round(initial) - RANGE_KG)).current;
  const maxW = minW + RANGE_KG * 2;

  useLayoutEffect(() => {
    function measure() { if (wrapRef.current) setWrapWidth(wrapRef.current.getBoundingClientRect().width); }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const dirty = savedToday === null || Math.abs(value - savedToday) > 0.001;
  const barVisible = dirty || justSaved;

  function clampRound(v: number) {
    return Math.round(Math.min(maxW, Math.max(minW, v)) * 10) / 10;
  }

  function onTouchStart(e: React.TouchEvent) {
    startClientX.current = e.touches[0].clientX;
    startClientY.current = e.touches[0].clientY;
    startValue.current = value;
    locked.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startClientX.current;
    const dy = e.touches[0].clientY - startClientY.current;
    if (locked.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      locked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }
    if (locked.current !== 'h') return;
    const next = clampRound(startValue.current - dx / PX_PER_KG);
    if (next !== value) {
      setValue(next);
      if (Math.abs(next - lastTick.current) >= 0.1) {
        lastTick.current = next;
        haptic('light');
      }
    }
  }

  function handleSave() {
    haptic('success');
    onSave(value);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 900);
  }

  const delta = startWeight !== null ? value - startWeight : null;
  const deltaGood = delta !== null && delta < 0;

  // Ticks
  const ticks: React.ReactNode[] = [];
  for (let v = minW * 10; v <= maxW * 10; v++) {
    const kg = v / 10;
    const x = (kg - minW) * PX_PER_KG;
    const isBig = v % 10 === 0;
    const isMid = !isBig && v % 5 === 0;
    ticks.push(
      <div key={v} style={{
        position: 'absolute', bottom: 14, left: x, width: 1.5, borderRadius: 1,
        height: isBig ? 22 : isMid ? 15 : 9,
        background: isBig ? 'rgba(255,255,255,0.42)' : isMid ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.16)',
      }} />
    );
    if (isBig) {
      ticks.push(
        <div key={`l${v}`} className="tabular-nums" style={{
          position: 'absolute', bottom: 0, left: x, transform: 'translateX(-50%)',
          fontSize: 9, fontWeight: 600, color: 'var(--text-4)',
        }}>{kg}</div>
      );
    }
  }

  const stripOffset = wrapWidth / 2 - (value - minW) * PX_PER_KG;

  return (
    <div className="mx-4 rounded-[20px] overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', paddingTop: 20 }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--text-3)' }}>
        {todayLabel()}
      </p>

      {/* The one big number: display AND input */}
      <div className="flex items-baseline justify-center gap-1.5 mt-2">
        <span className="tabular-nums" style={{ fontSize: 64, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
          {value.toFixed(1)}
        </span>
        <span className="text-base" style={{ color: 'var(--text-3)' }}>кг</span>
      </div>

      {/* Delta-from-start chip — same pill language as the calorie ring's deficit chip */}
      {delta !== null && (
        <div className="flex justify-center mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tabular-nums"
            style={{
              background: deltaGood ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)',
              border: `1px solid ${deltaGood ? 'rgba(48,209,88,0.26)' : 'rgba(255,69,58,0.26)'}`,
              color: deltaGood ? 'var(--success)' : 'var(--danger)',
            }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {deltaGood
                ? <polyline points="2,3.5 5,6.5 8,3.5" />
                : <polyline points="2,6.5 5,3.5 8,6.5" />}
            </svg>
            {Math.abs(delta).toFixed(1)}&thinsp;кг от старта
          </span>
        </div>
      )}

      {/* Scale ruler — drag left/right, 0.1 kg per tick */}
      <div
        ref={wrapRef}
        className="relative mt-4"
        // overflow:hidden here too — the tick strip is ~1280px wide and must
        // not be able to widen the document if the card's clipping ever moves.
        style={{ height: 64, touchAction: 'pan-y', cursor: 'grab', overflow: 'hidden' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 pointer-events-none z-[1]" style={{ width: 70, background: 'linear-gradient(to right, var(--bg-card), transparent)' }} />
        <div className="absolute inset-y-0 right-0 pointer-events-none z-[1]" style={{ width: 70, background: 'linear-gradient(to left, var(--bg-card), transparent)' }} />
        {/* Center pointer */}
        <div className="absolute pointer-events-none z-[2]" style={{
          left: '50%', top: 6, transform: 'translateX(-50%)',
          width: 2, height: 34, borderRadius: 1, background: 'var(--text-1)',
          boxShadow: '0 0 8px rgba(255,255,255,0.45)',
        }} />
        {/* Tick strip */}
        {wrapWidth > 0 && (
          <div style={{
            position: 'absolute', top: 12, height: 40,
            width: (maxW - minW) * PX_PER_KG,
            transform: `translateX(${stripOffset}px)`,
            willChange: 'transform',
          }}>
            {ticks}
          </div>
        )}
      </div>

      {/* Contextual save — only exists when there's something to save */}
      <div style={{
        maxHeight: barVisible ? 72 : 0,
        opacity: barVisible ? 1 : 0,
        padding: barVisible ? '14px 16px 16px' : '0 16px',
        overflow: 'hidden',
        transition: 'max-height 0.3s cubic-bezier(0.2,0,0,1), opacity 0.3s cubic-bezier(0.2,0,0,1), padding 0.3s',
      }}>
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl text-[13.5px] font-bold active:scale-[0.96] transition-transform duration-150 ease-out"
          style={{
            background: justSaved ? 'var(--success)' : '#ffffff',
            color: justSaved ? '#fff' : '#0a0a0b',
            transition: 'background 0.25s, color 0.25s',
          }}
        >
          {justSaved ? '✓ Сохранено' : `Сохранить ${value.toFixed(1)} кг`}
        </button>
      </div>
    </div>
  );
}
