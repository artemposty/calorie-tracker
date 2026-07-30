'use client';

import { useCallback } from 'react';
import { FoodEntry } from '@/lib/types';
import { getTodayDate, calcTotals } from '@/lib/storage';
import { WeekStrip as SharedWeekStrip, DayBar } from '@/components/shared/WeekStrip';

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  nutritionData: Record<string, FoodEntry[]>;
  goalKcal: number;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function lerpColor(c1: string, c2: string, t: number): string {
  t = Math.max(0, Math.min(1, t));
  const p1 = hexToRgb(c1), p2 = hexToRgb(c2);
  return `rgb(${Math.round(p1.r + (p2.r - p1.r) * t)},${Math.round(p1.g + (p2.g - p1.g) * t)},${Math.round(p1.b + (p2.b - p1.b) * t)})`;
}

/** ≤150 kcal from goal = green; beyond that a yellow→red gradient out to 600; today always white. */
function zoneColor(totalKcal: number, goalKcal: number, isToday: boolean): string | null {
  if (isToday) return '#f4f4f5';
  if (totalKcal <= 0) return null;
  const diff = Math.abs(totalKcal - goalKcal);
  if (diff <= 150) return '#30d158';
  const t = (diff - 150) / (600 - 150);
  return lerpColor('#ff9f0a', '#ff453a', t);
}

export function WeekStrip({ selectedDate, onSelectDate, nutritionData, goalKcal }: Props) {
  const today = getTodayDate();

  const getDay = useCallback((dateStr: string): DayBar => {
    const total = Math.round(calcTotals(nutritionData[dateStr] ?? []).kcal);
    return {
      frac: goalKcal > 0 ? total / goalKcal : 0,
      color: zoneColor(total, goalKcal, dateStr === today),
    };
  }, [nutritionData, goalKcal, today]);

  return <SharedWeekStrip selectedDate={selectedDate} onSelectDate={onSelectDate} getDay={getDay} />;
}
