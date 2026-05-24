'use client';

import { useState } from 'react';
import { haptic } from '@/lib/haptics';

interface Props {
  value: number | null;
  lastKnown: number;
  onSave: (weight: number) => void;
}

export function WeightInput({ value, lastKnown, onSave }: Props) {
  const [weight, setWeight] = useState(() => Math.round((value ?? lastKnown) * 10) / 10);
  const [saved, setSaved] = useState(false);

  function adjust(delta: number) {
    haptic('light');
    setWeight(w => Math.round((w + delta) * 10) / 10);
    setSaved(false);
  }

  function handleSave() {
    haptic('success');
    onSave(weight);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-4 rounded-2xl px-5 py-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>
        Вес сегодня
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => adjust(-0.1)}
          className="w-12 h-12 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-100"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <svg width="18" height="18" fill="none" stroke="var(--text-2)" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <span className="tabular-nums" style={{ fontSize: 52, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
            {weight.toFixed(1)}
          </span>
          <span className="text-lg ml-1.5" style={{ color: 'var(--text-3)' }}>кг</span>
        </div>

        <button
          onClick={() => adjust(0.1)}
          className="w-12 h-12 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-100"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <svg width="18" height="18" fill="none" stroke="var(--text-2)" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
        </button>

        <button
          onClick={handleSave}
          className="w-12 h-12 flex items-center justify-center rounded-full active:scale-90 transition-all duration-200"
          style={{ background: saved ? 'var(--success)' : '#ffffff' }}
        >
          <svg width="18" height="18" fill="none" stroke={saved ? '#fff' : '#0a0a0b'} strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
