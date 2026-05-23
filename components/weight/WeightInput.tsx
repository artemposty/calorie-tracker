'use client';

import { useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';

interface Props {
  value: number | null;
  lastKnown: number;
  onSave: (weight: number) => void;
}

export function WeightInput({ value, lastKnown, onSave }: Props) {
  const [weight, setWeight] = useState(() =>
    Math.round((value ?? lastKnown) * 10) / 10
  );
  const [saved, setSaved] = useState(false);

  function adjust(delta: number) {
    setWeight(w => Math.round((w + delta) * 10) / 10);
    setSaved(false);
  }

  function handleSave() {
    onSave(weight);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500 mb-4">Вес сегодня</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => adjust(-0.1)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 active:scale-90 transition-transform duration-100"
        >
          <Minus size={18} strokeWidth={2} />
        </button>

        <div className="flex-1 text-center">
          <span className="text-4xl font-bold tabular-nums text-slate-900 transition-all duration-150">
            {weight.toFixed(1)}
          </span>
          <span className="text-base text-slate-400 ml-1.5">кг</span>
        </div>

        <button
          onClick={() => adjust(0.1)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 active:scale-90 transition-transform duration-100"
        >
          <Plus size={18} strokeWidth={2} />
        </button>

        <button
          onClick={handleSave}
          className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
            saved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          <Check size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
