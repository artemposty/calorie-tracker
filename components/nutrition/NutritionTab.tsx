'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Goals, FoodEntry } from '@/lib/types';
import { getTodayDate, shiftDate, calcTotals } from '@/lib/storage';
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

  function prevDay() { setDate(d => shiftDate(d, -1)); }
  function nextDay() { setDate(d => shiftDate(d, 1)); }

  return (
    <>
      <div className="flex flex-col gap-3 px-4 pt-2 pb-4">
        <DayHeader date={date} onPrev={prevDay} onNext={nextDay} />
        <CalorieDisplay totals={totals} goals={goals} />
        <MacroProgress totals={totals} goals={goals} />
        <MealList entries={entries} onDelete={id => deleteEntry(date, id)} />
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed right-5 z-10 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform duration-100"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
        aria-label="Добавить приём пищи"
      >
        <Plus size={26} strokeWidth={2} />
      </button>

      {showAdd && (
        <AddMealModal
          onAdd={e => addEntry(date, e)}
          onAddMany={es => addEntries(date, es)}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}
