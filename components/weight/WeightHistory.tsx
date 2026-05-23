'use client';

import { Trash2 } from 'lucide-react';
import { WeightEntry } from '@/lib/types';
import { formatDisplayDate } from '@/lib/storage';

interface Props {
  entries: WeightEntry[];
  onDelete: (id: string) => void;
}

export function WeightHistory({ entries, onDelete }: Props) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center min-h-20">
        <p className="text-sm text-slate-400">Нет записей</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <p className="text-xs text-slate-400 px-4 pt-4 pb-2">История</p>
      {sorted.map((entry, i) => (
        <div
          key={entry.id}
          className={`flex items-center justify-between px-4 py-3 ${
            i < sorted.length - 1 ? 'border-b border-slate-100' : ''
          }`}
        >
          <span className="text-sm text-slate-700">{formatDisplayDate(entry.date)}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tabular-nums text-slate-900">
              {entry.weight.toFixed(1)} кг
            </span>
            <button
              onClick={() => onDelete(entry.id)}
              className="text-slate-300 hover:text-red-400 transition-colors p-1 -mr-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
