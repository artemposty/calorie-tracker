'use client';

import { WeightEntry } from '@/lib/types';
import { STARTING_WEIGHT } from '@/lib/constants';
import { getTodayDate } from '@/lib/storage';
import { WeightInput } from './WeightInput';
import { WeightStats } from './WeightStats';
import { WeightChart } from './WeightChart';
import { WeightHistory } from './WeightHistory';

interface Props {
  entries: WeightEntry[];
  setWeight: (date: string, weight: number) => void;
  deleteEntry: (id: string) => void;
  getByDate: (date: string) => number | null;
  getStats: () => ReturnType<() => {
    min: number; max: number; start: number; current: number;
    weekTrend: number | null; count: number;
  } | null>;
}

export function WeightTab({ entries, setWeight, deleteEntry, getByDate, getStats }: Props) {
  const today       = getTodayDate();
  const todayWeight = getByDate(today);
  const stats       = getStats();
  const lastKnown   = entries.length > 0
    ? [...entries].sort((a, b) => b.date.localeCompare(a.date))[0].weight
    : STARTING_WEIGHT;

  return (
    <div className="flex flex-col gap-3 pt-4 pb-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 16px)' }}>
      <WeightInput value={todayWeight} lastKnown={lastKnown} onSave={w => setWeight(today, w)} />
      <WeightStats stats={stats} todayWeight={todayWeight} />
      <WeightChart entries={entries} />
      <WeightHistory entries={entries} onDelete={deleteEntry} />
    </div>
  );
}
