'use client';

import { useState } from 'react';
import { Goals, FoodEntry } from '@/lib/types';
import { getTodayDate, shiftDate, calcTotals } from '@/lib/storage';
import { haptic } from '@/lib/haptics';
import { DayHeader } from './DayHeader';
import { CalorieDisplay } from './CalorieDisplay';
import { MacroProgress } from './MacroProgress';
import { MealList } from './MealList';
import { AddMealModal } from './AddMealModal';

interface Props {
  goals: Goals;
  getDayEntries: (date: string) => FoodEntry[];
  addEntry: (date: string, entry: Omit<FoodEntry, 'id' | 'time'>) => void;
  addEntries: (date: string, entries: Omit<FoodEntry, 'id' | 'time'>[]) => void;
  deleteEntry: (date: string, id: string) => void;
}

export function NutritionTab({ goals, getDayEntries, addEntry, addEntries, deleteEntry }: Props) {
  const [date, setDate] = useState(getTodayDate);
  const [showAdd, setShowAdd] = useState(false);

  const entries = getDayEntries(date);
  const totals = calcTotals(entries);

  return (
    <>
      <div className="flex flex-col gap-4">
        <DayHeader
          date={date}
          onPrev={() => setDate(d => shiftDate(d, -1))}
          onNext={() => setDate(d => shiftDate(d, 1))}
          onDateChange={setDate}
        />
        <CalorieDisplay totals={totals} goals={goals} />
        <MacroProgress totals={totals} goals={goals} />
        <MealList entries={entries} onDelete={id => deleteEntry(date, id)} />
      </div>

      {/* FAB */}
      <button
        onClick={() => { haptic('medium'); setShowAdd(true); }}
        className="fixed z-10 flex items-center justify-center active:scale-90 transition-transform duration-100"
        style={{
          right: 20,
          bottom: 'calc(max(env(safe-area-inset-bottom), 12px) + 76px)',
          width: 56, height: 56, borderRadius: 28,
          background: '#ffffff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
        aria-label="Добавить приём пищи"
      >
        <svg width="26" height="26" fill="none" stroke="#0a0a0b" strokeWidth="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
        </svg>
      </button>

      {showAdd && (
        <AddMealModal
          onAdd={e => addEntry(date, e)}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}
