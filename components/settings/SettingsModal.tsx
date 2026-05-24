'use client';

import { useState } from 'react';
import { Goals } from '@/lib/types';
import { haptic } from '@/lib/haptics';

interface Props {
  goals: Goals;
  onSave: (goals: Goals) => void;
  onClose: () => void;
}

function num(v: string) { return parseInt(v, 10) || 0; }

export function SettingsModal({ goals, onSave, onClose }: Props) {
  const [kcal,    setKcal]    = useState(String(goals.kcal));
  const [protein, setProtein] = useState(String(goals.protein));
  const [fat,     setFat]     = useState(String(goals.fat));
  const [carbs,   setCarbs]   = useState(String(goals.carbs));

  function handleSave() {
    haptic('success');
    onSave({ kcal: num(kcal), protein: num(protein), fat: num(fat), carbs: num(carbs) });
    onClose();
  }

  const fields = [
    { label: 'Калории',  unit: 'ккал/день', color: 'var(--kcal)',    value: kcal,    set: setKcal    },
    { label: 'Белки',    unit: 'г/день',    color: 'var(--protein)', value: protein, set: setProtein },
    { label: 'Жиры',     unit: 'г/день',    color: 'var(--fat)',     value: fat,     set: setFat     },
    { label: 'Углеводы', unit: 'г/день',    color: 'var(--carbs)',   value: carbs,   set: setCarbs   },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 modal-backdrop" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div
        className="modal-sheet relative w-full max-w-md"
        style={{
          background: 'var(--bg-card)', borderRadius: '24px 24px 0 0',
          border: '1px solid var(--border)', borderBottom: 'none',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--bg-elevated)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>Цели на день</h2>
          <button onClick={() => { haptic('light'); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--bg-elevated)' }}>
            <svg width="16" height="16" fill="none" stroke="var(--text-2)" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-4 flex flex-col gap-3">
          {fields.map(({ label, unit, color, value, set }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{unit}</p>
                </div>
              </div>
              <input
                type="number" inputMode="numeric" value={value} onChange={e => set(e.target.value)}
                className="w-24 px-3 py-2 text-right text-sm font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 tabular-nums"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
          ))}
          <button onClick={handleSave}
            className="mt-2 w-full py-3.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: '#ffffff', color: '#0a0a0b' }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
