'use client';

import { useEffect, useRef, useState } from 'react';
import { WeightEntry } from '@/lib/types';
import { formatDisplayDate } from '@/lib/storage';
import { haptic } from '@/lib/haptics';

interface SwipeRowProps { children: React.ReactNode; onDelete: () => void; }

function SwipeRow({ children, onDelete }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dir = useRef<'h' | 'v' | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    function onMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (!dir.current) {
        if (Math.abs(dx) > Math.abs(dy) + 6) dir.current = 'h';
        else if (Math.abs(dy) > 6) dir.current = 'v';
        return;
      }
      if (dir.current === 'h') { e.preventDefault(); if (dx < 0) setOffset(Math.max(dx, -80)); }
    }
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{ width: 80, background: 'var(--danger)' }}>
        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </div>
      <div ref={rowRef} style={{ transform: `translateX(${offset}px)`, transition: snapping ? 'transform 0.32s cubic-bezier(0.4,0,0.2,1)' : 'none', background: 'var(--bg-card)', touchAction: 'pan-y' }}
        onTouchStart={e => { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; dir.current = null; setSnapping(false); }}
        onTouchEnd={() => { setSnapping(true); if (offset <= -65) { haptic('heavy'); setOffset(-80); setTimeout(onDelete, 220); } else { setOffset(0); } }}>
        {children}
      </div>
    </div>
  );
}

interface Props { entries: WeightEntry[]; onDelete: (id: string) => void; }

export function WeightHistory({ entries, onDelete }: Props) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div className="mx-4 rounded-2xl flex items-center justify-center min-h-20"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Нет записей</p>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>История</p>
      <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {sorted.map((entry, i) => (
          <div key={entry.id}>
            <SwipeRow onDelete={() => onDelete(entry.id)}>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm" style={{ color: 'var(--text-2)' }}>{formatDisplayDate(entry.date)}</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-1)' }}>
                  {entry.weight.toFixed(1)} кг
                </span>
              </div>
            </SwipeRow>
            {i < sorted.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
