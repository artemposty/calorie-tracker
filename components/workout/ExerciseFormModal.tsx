'use client';

import { useState } from 'react';
import { Exercise } from '@/lib/types';
import { haptic } from '@/lib/haptics';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Грудь', back: 'Спина', shoulders: 'Плечи',
  biceps: 'Бицепс', triceps: 'Трицепс', legs: 'Ноги',
  glutes: 'Ягодицы', core: 'Кор', calves: 'Икры',
  forearms: 'Предплечья', lower_back: 'Поясница',
};

const EQUIPMENT_LABELS: Record<Exercise['equipment'], string> = {
  barbell: 'Штанга', dumbbell: 'Гантели', machine: 'Тренажёр',
  cable: 'Кабель', bodyweight: 'Вес тела', other: 'Другое',
};

const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as Exercise['primaryMuscle'][];
const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABELS) as Exercise['equipment'][];

type FormData = {
  name: string;
  primaryMuscle: Exercise['primaryMuscle'] | null;
  secondaryMuscles: Exercise['secondaryMuscles'];
  equipment: Exercise['equipment'] | null;
  notes: string;
};

interface Props {
  initial?: Exercise;
  onSave: (data: Omit<Exercise, 'id' | 'isCustom' | 'isSystem' | 'displayOrder'>) => Promise<boolean>;
  onClose: () => void;
}

export function ExerciseFormModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormData>({
    name:             initial?.name ?? '',
    primaryMuscle:    initial?.primaryMuscle ?? null,
    secondaryMuscles: initial?.secondaryMuscles ?? [],
    equipment:        initial?.equipment ?? null,
    notes:            initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const isEditing = Boolean(initial);

  function toggleSecondary(m: Exercise['primaryMuscle']) {
    setForm(f => ({
      ...f,
      secondaryMuscles: f.secondaryMuscles.includes(m)
        ? f.secondaryMuscles.filter(s => s !== m)
        : [...f.secondaryMuscles, m],
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Введи название'); return; }
    if (!form.primaryMuscle)  { setError('Выбери основную мышцу'); return; }
    if (!form.equipment)      { setError('Выбери снаряжение'); return; }
    setSaving(true);
    haptic('medium');
    const ok = await onSave({
      name:             form.name.trim(),
      primaryMuscle:    form.primaryMuscle,
      secondaryMuscles: form.secondaryMuscles,
      equipment:        form.equipment,
      notes:            form.notes.trim() || undefined,
    });
    setSaving(false);
    if (ok) { onClose(); }
    else    { setError('Не удалось сохранить'); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-sheet flex flex-col"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '92dvh',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
            {isEditing ? 'Редактировать' : 'Новое упражнение'}
          </p>
          <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 flex flex-col gap-5 pb-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Название</label>
            <input
              type="text"
              placeholder="Жим штанги лёжа"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(''); }}
              className="w-full text-sm px-4 py-3 rounded-xl outline-none"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Primary muscle */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Основная мышца</label>
            <div className="flex flex-wrap gap-2">
              {ALL_MUSCLES.map(m => (
                <button
                  key={m}
                  onClick={() => { haptic('light'); setForm(f => ({ ...f, primaryMuscle: m, secondaryMuscles: f.secondaryMuscles.filter(s => s !== m) })); setError(''); }}
                  className="text-sm px-3.5 py-1.5 rounded-full font-medium active:opacity-60"
                  style={{
                    background: form.primaryMuscle === m ? 'var(--text-1)' : 'var(--bg-elevated)',
                    color:      form.primaryMuscle === m ? 'var(--bg)'     : 'var(--text-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {MUSCLE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary muscles */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Вторичные мышцы (необязательно)</label>
            <div className="flex flex-wrap gap-2">
              {ALL_MUSCLES.filter(m => m !== form.primaryMuscle).map(m => (
                <button
                  key={m}
                  onClick={() => { haptic('light'); toggleSecondary(m); }}
                  className="text-sm px-3.5 py-1.5 rounded-full font-medium active:opacity-60"
                  style={{
                    background: form.secondaryMuscles.includes(m) ? 'rgba(255,255,255,0.15)' : 'var(--bg-elevated)',
                    color:      form.secondaryMuscles.includes(m) ? 'var(--text-1)'           : 'var(--text-3)',
                    border: `1px solid ${form.secondaryMuscles.includes(m) ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
                  }}
                >
                  {MUSCLE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Снаряжение</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EQUIPMENT.map(eq => (
                <button
                  key={eq}
                  onClick={() => { haptic('light'); setForm(f => ({ ...f, equipment: eq })); setError(''); }}
                  className="text-sm px-3.5 py-1.5 rounded-full font-medium active:opacity-60"
                  style={{
                    background: form.equipment === eq ? 'var(--text-1)' : 'var(--bg-elevated)',
                    color:      form.equipment === eq ? 'var(--bg)'     : 'var(--text-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {EQUIPMENT_LABELS[eq]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Заметки (необязательно)</label>
            <input
              type="text"
              placeholder="Целевая группа: ..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full text-sm px-4 py-3 rounded-xl outline-none"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl font-bold text-base active:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--text-1)', color: 'var(--bg)' }}
          >
            {saving ? 'Сохраняем...' : isEditing ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
}
