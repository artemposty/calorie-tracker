'use client';

import { useState, useMemo } from 'react';
import { Exercise } from '@/lib/types';
import { haptic } from '@/lib/haptics';
import { ExerciseIcon } from './ExerciseIcon';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Грудь', back: 'Спина', shoulders: 'Плечи',
  biceps: 'Бицепс', triceps: 'Трицепс', legs: 'Ноги',
  glutes: 'Ягодицы', core: 'Кор', calves: 'Икры',
  forearms: 'Предплечья', lower_back: 'Поясница',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Штанга', dumbbell: 'Гантели', machine: 'Тренажёр',
  cable: 'Кабель', bodyweight: 'Вес тела', other: 'Другое',
};

interface Props {
  exercises: Exercise[];
  loading: boolean;
}

export function ExercisesListTab({ exercises, loading }: Props) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);

  const muscles = useMemo(() => [...new Set(exercises.map(e => e.primaryMuscle))].sort(), [exercises]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter(e => {
      if (muscleFilter && e.primaryMuscle !== muscleFilter) return false;
      if (q) return e.name.toLowerCase().includes(q) || (MUSCLE_LABELS[e.primaryMuscle] ?? '').toLowerCase().includes(q);
      return true;
    });
  }, [exercises, search, muscleFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      const label = MUSCLE_LABELS[ex.primaryMuscle] ?? ex.primaryMuscle;
      if (!g[label]) g[label] = [];
      g[label].push(ex);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b, 'ru'));
  }, [filtered]);

  if (loading) {
    return (
      <div className="px-4 flex flex-col gap-2 mt-2">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="px-4">
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-sm px-4 py-2.5 rounded-xl outline-none"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
        />
      </div>

      {/* Muscle chips */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => { haptic('light'); setMuscleFilter(null); }}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
          style={{
            background: !muscleFilter ? 'var(--text-1)' : 'var(--bg-elevated)',
            color: !muscleFilter ? 'var(--bg)' : 'var(--text-3)',
            border: '1px solid var(--border)',
          }}
        >
          Все
        </button>
        {muscles.map(m => (
          <button
            key={m}
            onClick={() => { haptic('light'); setMuscleFilter(muscleFilter === m ? null : m); }}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              background: muscleFilter === m ? 'var(--text-1)' : 'var(--bg-elevated)',
              color: muscleFilter === m ? 'var(--bg)' : 'var(--text-3)',
              border: '1px solid var(--border)',
            }}
          >
            {MUSCLE_LABELS[m] ?? m}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 flex flex-col gap-3 pb-4">
        {grouped.map(([muscle, exs]) => (
          <div key={muscle}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-4)' }}>
              {muscle}
            </p>
            <div style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {exs.map((ex, i) => (
                <div key={ex.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-xl"
                      style={{ width: 42, height: 42, background: 'var(--bg-elevated)', color: 'var(--text-3)' }}
                    >
                      <ExerciseIcon iconId={ex.id} name={ex.name} size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{ex.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {EQUIPMENT_LABELS[ex.equipment] ?? ex.equipment}
                        {ex.secondaryMuscles.length > 0 && (
                          <> · {ex.secondaryMuscles.map(m => MUSCLE_LABELS[m] ?? m).join(', ')}</>
                        )}
                      </p>
                    </div>
                  </div>
                  {i < exs.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 58 }} />}
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-3)' }}>Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
