'use client';

import { useState } from 'react';
import { getTodayDate, shiftDate } from '@/lib/storage';
import { haptic } from '@/lib/haptics';
import { useWorkout, useWeeklyVolume } from '@/hooks/useWorkout';
import { useExercises } from '@/hooks/useExercises';
import { ModuleHeader } from '@/components/shared/ModuleHeader';
import { TodayCard } from './TodayCard';
import { WeeklyVolumeCard } from './WeeklyVolumeCard';
import { AddSetModal } from './AddSetModal';
import { ExercisesListTab } from './ExercisesListTab';
import { WorkoutStatsTab } from './WorkoutStatsTab';

type SubTab = 'today' | 'exercises' | 'stats';

interface Props {
  onMenuOpen: () => void;
}

export function WorkoutTab({ onMenuOpen }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('today');
  const [date, setDate] = useState(getTodayDate);
  const { byExercise, totalSets, totalTonnage, loading, addSet, deleteSet } = useWorkout(date);
  const { exercises, loading: exLoading, addExercise, updateExercise, deleteExercise } = useExercises();
  const { volume, loading: volLoading } = useWeeklyVolume();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4">
        <ModuleHeader
          onMenuOpen={onMenuOpen}
          date={subTab === 'today' ? date : undefined}
          onPrev={subTab === 'today' ? () => setDate(d => shiftDate(d, -1)) : undefined}
          onNext={subTab === 'today' ? () => setDate(d => shiftDate(d, 1)) : undefined}
          onDateChange={subTab === 'today' ? setDate : undefined}
          title={subTab === 'exercises' ? 'Упражнения' : subTab === 'stats' ? 'Статистика' : undefined}
        />

        {/* Sub-tabs */}
        <div className="flex mx-4 gap-2">
          {([['today', 'Сегодня'], ['exercises', 'Упражнения'], ['stats', 'Статистика']] as [SubTab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { haptic('light'); setSubTab(id); }}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: subTab === id ? 'var(--text-1)' : 'var(--bg-card)',
                color: subTab === id ? 'var(--bg)' : 'var(--text-3)',
                border: '1px solid var(--border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {subTab === 'today' && (
          <>
            {loading ? (
              <div className="px-4"><div className="skeleton h-20 rounded-2xl" /></div>
            ) : (
              <TodayCard
                byExercise={byExercise}
                totalSets={totalSets}
                totalTonnage={totalTonnage}
                onDelete={deleteSet}
              />
            )}
            <WeeklyVolumeCard volume={volume} loading={volLoading} />
          </>
        )}

        {subTab === 'exercises' && (
          <ExercisesListTab
            exercises={exercises}
            loading={exLoading}
            onAdd={addExercise}
            onUpdate={updateExercise}
            onDelete={deleteExercise}
          />
        )}

        {subTab === 'stats' && <WorkoutStatsTab />}

        <div style={{ height: 16 }} />
      </div>

      {/* FAB (only on today tab) */}
      {subTab === 'today' && (
        <button
          onClick={() => { haptic('medium'); setShowAdd(true); }}
          className="fixed z-10 flex items-center justify-center active:scale-90 transition-transform duration-100"
          style={{
            right: 20,
            bottom: 'calc(max(env(safe-area-inset-bottom), 12px) + 16px)',
            width: 56, height: 56, borderRadius: 28,
            background: '#ffffff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
          aria-label="Добавить подход"
        >
          <svg width="26" height="26" fill="none" stroke="#0a0a0b" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {showAdd && !exLoading && (
        <AddSetModal
          exercises={exercises}
          onAdd={async params => {
            const ok = await addSet(params);
            return ok;
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}
