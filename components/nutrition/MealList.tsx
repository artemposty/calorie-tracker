'use client';

import { Trash2 } from 'lucide-react';
import { FoodEntry } from '@/lib/types';

interface Props {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
}

export function MealList({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center min-h-24">
        <p className="text-sm text-slate-400">Нет записей за этот день</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className={`flex items-center gap-3 px-4 py-3 ${i < entries.length - 1 ? 'border-b border-slate-100' : ''}`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{entry.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {entry.grams} г · Б {Math.round(entry.p * 10) / 10} · Ж {Math.round(entry.f * 10) / 10} · У {Math.round(entry.c * 10) / 10}
            </p>
          </div>
          <div className="text-sm font-semibold text-slate-700 shrink-0">
            {Math.round(entry.kcal)} ккал
          </div>
          <button
            onClick={() => onDelete(entry.id)}
            className="text-slate-300 hover:text-red-400 transition-colors p-1 -mr-1 shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
