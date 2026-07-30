'use client';

import { useEffect, useRef, useState } from 'react';
import { WorkoutSetWithExercise } from '@/lib/types';
import { MUSCLE_LABELS } from '@/hooks/useWorkoutStats';
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
  const [awaitConfirm, setAwaitConfirm] = useState(false);
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

  function handleDelete() {
    haptic('heavy');
    setSnapping(true);
    setOffset(0);
    setAwaitConfirm(false);
    onDelete(s.id);
  }

  function handleCancel() {
    setSnapping(true);
    setOffset(0);
    setAwaitConfirm(false);
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="absolute inset-y-0 right-0 flex items-center justify-center" style={{ width: 80, background: 'var(--danger)' }}>
        {awaitConfirm ? (
          <div className="flex flex-col w-full items-center gap-1 px-2">
            <button onClick={handleDelete} className="w-full text-xs font-bold text-white py-1 active:opacity-70">
              Удалить
            </button>
            <button onClick={handleCancel} className="w-full text-[10px] active:opacity-70" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Отмена
            </button>
          </div>
        ) : (
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        )}
      </div>
      <div
        ref={rowRef}
        style={{ transform: `translateX(${offset}px)`, transition: snapping ? 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none', background: 'var(--bg-card)', willChange: 'transform', touchAction: 'pan-y' }}
        onTouchStart={e => { if (awaitConfirm) return; startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; dir.current = null; setSnapping(false); }}
        onTouchEnd={() => {
          setSnapping(true);
          if (offset <= -65) { haptic('medium'); setOffset(-80); setAwaitConfirm(true); }
          else { if (offset < -8) haptic('light'); setOffset(0); setAwaitConfirm(false); }
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-xs font-bold tabular-nums w-5 text-right shrink-0" style={{ color: 'var(--text-4)' }}>{index + 1}</span>
          <div className="flex-1">
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-1)' }}>
              {s.weight} кг × {s.reps}
            </span>
            {s.rpe !== undefined && s.rpe > 0 && (
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

function fmtLastWorkout(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const wd = days[d.getDay()];
  if (diffDays === 1) return `вчера`;
  if (diffDays < 7) return `${wd}, ${diffDays} дн. назад`;
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

interface Props {
  byExercise: Record<string, { exercise: WorkoutSetWithExercise['exercise']; sets: (WorkoutSetWithExercise & { e1rm: number })[] }>;
  onDelete: (id: string) => void;
  onAddSet: (exerciseId: string) => void;
  lastWorkout: { date: string; muscles: string[]; totalSets: number } | null;
}

export function TodayCard({ byExercise, onDelete, onAddSet, lastWorkout }: Props) {
  const groups = Object.values(byExercise);

  if (groups.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 mx-4 py-9 text-center"
        style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}
      >
        <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
          <path d="M6.5 6.5h11M6.5 17.5h11M3 12h2m14 0h2M5 9.5l-2 2.5 2 2.5M19 9.5l2 2.5-2 2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Нет подходов за этот день</p>
        {lastWorkout && (
          <p className="text-xs tabular-nums" style={{ color: 'var(--text-4)' }}>
            Последняя тренировка — {fmtLastWorkout(lastWorkout.date)}
            <br />
            {lastWorkout.muscles.map(m => MUSCLE_LABELS[m] ?? m).join(' · ')} · {lastWorkout.totalSets} подх.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      {groups.map(({ exercise, sets }) => (
        <div key={exercise.id} style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'var(--bg-elevated)' }}>
            <p className="font-semibold text-sm flex-1 truncate" style={{ color: 'var(--text-1)' }}>{exercise.name}</p>
            <button
              onClick={() => { haptic('light'); onAddSet(exercise.id); }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 active:scale-[0.94] transition-transform duration-150 ease-out"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-1)' }}
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              подход
            </button>
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
