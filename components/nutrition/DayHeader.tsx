'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDisplayDate, getTodayDate, shiftDate } from '@/lib/storage';

interface Props {
  date: string;
  onPrev: () => void;
  onNext: () => void;
}

export function DayHeader({ date, onPrev, onNext }: Props) {
  const isToday = date === getTodayDate();

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <button
        onClick={onPrev}
        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft size={22} />
      </button>

      <span className="text-base font-semibold text-slate-800">
        {formatDisplayDate(date)}
      </span>

      <button
        onClick={onNext}
        disabled={isToday}
        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
