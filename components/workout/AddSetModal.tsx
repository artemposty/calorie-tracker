'use client';

import { useState, useMemo } from 'react';
import { Exercise } from '@/lib/types';
import { haptic } from '@/lib/haptics';
import { useLastSession } from '@/hooks/useWorkout';

interface Props {
  exercises: Exercise[];
  onAdd: (params: { exerciseId: string; weight: number; reps: number; rpe?: number }) => Promise<boolean>;
  onClose: () => void;
}

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

export function AddSetModal({ exercises, onAdd, onClose }: Props) {
  const [step, setStep] = useState<'pick' | 'log'>('pick');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [filter, setFilter] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [saving, setSaving] = useState(false);
  const [prToast, setPrToast] = useState(false);

  const lastSession = useLastSession(selectedExercise?.id ?? null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (MUSCLE_LABELS[e.primaryMuscle] ?? e.primaryMuscle).toLowerCase().includes(q),
    );
  }, [exercises, filter]);

  // Group by primary muscle
  const grouped = useMemo(() => {
    const g: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      const label = MUSCLE_LABELS[ex.primaryMuscle] ?? ex.primaryMuscle;
      if (!g[label]) g[label] = [];
      g[label].push(ex);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b, 'ru'));
  }, [filtered]);

  function selectExercise(ex: Exercise) {
    haptic('light');
    setSelectedExercise(ex);
    // Pre-fill from last session
    if (lastSession && lastSession.sets.length > 0) {
      const last = lastSession.sets[lastSession.sets.length - 1];
      setWeight(String(last.weight));
      setReps(String(last.reps));
    }
    setStep('log');
  }

  // When exercise changes (via back), refill from that new last session
  function goBack() {
    haptic('light');
    setSelectedExercise(null);
    setWeight('');
    setReps('');
    setRpe('');
    setStep('pick');
  }

  async function handleAdd() {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || w < 0 || isNaN(r) || r < 1) return;

    // Check PR (Epley)
    const e1rm = w * (1 + r / 30);
    const prevBest = lastSession
      ? Math.max(...lastSession.sets.map(s => s.weight * (1 + s.reps / 30)))
      : 0;
    const isNewPr = e1rm > prevBest && prevBest > 0;

    setSaving(true);
    haptic('medium');
    const ok = await onAdd({
      exerciseId: selectedExercise!.id,
      weight: w,
      reps: r,
      rpe: rpe ? parseInt(rpe) : undefined,
    });
    setSaving(false);

    if (ok) {
      if (isNewPr) {
        haptic('heavy');
        setPrToast(true);
        setTimeout(() => setPrToast(false), 2500);
      }
      // Reset for next set
      setWeight('');
      setReps('');
      setRpe('');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end modal-backdrop"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-sheet w-full flex flex-col"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '90dvh',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          {step === 'log' && (
            <button onClick={goBack} style={{ color: 'var(--text-3)', padding: '4px 0' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <p className="text-base font-semibold flex-1" style={{ color: 'var(--text-1)' }}>
            {step === 'pick' ? 'Выбери упражнение' : selectedExercise?.name}
          </p>
          <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {step === 'pick' ? (
          <>
            {/* Search */}
            <div className="px-4 pb-2">
              <input
                type="text"
                placeholder="Поиск..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl outline-none"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
              />
            </div>

            {/* Exercise list */}
            <div className="overflow-y-auto flex-1 px-4 pb-2">
              {grouped.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>
                  Ничего не найдено
                </p>
              )}
              {grouped.map(([muscle, exs]) => (
                <div key={muscle} className="mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-4)' }}>
                    {muscle}
                  </p>
                  <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    {exs.map((ex, i) => (
                      <div key={ex.id}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-60"
                          style={{ background: 'var(--bg-card)' }}
                          onClick={() => selectExercise(ex)}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{ex.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                              {EQUIPMENT_LABELS[ex.equipment] ?? ex.equipment}
                            </p>
                          </div>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--text-4)' }}>
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                        {i < exs.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-4 flex flex-col gap-4 overflow-y-auto">
            {/* Last session hint */}
            {lastSession && lastSession.sets.length > 0 && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>
                  Прошлый раз · {lastSession.date}
                </p>
                <div className="flex flex-wrap gap-2">
                  {lastSession.sets.map((s, i) => (
                    <button
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg active:opacity-60"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                      onClick={() => { haptic('light'); setWeight(String(s.weight)); setReps(String(s.reps)); }}
                    >
                      {s.weight} кг × {s.reps}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Weight + Reps inputs */}
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Вес (кг)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full text-center text-2xl font-bold rounded-xl py-4 outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Повторения</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  className="w-full text-center text-2xl font-bold rounded-xl py-4 outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            {/* RPE (optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>RPE (необязательно)</label>
              <div className="flex gap-1.5 flex-wrap">
                {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => (
                  <button
                    key={v}
                    onClick={() => { haptic('light'); setRpe(rpe === String(v) ? '' : String(v)); }}
                    className="text-sm font-semibold px-3 py-2 rounded-lg active:opacity-60 transition-colors"
                    style={{
                      background: rpe === String(v) ? 'var(--text-1)' : 'var(--bg-elevated)',
                      color: rpe === String(v) ? 'var(--bg)' : 'var(--text-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              disabled={saving || !weight || !reps}
              className="w-full py-4 rounded-xl font-bold text-base active:opacity-80 transition-opacity disabled:opacity-40"
              style={{ background: 'var(--text-1)', color: 'var(--bg)' }}
            >
              {saving ? 'Сохраняем...' : 'Добавить подход'}
            </button>
          </div>
        )}
      </div>

      {/* PR toast */}
      {prToast && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-2xl text-center card-appear z-50"
          style={{ background: 'var(--text-1)', color: 'var(--bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          <p className="text-2xl mb-1">🏆</p>
          <p className="font-bold text-base">Новый рекорд!</p>
        </div>
      )}
    </div>
  );
}
