import { FoodEntry } from './types';

export type MealGroupName = 'Завтрак' | 'Обед' | 'Ужин' | 'Перекус';

const CLUSTER_GAP_MIN = 15; // entries within this many minutes of each other = one sitting
const MEAL_SLOTS: Exclude<MealGroupName, 'Перекус'>[] = ['Завтрак', 'Обед', 'Ужин'];

export interface MealGroup {
  name: MealGroupName;
  entries: FoodEntry[];
  totalKcal: number;
}

interface Cluster {
  entries: FoodEntry[];
  totalKcal: number;
  earliestTime: string;
}

function toMinutes(iso: string): number {
  return new Date(iso).getTime() / 60000;
}

/** Splits time-sorted entries into "sittings" — gaps >15min start a new cluster. */
function clusterByGap(sorted: FoodEntry[]): Cluster[] {
  const clusters: Cluster[] = [];
  for (const e of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && toMinutes(e.time) - toMinutes(last.entries[last.entries.length - 1].time) <= CLUSTER_GAP_MIN) {
      last.entries.push(e);
      last.totalKcal += e.kcal;
    } else {
      clusters.push({ entries: [e], totalKcal: e.kcal, earliestTime: e.time });
    }
  }
  return clusters;
}

/**
 * Clusters entries into "sittings" (gap ≤15min = same sitting), picks the top 3
 * by calories as the day's real meals, then labels those three Завтрак/Обед/Ужин
 * in whatever order they actually happened — no fixed clock-hour windows. Every
 * other sitting is a Перекус. Sections render in chronological order.
 */
export function groupMeals(entries: FoodEntry[]): MealGroup[] {
  if (entries.length === 0) return [];

  const sorted = entries.slice().sort((a, b) => a.time.localeCompare(b.time));
  const clusters = clusterByGap(sorted);

  const mealClusters = clusters
    .slice()
    .sort((a, b) => b.totalKcal - a.totalKcal)
    .slice(0, 3)
    .sort((a, b) => a.earliestTime.localeCompare(b.earliestTime));

  const mealSet = new Set(mealClusters);
  const result: MealGroup[] = clusters.map(c => {
    const slotIdx = mealClusters.indexOf(c);
    const name: MealGroupName = mealSet.has(c) ? MEAL_SLOTS[slotIdx] : 'Перекус';
    return { name, entries: c.entries, totalKcal: Math.round(c.totalKcal) };
  });

  // Multiple snack clusters would collide on the 'Перекус' key when rendered —
  // callers key by array index, not by name, so this is safe as-is.
  return result.sort((a, b) => a.entries[0].time.localeCompare(b.entries[0].time));
}
