'use client';

import { WeightEntry } from '@/lib/types';
import { STARTING_WEIGHT } from '@/lib/constants';
import { getTodayDate } from '@/lib/storage';
import { ModuleHeader } from '@/components/shared/ModuleHeader';
import { WeightHero } from './WeightHero';
import { WeightStats } from './WeightStats';
import { WeightChart } from './WeightChart';
import { WeightHistory } from './WeightHistory';

interface Stats {
  min: number; max: number; start: number; current: number;
  weekTrend: number | null; count: number;
}

interface Props {
  entries: WeightEntry[];
  setWeight: (date: string, weight: number) => void;
  deleteEntry: (id: string) => void;
  getByDate: (date: string) => number | null;
  getStats: () => Stats | null;
  onMenuOpen: () => void;
}

export function WeightTab({ entries, setWeight, deleteEntry, getByDate, getStats, onMenuOpen }: Props) {
  const today       = getTodayDate();
  const todayWeight = getByDate(today);
  const stats       = getStats();
  const lastKnown   = entries.length > 0
    ? [...entries].sort((a, b) => b.date.localeCompare(a.date))[0].weight
    : STARTING_WEIGHT;

  return (
    <div className="flex flex-col gap-3 pb-4">
      <ModuleHeader title="Вес" onMenuOpen={onMenuOpen} />
      <div className="enter-stagger">
        <WeightHero
          initial={todayWeight ?? lastKnown}
          savedToday={todayWeight}
          startWeight={stats?.start ?? null}
          onSave={w => setWeight(today, w)}
        />
      </div>
      <div className="enter-stagger" style={{ animationDelay: '80ms' }}>
        <WeightStats stats={stats} />
      </div>
      <div className="enter-stagger" style={{ animationDelay: '160ms' }}>
        <WeightChart entries={entries} />
      </div>
      <div className="enter-stagger" style={{ animationDelay: '240ms' }}>
        <WeightHistory entries={entries} onDelete={deleteEntry} />
      </div>
    </div>
  );
}
