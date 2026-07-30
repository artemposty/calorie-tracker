'use client';

import { useCallback, useState } from 'react';
import { getTodayDate, shiftDate } from '@/lib/storage';
import { haptic } from '@/lib/haptics';
import { useWorkout, useWeeklyVolume, useWorkoutTonnageByDate, useLastWorkoutInfo } from '@/hooks/useWorkout';
import { useExercises } from '@/hooks/useExercises';
import { ModuleHeader } from '@/components/shared/ModuleHeader';
import { WeekStrip, DayBar } from '@/components/shared/WeekStrip';
import { TodayCard } from './TodayCard';
import { WeeklyVolumeCard } from './WeeklyVolumeCard';
import { AddSetModal } from './AddSetModal';
import { ExercisesListTab } from './ExercisesListTab';
import { WorkoutStatsTab } from './WorkoutStatsTab';

type SubTab = 'today' | 'exercises' | 'stats';

interface Props {
  onMenuOpen: () => void;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function WorkoutTab({ onMenuOpen }: Props) {
  const today = getTodayDate();
  const [subTab, setSubTab] = useState<SubTab>('today');
  const [date, setDate] = useState(today);
  const { byExercise, totalSets, totalTonnage, loading, addSet, deleteSet } = useWorkout(date);
  const { exercises, loading: exLoading, addExercise, updateExercise, deleteExercise } = useExercises();
  const { volume, loading: volLoading } = useWeeklyVolume();
  const [showAdd, setShowAdd] = useState(false);
  const [prefillExerciseId, setPrefillExerciseId] = useState<string | null>(null);

  // Tonnage for the week strip: last 10 weeks is plenty of swipe-back room
  const tonnageByDate = useWorkoutTonnageByDate(shiftDate(today, -70), today);
  const lastWorkout = useLastWorkoutInfo(date);

  const getDayBar = useCallback((dateStr: string): DayBar => {
    // The selected day's tonnage comes from the live useWorkout data so the
    // bar updates immediately when a set is added, without a refetch.
    const t = dateStr === date ? totalTonnage : (tonnageByDate[dateStr] ?? 0);
    if (t <= 0) return { frac: 0, color: null };
    const all = Object.values(tonnageByDate);
    const maxT = Math.max(...all, totalTonnage, 1);
    return {
      frac: Math.max(0.14, t / maxT),
      color: dateStr === today ? '#f4f4f5' : 'rgba(222,226,255,0.65)',
    };
  }, [tonnageByDate, date, totalTonnage, today]);

  const exerciseCount = Object.keys(byExercise).length;

  function openAddFor(exerciseId: string | null) {
    setPrefillExerciseId(exerciseId);
    setShowAdd(true);
  }

  return (
    <>
      <div className="flex flex-col gap-4" style={{ paddingBottom: 'calc(56px + max(env(safe-area-inset-bottom), 8px))' }}>
        <ModuleHeader
          onMenuOpen={onMenuOpen}
          date={subTab === 'today' ? date : undefined}
          onDateChange={subTab === 'today' ? setDate : undefined}
          title={subTab === 'exercises' ? 'Упражнения' : subTab === 'stats' ? 'Статистика' : undefined}
        />

        {subTab === 'today' && (
          <>
            <WeekStrip selectedDate={date} onSelectDate={setDate} getDay={getDayBar} />

            {totalSets > 0 && (
              <p className="text-center text-xs tabular-nums -mt-1" style={{ color: 'var(--text-3)' }}>
                <b className="font-semibold" style={{ color: 'var(--text-1)' }}>{totalSets}</b>
                {' '}{plural(totalSets, 'подход', 'подхода', 'подходов')} ·{' '}
                <b className="font-semibold" style={{ color: 'var(--text-1)' }}>{exerciseCount}</b>
                {' '}{plural(exerciseCount, 'упражнение', 'упражнения', 'упражнений')}
              </p>
            )}

            {loading ? (
              <div className="px-4"><div className="skeleton h-20 rounded-2xl" /></div>
            ) : (
              <div className="enter-stagger">
                <TodayCard
                  byExercise={byExercise}
                  onDelete={deleteSet}
                  onAddSet={id => openAddFor(id)}
                  lastWorkout={lastWorkout}
                />
              </div>
            )}
            <div className="enter-stagger" style={{ animationDelay: '80ms' }}>
              <WeeklyVolumeCard volume={volume} loading={volLoading} />
            </div>
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

      {/* FAB — only on today tab */}
      {subTab === 'today' && (
        <button
          onClick={() => { haptic('medium'); openAddFor(null); }}
          className="fixed z-10 flex items-center justify-center active:scale-[0.96] transition-transform duration-150 ease-out"
          style={{
            right: 20,
            bottom: 'calc(56px + max(env(safe-area-inset-bottom), 8px) + 16px)',
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
          ['today', 'Сегодня',
            <svg key="today" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>,
          ],
          ['exercises', 'Упражнения',
            <svg key="ex" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M6.5 6.5h11M6.5 17.5h11M3 12h2m14 0h2" strokeLinecap="round" />
              <path d="M5 9.5l-2 2.5 2 2.5M19 9.5l2 2.5-2 2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>,
          ],
          ['stats', 'Статистика',
            <svg key="st" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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

      {showAdd && !exLoading && (
        <AddSetModal
          exercises={exercises}
          date={date}
          initialExerciseId={prefillExerciseId}
          onAdd={async params => {
            const ok = await addSet(params);
            return ok;
          }}
          onClose={() => { setShowAdd(false); setPrefillExerciseId(null); }}
        />
      )}
    </>
  );
}
