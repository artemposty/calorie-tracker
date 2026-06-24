'use client';

import { useState } from 'react';
import { Goals, FoodEntry } from '@/lib/types';
import { getTodayDate, shiftDate, calcTotals } from '@/lib/storage';
import { haptic } from '@/lib/haptics';
import { ModuleHeader } from '@/components/shared/ModuleHeader';
import { CalorieDisplay } from './CalorieDisplay';
import { MacroProgress } from './MacroProgress';
import { MealList } from './MealList';
import { AddMealModal } from './AddMealModal';
import { StatsTab } from '@/components/stats/StatsTab';
import { useTodayTonnage } from '@/hooks/useWorkout';
import { calcWorkoutKcal, calcExpenditure } from '@/lib/energy';

type SubTab = 'tracker' | 'stats';

interface Props {
  goals: Goals;
  nutritionData: Record<string, FoodEntry[]>;
  getDayEntries: (date: string) => FoodEntry[];
  addEntry: (date: string, entry: Omit<FoodEntry, 'id' | 'time'>) => void;
  addEntries: (date: string, entries: Omit<FoodEntry, 'id' | 'time'>[]) => void;
  deleteEntry: (date: string, id: string) => void;
  onMenuOpen: () => void;
}

export function NutritionTab({ goals, nutritionData, getDayEntries, addEntry, addEntries, deleteEntry, onMenuOpen }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('tracker');
  const [date, setDate] = useState(getTodayDate);
  const [showAdd, setShowAdd] = useState(false);

  const entries     = getDayEntries(date);
  const totals      = calcTotals(entries);
  const tonnage     = useTodayTonnage(date);
  const baseTdee    = goals.base_tdee ?? 2400;
  const workoutKcal = calcWorkoutKcal(tonnage);
  const expenditure = calcExpenditure(baseTdee, workoutKcal);

  return (
    <>
      <div className="flex flex-col gap-4" style={{ paddingBottom: 'calc(164px + max(env(safe-area-inset-bottom), 8px))' }}>
        <ModuleHeader
          onMenuOpen={onMenuOpen}
          date={subTab === 'tracker' ? date : undefined}
          onPrev={subTab === 'tracker' ? () => setDate(d => shiftDate(d, -1)) : undefined}
          onNext={subTab === 'tracker' ? () => setDate(d => shiftDate(d, 1)) : undefined}
          onDateChange={subTab === 'tracker' ? setDate : undefined}
          title={subTab === 'stats' ? 'Статистика' : undefined}
        />

        {subTab === 'tracker' && (
          <>
            <CalorieDisplay
              totals={totals}
              goals={goals}
              expenditure={expenditure}
              workoutKcal={workoutKcal}
            />
            <MacroProgress totals={totals} goals={goals} />
            <div className="enter-stagger" style={{ animationDelay: '160ms' }}>
              <MealList entries={entries} onDelete={id => deleteEntry(date, id)} />
            </div>
          </>
        )}

        {subTab === 'stats' && (
          <StatsTab nutritionData={nutritionData} goals={goals} />
        )}
      </div>

      {/* FAB — only on tracker tab */}
      {subTab === 'tracker' && (
        <button
          onClick={() => { haptic('medium'); setShowAdd(true); }}
          className="fixed z-10 flex items-center justify-center active:scale-[0.96] transition-transform duration-150 ease-out"
          style={{
            right: 20,
            bottom: 'calc(56px + max(env(safe-area-inset-bottom), 8px) + 16px)',
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
      )}

      {/* Bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-10 flex"
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        }}
      >
        {([
          ['tracker', 'Трекер',
            <svg key="t" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M3 11l19-9-9 19-2-8-8-2z" strokeLinejoin="round" />
            </svg>,
          ],
          ['stats', 'Статистика',
            <svg key="s" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>,
          ],
        ] as [SubTab, string, React.ReactNode][]).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => { haptic('light'); setSubTab(id); }}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 active:scale-[0.96] transition-transform duration-150 ease-out"
            style={{ color: subTab === id ? 'var(--text-1)' : 'var(--text-4)' }}
          >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>

      {showAdd && (
        <AddMealModal
          onAdd={e => addEntry(date, e)}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}
