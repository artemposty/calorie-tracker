import { FoodEntry, WeightEntry, Goals, DayTotals } from './types';

export function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDisplayDate(dateStr: string): string {
  const today = getTodayDate();
  const yesterday = shiftDate(today, -1);
  if (dateStr === today) return 'Сегодня';
  if (dateStr === yesterday) return 'Вчера';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function calcTotals(entries: FoodEntry[]): DayTotals {
  return entries.reduce(
    (acc, e) => ({ kcal: acc.kcal + e.kcal, p: acc.p + e.p, f: acc.f + e.f, c: acc.c + e.c }),
    { kcal: 0, p: 0, f: 0, c: 0 }
  );
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function calcFromPer100(per100: number, grams: number): number {
  return Math.round((per100 * grams) / 100 * 10) / 10;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fall through */ }
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
  document.body.appendChild(el);
  el.focus();
  el.select();
  try {
    document.execCommand('copy');
    return true;
  } catch {
    return false;
  } finally {
    el.remove();
  }
}
