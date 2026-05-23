'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Goals } from '@/lib/types';

interface Props {
  goals: Goals;
  onSave: (goals: Goals) => void;
  onClose: () => void;
}

function num(v: string) { return parseInt(v, 10) || 0; }

export function SettingsModal({ goals, onSave, onClose }: Props) {
  const [kcal, setKcal] = useState(String(goals.kcal));
  const [protein, setProtein] = useState(String(goals.protein));
  const [fat, setFat] = useState(String(goals.fat));
  const [carbs, setCarbs] = useState(String(goals.carbs));

  function handleSave() {
    onSave({
      kcal: num(kcal),
      protein: num(protein),
      fat: num(fat),
      carbs: num(carbs),
    });
    onClose();
  }

  const fields = [
    { label: 'Калории', unit: 'ккал/день', value: kcal, set: setKcal },
    { label: 'Белки', unit: 'г/день', value: protein, set: setProtein },
    { label: 'Жиры', unit: 'г/день', value: fat, set: setFat },
    { label: 'Углеводы', unit: 'г/день', value: carbs, set: setCarbs },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 modal-backdrop" onClick={onClose} />
      <div
        className="modal-sheet relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">Цели на день</h2>
          <button onClick={onClose} className="text-slate-400 p-1"><X size={20} /></button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
          {fields.map(({ label, unit, value, set }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{unit}</p>
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={value}
                onChange={e => set(e.target.value)}
                className="w-24 px-3 py-2 text-right text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 tabular-nums"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            className="mt-2 bg-slate-900 text-white py-3.5 rounded-xl font-medium"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
