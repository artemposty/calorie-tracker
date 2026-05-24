'use client';

import { useEffect, useRef, useState } from 'react';
import { WorkoutSetWithExercise } from '@/lib/types';
import { haptic } from '@/lib/haptics';

function epley(weight: number, reps: number) {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

interface SetRowProps {
  s: WorkoutSetWithExercise & { e1rm?: number };
  index: number;
  onDelete: (id: string) => void;
}

function SetRow({ s, index, onDelete }: SetRowProps) {
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
      <div className="absolute inset-y-0 right-0 flex items-center justify-center" style={{ width: 80, background: 'var(--danger)' }}>
        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </div>
      <div
        ref={rowRef}
        style={{ transform: `translateX(${offset}px)`, transition: snapping ? 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none', background: 'var(--bg-card)', willChange: 'transform', touchAction: 'pan-y' }}
        onTouchStart={e => { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; dir.current = null; setSnapping(false); }}
        onTouchEnd={() => { setSnapping(true); if (offset <= -65) { haptic('heavy'); setOffset(-80); setTimeout(() => onDelete(s.id), 220); } else { if (offset < -8) haptic('light'); setOffset(0); } }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-xs font-bold tabular-nums w-5 text-right shrink-0" style={{ color: 'var(--text-4)' }}>{index + 1}</span>
          <div className="flex-1">
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-1)' }}>
              {s.weight} кг × {s.reps}
            </span>
            {s.rpe !== undefined && (
              <span className="ml-2 text-xs" style={{ color: 'var(--text-3)' }}>@{s.rpe}</span>
            )}
          </div>
          <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--text-3)' }}>
            e1RM {epley(s.weight, s.reps)} кг
          </span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  byExercise: Record<string, { exercise: WorkoutSetWithExercise['exercise']; sets: (WorkoutSetWithExercise & { e1rm: number })[] }>;
  totalSets: number;
  totalTonnage: number;
  onDelete: (id: string) => void;
}

export function TodayCard({ byExercise, totalSets, totalTonnage, onDelete }: Props) {
  const groups = Object.values(byExercise);

  if (groups.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 mx-4 py-10"
        style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}
      >
        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
          <path d="M6.5 6.5h11M6.5 17.5h11M3 12h2m14 0h2M5 9.5l-2 2.5 2 2.5M19 9.5l2 2.5-2 2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Нет подходов за сегодня</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      {/* Summary strip */}
      {totalSets > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl px-4 py-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{totalSets}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>подходов</p>
          </div>
          <div className="flex-1 rounded-xl px-4 py-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{totalTonnage.toLocaleString('ru')}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>кг тоннаж</p>
          </div>
        </div>
      )}

      {/* Per-exercise groups */}
      {groups.map(({ exercise, sets }) => (
        <div key={exercise.id} style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="px-4 py-2.5 flex items-center" style={{ background: 'var(--bg-elevated)' }}>
            <p className="font-semibold text-sm flex-1" style={{ color: 'var(--text-1)' }}>{exercise.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{sets.length} подх.</p>
          </div>
          {sets.map((s, i) => (
            <div key={s.id}>
              <SetRow s={s} index={i} onDelete={onDelete} />
              {i < sets.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 40 }} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
