import { FoodEntry } from './types';

export type MealGroupName = 'Завтрак' | 'Обед' | 'Ужин' | 'Перекус';

// Small portions read as a snack regardless of when they were eaten.
const SNACK_MAX_KCAL = 200;

/** Завтрак 04–12, Обед 12–18, Ужин 18–04 (wraps past midnight). */
export function classifyEntry(entry: FoodEntry): MealGroupName {
  if (entry.kcal <= SNACK_MAX_KCAL) return 'Перекус';
  const hour = new Date(entry.time).getHours();
  if (hour >= 4 && hour < 12) return 'Завтрак';
  if (hour >= 12 && hour < 18) return 'Обед';
  return 'Ужин';
}

export interface MealGroup {
  name: MealGroupName;
  entries: FoodEntry[];
  totalKcal: number;
}

/** Groups entries by meal period, sections ordered by their earliest entry's time. */
export function groupMeals(entries: FoodEntry[]): MealGroup[] {
  const groups = new Map<MealGroupName, FoodEntry[]>();
  for (const e of entries) {
    const label = classifyEntry(e);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(e);
  }

  const result: MealGroup[] = [];
  for (const [name, list] of groups) {
    const sorted = list.slice().sort((a, b) => a.time.localeCompare(b.time));
    result.push({ name, entries: sorted, totalKcal: Math.round(sorted.reduce((s, e) => s + e.kcal, 0)) });
  }
  result.sort((a, b) => a.entries[0].time.localeCompare(b.entries[0].time));
  return result;
}
