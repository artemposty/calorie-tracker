import { FoodEntry } from './types';
import { getTodayDate, shiftDate } from './storage';

export interface RecentFood {
  name: string;
  grams: number;
  kcal: number;
  p: number;
  f: number;
  c: number;
  frequency: number;
  timeMatch: boolean; // eaten around this hour of day before → surfaced with a badge
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()) / 86400000);
}

function hourDiff(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 24 - d);
}

/**
 * Ranks recently-eaten foods by frequency + time-of-day relevance, so the
 * list surfaces "what you usually eat right now" instead of just "recent".
 *
 * score = log(1 + frequency) × timeMatch(1.5|1.0) × recencyBoost(1.3|1.0)
 */
export function getRecentFoods(
  nutritionData: Record<string, FoodEntry[]>,
  now: Date = new Date(),
  limit = 8,
): RecentFood[] {
  const today = getTodayDate();
  const cutoff = shiftDate(today, -30);
  const currentHour = now.getHours();

  const groups = new Map<string, { date: string; entry: FoodEntry }[]>();
  for (const date of Object.keys(nutritionData)) {
    if (date < cutoff) continue;
    for (const entry of nutritionData[date]) {
      const key = entry.name.trim().toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ date, entry });
    }
  }

  const ranked: (RecentFood & { score: number })[] = [];
  for (const rows of groups.values()) {
    rows.sort((a, b) => (b.entry.time > a.entry.time ? 1 : -1));
    const latest = rows[0];
    const frequency = rows.length;

    const hours = rows.map(r => new Date(r.entry.time).getHours());
    const timeMatch = hours.some(h => hourDiff(h, currentHour) <= 3);
    const recencyBoost = daysBetween(latest.date, today) <= 3 ? 1.3 : 1.0;
    const score = Math.log(1 + frequency) * (timeMatch ? 1.5 : 1.0) * recencyBoost;

    ranked.push({
      name: latest.entry.name,
      grams: latest.entry.grams,
      kcal: latest.entry.kcal,
      p: latest.entry.p,
      f: latest.entry.f,
      c: latest.entry.c,
      frequency,
      timeMatch,
      score,
    });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map(({ score: _score, ...rest }) => rest);
}
