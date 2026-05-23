'use client';

import { useState } from 'react';

interface Props {
  date: string;
  value: number | null;
  onSave: (weight: number) => void;
}

export function WeightInput({ date, value, onSave }: Props) {
  const [input, setInput] = useState(value !== null ? String(value) : '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const w = parseFloat(input);
    if (!w || w < 20 || w > 300) return;
    onSave(w);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500 mb-3">Вес на сегодня, кг</p>
      <div className="flex gap-3 items-center">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={input}
          onChange={e => { setInput(e.target.value); setSaved(false); }}
          onKeyDown={handleKey}
          placeholder="87.0"
          className="flex-1 px-4 py-3 text-xl font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 tabular-nums"
        />
        <button
          onClick={handleSave}
          className={`px-5 py-3 rounded-xl font-medium text-sm transition-colors shrink-0 ${
            saved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
