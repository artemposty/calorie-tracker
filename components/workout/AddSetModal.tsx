'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Exercise } from '@/lib/types';
import { haptic } from '@/lib/haptics';
import { supabase, USER_ID } from '@/lib/supabase';

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

type Session = { date: string; sets: { weight: number; reps: number; rpe: number }[] };

interface Props {
  exercises: Exercise[];
  /** The date sets are being logged to (WorkoutTab's selected day). */
  date: string;
  /** When set, the picker is skipped — log view opens on this exercise, prefilled. */
  initialExerciseId?: string | null;
  onAdd: (params: { exerciseId: string; weight: number; reps: number; rpe: number }) => Promise<boolean>;
  onClose: () => void;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function epley(w: number, r: number) {
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

const STEP_BTN =
  'flex items-center justify-center rounded-[14px] shrink-0 active:scale-[0.92] transition-transform duration-150 ease-out';
const STEP_BTN_STYLE: React.CSSProperties = {
  width: 52, height: 52,
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  color: 'var(--text-1)', fontSize: 20, fontWeight: 500,
};

export function AddSetModal({ exercises, date, initialExerciseId, onAdd, onClose }: Props) {
  // Picker
  const [pickerView, setPickerView] = useState<'groups' | 'exercises'>('groups');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [freq, setFreq] = useState<Record<string, number>>({});

  // Log
  const [step, setStep] = useState<'pick' | 'log'>('pick');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [saving, setSaving] = useState(false);
  const [prToast, setPrToast] = useState(false);
  const [prevSessions, setPrevSessions] = useState<Session[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [prevBestE1rm, setPrevBestE1rm] = useState(0);
  const openedPrefilled = useRef(false);

  // Fetch usage frequency on mount (sorts group lists by most-used)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('workout_sets')
        .select('exercise_id')
        .eq('user_id', USER_ID);
      const freqMap: Record<string, number> = {};
      for (const r of data ?? []) {
        const id = r.exercise_id as string;
        freqMap[id] = (freqMap[id] ?? 0) + 1;
      }
      setFreq(freqMap);
    })();
  }, []);

  async function handleSelectExercise(ex: Exercise) {
    haptic('light');
    setSelectedExercise(ex);
    setStep('log');
    setHistLoading(true);

    const { data } = await supabase
      .from('workout_sets')
      .select('date, weight, reps, rpe, created_at')
      .eq('user_id', USER_ID)
      .eq('exercise_id', ex.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: true });

    const byDate: Record<string, { weight: number; reps: number; rpe: number }[]> = {};
    const dateOrder: string[] = [];
    let best = 0;

    for (const r of data ?? []) {
      const d = r.date as string;
      const w = Number(r.weight);
      const rep = r.reps as number;
      const e1rm = w * (1 + rep / 30);
      if (e1rm > best) best = e1rm;
      if (!byDate[d]) { dateOrder.push(d); byDate[d] = []; }
      byDate[d].push({ weight: w, reps: rep, rpe: Number(r.rpe ?? 0) });
    }

    setPrevBestE1rm(best);
    const sessions = dateOrder.slice(0, 5).map(d => ({ date: d, sets: byDate[d] }));
    setPrevSessions(sessions);

    // Prefill from the most recent set (today's last if the session is ongoing)
    if (sessions.length > 0 && sessions[0].sets.length > 0) {
      const last = sessions[0].sets[sessions[0].sets.length - 1];
      setWeight(String(last.weight));
      setReps(String(last.reps));
      if (last.rpe) setRpe(String(last.rpe));
    }
    setHistLoading(false);
  }

  // "+ подход" entry point: skip the picker entirely
  useEffect(() => {
    if (openedPrefilled.current || !initialExerciseId) return;
    const ex = exercises.find(e => e.id === initialExerciseId);
    if (ex) {
      openedPrefilled.current = true;
      handleSelectExercise(ex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExerciseId, exercises]);

  function goBack() {
    haptic('light');
    setSelectedExercise(null);
    setWeight(''); setReps(''); setRpe('');
    setPrevSessions([]); setPrevBestE1rm(0);
    setStep('pick');
  }

  function stepWeight(delta: number) {
    haptic('light');
    const w = parseFloat(weight) || 0;
    setWeight(String(Math.max(0, Math.round((w + delta) * 10) / 10)));
  }
  function stepReps(delta: number) {
    haptic('light');
    const r = parseInt(reps) || 0;
    setReps(String(Math.max(1, r + delta)));
  }

  async function handleAdd() {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || w < 0 || isNaN(r) || r < 1 || !rpe) return;

    const e1rm = w * (1 + r / 30);
    const isNewPr = e1rm > prevBestE1rm && prevBestE1rm > 0;

    setSaving(true);
    haptic('medium');
    const ok = await onAdd({ exerciseId: selectedExercise!.id, weight: w, reps: r, rpe: Number(rpe) });
    setSaving(false);

    if (ok) {
      if (isNewPr) { haptic('heavy'); setPrToast(true); setTimeout(() => setPrToast(false), 2500); }
      if (e1rm > prevBestE1rm) setPrevBestE1rm(e1rm);
      // Values stay for the next set (same weight is the common case);
      // append to the current session so the chips update without a refetch.
      setPrevSessions(prev => {
        const set = { weight: w, reps: r, rpe: Number(rpe) };
        const idx = prev.findIndex(s => s.date === date);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = { ...next[idx], sets: [...next[idx].sets, set] };
          return next;
        }
        return [{ date, sets: [set] }, ...prev];
      });
    }
  }

  // Derived
  const muscleGroups = useMemo(() =>
    Object.entries(MUSCLE_LABELS)
      .map(([key, label]) => ({ key, label, count: exercises.filter(e => e.primaryMuscle === key).length }))
      .filter(g => g.count > 0),
    [exercises]
  );

  const groupExercises = useMemo(() =>
    exercises
      .filter(e => e.primaryMuscle === activeGroup)
      .sort((a, b) => (freq[b.id] ?? 0) - (freq[a.id] ?? 0)),
    [exercises, activeGroup, freq]
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return exercises
      .filter(e => e.name.toLowerCase().includes(q) || (MUSCLE_LABELS[e.primaryMuscle] ?? '').toLowerCase().includes(q))
      .sort((a, b) => (freq[b.id] ?? 0) - (freq[a.id] ?? 0));
  }, [exercises, search, freq]);

  const isSearching = search.trim().length > 0;

  const currentSession = prevSessions.find(s => s.date === date) ?? null;
  const historySessions = prevSessions.filter(s => s.date !== date);

  // Live e1RM readout
  const wNum = parseFloat(weight);
  const rNum = parseInt(reps);
  const liveE1rm = !isNaN(wNum) && wNum > 0 && !isNaN(rNum) && rNum > 0 ? epley(wNum, rNum) : null;
  const isPrPreview = liveE1rm !== null && prevBestE1rm > 0 && liveE1rm > Math.round(prevBestE1rm * 10) / 10;

  let headerTitle = 'Выбери упражнение';
  if (step === 'log') headerTitle = selectedExercise?.name ?? '';
  else if (!isSearching && pickerView === 'exercises' && activeGroup) headerTitle = MUSCLE_LABELS[activeGroup] ?? activeGroup;

  const showBack = step === 'log' || (!isSearching && pickerView === 'exercises');

  function handleBack() {
    if (step === 'log') goBack();
    else { setPickerView('groups'); setActiveGroup(null); }
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
          {showBack && (
            <button onClick={handleBack} style={{ color: 'var(--text-3)', padding: '4px 0' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate" style={{ color: 'var(--text-1)' }}>{headerTitle}</p>
            {step === 'log' && selectedExercise && (
              <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>
                {MUSCLE_LABELS[selectedExercise.primaryMuscle]} · {EQUIPMENT_LABELS[selectedExercise.equipment] ?? selectedExercise.equipment}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── PICKER ── */}
        {step === 'pick' && (
          <>
            <div className="px-4 pb-3">
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={e => { setSearch(e.target.value); }}
                className="w-full text-sm px-4 py-2.5 rounded-xl outline-none"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="overflow-y-auto flex-1 pb-2 flex flex-col gap-4">
              {isSearching ? (
                <div className="px-4">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>Ничего не найдено</p>
                  ) : (
                    <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                      {searchResults.map((ex, i) => (
                        <div key={ex.id}>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-60"
                            style={{ background: 'var(--bg-card)' }}
                            onClick={() => handleSelectExercise(ex)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{ex.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                                {MUSCLE_LABELS[ex.primaryMuscle]} · {EQUIPMENT_LABELS[ex.equipment] ?? ex.equipment}
                                {freq[ex.id] ? ` · ${freq[ex.id]} подх.` : ''}
                              </p>
                            </div>
                            <svg width="16" height="16" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                          </button>
                          {i < searchResults.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : pickerView === 'groups' ? (
                <div className="px-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
                    Группы мышц
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {muscleGroups.map(g => (
                      <button
                        key={g.key}
                        className="flex flex-col gap-1 p-4 rounded-2xl text-left active:opacity-60"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                        onClick={() => { haptic('light'); setActiveGroup(g.key); setPickerView('exercises'); }}
                      >
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{g.label}</span>
                        <span className="text-xs" style={{ color: 'var(--text-4)' }}>{g.count} упр.</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-4">
                  {groupExercises.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>Нет упражнений</p>
                  ) : (
                    <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                      {groupExercises.map((ex, i) => (
                        <div key={ex.id}>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-60"
                            style={{ background: 'var(--bg-card)' }}
                            onClick={() => handleSelectExercise(ex)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{ex.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                                {EQUIPMENT_LABELS[ex.equipment] ?? ex.equipment}
                                {freq[ex.id] ? ` · ${freq[ex.id]} подх.` : ''}
                              </p>
                            </div>
                            <svg width="16" height="16" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                          </button>
                          {i < groupExercises.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── LOG ── */}
        {step === 'log' && (
          <div className="flex flex-col overflow-y-auto flex-1">
            <div className="px-4 flex flex-col gap-4 pb-4">

              {/* Current session so far */}
              {currentSession && currentSession.sets.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
                    {fmtDate(date)} · {currentSession.sets.length} подх.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSession.sets.map((s, i) => (
                      <button
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg active:opacity-60 tabular-nums"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                        onClick={() => { haptic('light'); setWeight(String(s.weight)); setReps(String(s.reps)); if (s.rpe) setRpe(String(s.rpe)); }}
                      >
                        {s.weight}×{s.reps}{s.rpe ? ` @${s.rpe}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Weight: stepper + keyboard-editable value */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: 'var(--text-3)', width: 44 }}>Вес</span>
                <button className={STEP_BTN} style={STEP_BTN_STYLE} onClick={() => stepWeight(-2.5)}>−</button>
                <div className="flex-1 flex flex-col items-center">
                  <input
                    type="number" inputMode="decimal" placeholder="0" value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full text-center rounded-xl outline-none tabular-nums"
                    style={{ background: 'transparent', color: 'var(--text-1)', fontSize: 34, fontWeight: 200, letterSpacing: '-0.03em', border: 'none' }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>кг · шаг 2.5</span>
                </div>
                <button className={STEP_BTN} style={STEP_BTN_STYLE} onClick={() => stepWeight(2.5)}>+</button>
              </div>

              {/* Reps */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: 'var(--text-3)', width: 44 }}>Повт.</span>
                <button className={STEP_BTN} style={STEP_BTN_STYLE} onClick={() => stepReps(-1)}>−</button>
                <div className="flex-1 flex flex-col items-center">
                  <input
                    type="number" inputMode="numeric" placeholder="0" value={reps}
                    onChange={e => setReps(e.target.value)}
                    className="w-full text-center rounded-xl outline-none tabular-nums"
                    style={{ background: 'transparent', color: 'var(--text-1)', fontSize: 34, fontWeight: 200, letterSpacing: '-0.03em', border: 'none' }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>повторений</span>
                </div>
                <button className={STEP_BTN} style={STEP_BTN_STYLE} onClick={() => stepReps(1)}>+</button>
              </div>

              {/* RPE */}
              <div className="flex gap-1.5 flex-wrap">
                {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => (
                  <button
                    key={v}
                    onClick={() => { haptic('light'); setRpe(rpe === String(v) ? '' : String(v)); }}
                    className="flex-1 text-sm font-semibold py-2 rounded-[10px] active:opacity-60 transition-colors tabular-nums"
                    style={{
                      minWidth: 34,
                      background: rpe === String(v) ? 'var(--text-1)' : 'var(--bg-elevated)',
                      color: rpe === String(v) ? 'var(--bg)' : 'var(--text-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Live e1RM + PR preview */}
              {liveE1rm !== null && (
                <p
                  className="text-center text-xs tabular-nums"
                  style={{ color: isPrPreview ? 'var(--success)' : 'var(--text-3)', fontWeight: isPrPreview ? 650 : 400 }}
                >
                  {isPrPreview
                    ? <>🏆 e1RM {liveE1rm} кг — будет новый рекорд (лучший {Math.round(prevBestE1rm * 10) / 10})</>
                    : <>e1RM {liveE1rm} кг{prevBestE1rm > 0 ? <span style={{ color: 'var(--text-4)' }}> · рекорд {Math.round(prevBestE1rm * 10) / 10} кг</span> : null}</>}
                </p>
              )}

              {/* Add button */}
              <button
                onClick={handleAdd}
                disabled={saving || !weight || !reps || !rpe}
                className="w-full py-4 rounded-xl font-bold text-base active:opacity-80 transition-opacity disabled:opacity-40"
                style={{ background: 'var(--text-1)', color: 'var(--bg)' }}
              >
                {saving ? 'Сохраняем...' : 'Добавить подход'}
              </button>

              {/* Previous sessions */}
              {histLoading ? (
                <div className="skeleton h-16 rounded-xl" />
              ) : historySessions.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
                    История
                  </p>
                  {historySessions.map(session => (
                    <div key={session.date}>
                      <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
                        {fmtDate(session.date)} · <span style={{ color: 'var(--text-4)' }}>{session.sets.length} подх.</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {session.sets.map((s, i) => (
                          <button
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-lg active:opacity-60 tabular-nums"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                            onClick={() => { haptic('light'); setWeight(String(s.weight)); setReps(String(s.reps)); if (s.rpe) setRpe(String(s.rpe)); }}
                          >
                            {s.weight}×{s.reps}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PR toast */}
      {prToast && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-2xl text-center card-appear z-[60]"
          style={{ background: 'var(--text-1)', color: 'var(--bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          <p className="text-2xl mb-1">🏆</p>
          <p className="font-bold text-base">Новый рекорд!</p>
        </div>
      )}
    </div>
  );
}
