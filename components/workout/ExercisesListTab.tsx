'use client';

import { useState, useMemo } from 'react';
import { Exercise } from '@/lib/types';
import { haptic } from '@/lib/haptics';
import { ExerciseFormModal } from './ExerciseFormModal';

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
  onAdd: (ex: Omit<Exercise, 'id' | 'isCustom' | 'isSystem' | 'displayOrder'>) => Promise<boolean>;
  onUpdate: (id: string, updates: {
    name?: string;
    primaryMuscle?: Exercise['primaryMuscle'];
    secondaryMuscles?: Exercise['secondaryMuscles'];
    equipment?: Exercise['equipment'];
    notes?: string | null;
  }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function ExercisesListTab({ exercises, loading, onAdd, onUpdate, onDelete }: Props) {
  const [search,       setSearch]      = useState('');
  const [collapsed,    setCollapsed]   = useState<Set<string>>(new Set());
  const [showAdd,      setShowAdd]     = useState(false);
  const [editTarget,   setEditTarget]  = useState<Exercise | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (MUSCLE_LABELS[e.primaryMuscle] ?? '').toLowerCase().includes(q),
    );
  }, [exercises, search]);

  const grouped = useMemo(() => {
    const g: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      const label = MUSCLE_LABELS[ex.primaryMuscle] ?? ex.primaryMuscle;
      if (!g[label]) g[label] = [];
      g[label].push(ex);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b, 'ru'));
  }, [filtered]);

  function toggleGroup(label: string) {
    haptic('light');
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  async function handleDelete(id: string) {
    haptic('medium');
    await onDelete(id);
    setConfirmDelete(null);
  }

  if (loading) {
    return (
      <div className="px-4 flex flex-col gap-2 mt-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
      </div>
    );
  }

  const isSearching = search.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Search + Add button */}
      <div className="px-4 flex gap-2">
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
        />
        <button
          onClick={() => { haptic('medium'); setShowAdd(true); }}
          className="flex items-center justify-center rounded-xl px-3 active:opacity-70"
          style={{ background: 'var(--text-1)', color: 'var(--bg)', border: '1px solid var(--border)', minWidth: 44 }}
          aria-label="Добавить упражнение"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Grouped list */}
      <div className="px-4 flex flex-col gap-2 pb-4">
        {grouped.map(([muscle, exs]) => {
          const isCollapsed = !isSearching && collapsed.has(muscle);
          return (
            <div key={muscle}>
              {/* Group header — tappable to collapse */}
              <button
                className="w-full flex items-center justify-between py-1.5 active:opacity-60"
                onClick={() => toggleGroup(muscle)}
                disabled={isSearching}
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
                  {muscle} <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>({exs.length})</span>
                </p>
                {!isSearching && (
                  <svg
                    width="14" height="14" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24"
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>

              {!isCollapsed && (
                <div style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {exs.map((ex, i) => (
                    <div key={ex.id}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                            {ex.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                            {EQUIPMENT_LABELS[ex.equipment] ?? ex.equipment}
                            {ex.secondaryMuscles.length > 0 && (
                              <> · {ex.secondaryMuscles.map(m => MUSCLE_LABELS[m] ?? m).join(', ')}</>
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { haptic('light'); setEditTarget(ex); }}
                            className="p-2 rounded-lg active:opacity-60"
                            style={{ color: 'var(--text-3)' }}
                            aria-label="Редактировать"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {confirmDelete === ex.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(ex.id)}
                                className="text-xs px-2 py-1 rounded-lg font-semibold"
                                style={{ background: 'var(--danger)', color: '#fff' }}
                              >
                                Удалить
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-xs px-2 py-1 rounded-lg"
                                style={{ color: 'var(--text-3)', background: 'var(--bg-elevated)' }}
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { haptic('light'); setConfirmDelete(ex.id); }}
                              className="p-2 rounded-lg active:opacity-60"
                              style={{ color: 'var(--text-3)' }}
                              aria-label="Удалить"
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      {i < exs.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-3)' }}>Ничего не найдено</p>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <ExerciseFormModal
          onSave={onAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <ExerciseFormModal
          initial={editTarget}
          onSave={async data => {
            const ok = await onUpdate(editTarget.id, data);
            return ok;
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
