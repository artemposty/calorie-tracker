'use client';

import { useEffect, useRef, useState } from 'react';
import { FoodEntry } from '@/lib/types';
import { haptic } from '@/lib/haptics';

interface SwipeRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

function SwipeRow({ children, onDelete }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const direction = useRef<'h' | 'v' | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // Non-passive touchmove to allow preventDefault on horizontal swipe
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    function onMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (!direction.current) {
        if (Math.abs(dx) > Math.abs(dy) + 6) direction.current = 'h';
        else if (Math.abs(dy) > 6) direction.current = 'v';
        return;
      }
      if (direction.current === 'h') {
        e.preventDefault();
        if (dx < 0) setOffset(Math.max(dx, -80));
      }
    }

    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    direction.current = null;
    setSnapping(false);
  }

  function onTouchEnd() {
    setSnapping(true);
    if (offset <= -65) {
      haptic('heavy');
      setOffset(-80);
      setTimeout(onDelete, 220);
    } else {
      if (offset < -8) haptic('light');
      setOffset(0);
    }
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Delete background */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{ width: 80, background: 'var(--danger)' }}
      >
        <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </div>
      {/* Row */}
      <div
        ref={rowRef}
        style={{
          transform: `translateX(${offset}px)`,
          transition: snapping ? 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          background: 'var(--bg-card)',
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

interface Props {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
}

export function MealList({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-20 mx-4"
        style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Нет записей за этот день</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>
        Приёмы пищи
      </p>
      <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {entries.map((entry, i) => (
          <div key={entry.id}>
            <SwipeRow onDelete={() => onDelete(entry.id)}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>
                    {entry.name}
                  </p>
                  <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--text-3)' }}>
                    {entry.grams} г · Б {Math.round(entry.p * 10) / 10} · Ж {Math.round(entry.f * 10) / 10} · У {Math.round(entry.c * 10) / 10}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums shrink-0" style={{ color: 'var(--kcal)' }}>
                  {Math.round(entry.kcal)} ккал
                </p>
              </div>
            </SwipeRow>
            {i < entries.length - 1 && (
              <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
