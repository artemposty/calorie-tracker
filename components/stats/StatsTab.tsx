'use client';

import { useState, useMemo } from 'react';
import { FoodEntry, Goals } from '@/lib/types';
import { getTodayDate, shiftDate, formatShortDate, calcTotals } from '@/lib/storage';
import { CalorieChart } from './CalorieChart';
import { MacroChart } from './MacroChart';

interface DayStats {
  date: string;
  displayDate: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
}

type Period = '7' | '30' | 'all';

interface Props {
  nutritionData: Record<string, FoodEntry[]>;
  goals: Goals;
}

function buildData(nutritionData: Record<string, FoodEntry[]>, period: Period): DayStats[] {
  const today = getTodayDate();

  if (period === 'all') {
    return Object.keys(nutritionData)
      .sort()
      .map(date => {
        const totals = calcTotals(nutritionData[date] ?? []);
        return {
          date,
          displayDate: formatShortDate(date),
          kcal: Math.round(totals.kcal),
          p: Math.round(totals.p),
          f: Math.round(totals.f),
          c: Math.round(totals.c),
        };
      })
      .filter(d => d.kcal > 0);
  }

  const days = Number(period);
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDate(today, -(days - 1 - i));
    const totals = calcTotals(nutritionData[date] ?? []);
    return {
      date,
      displayDate: formatShortDate(date),
      kcal: Math.round(totals.kcal),
      p: Math.round(totals.p),
      f: Math.round(totals.f),
      c: Math.round(totals.c),
    };
  });
}

export function StatsTab({ nutritionData, goals }: Props) {
  const [period, setPeriod] = useState<Period>('7');

  const data = useMemo(() => buildData(nutritionData, period), [nutritionData, period]);

  const daysWithData = data.filter(d => d.kcal > 0);
  const avgKcal = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + d.kcal, 0) / daysWithData.length)
    : null;
  const daysOnTarget = daysWithData.filter(d => d.kcal <= goals.kcal).length;
  const diffFromGoal = avgKcal !== null ? avgKcal - goals.kcal : null;

  const PERIODS: { id: Period; label: string }[] = [
    { id: '7', label: '7 дней' },
    { id: '30', label: '30 дней' },
    { id: 'all', label: 'Всё время' },
  ];

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-4">
      {/* Period selector */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 active:scale-95 ${
              period === p.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm card-appear">
          <p className="text-xs text-slate-400 mb-1">Средний каллораж</p>
          {avgKcal !== null ? (
            <>
              <p className="text-2xl font-bold tabular-nums text-slate-900">{avgKcal}</p>
              <p className="text-xs text-slate-400 mt-0.5">ккал/день</p>
              <p className={`text-xs font-medium mt-1.5 ${
                diffFromGoal! > 0 ? 'text-red-500' : 'text-emerald-600'
              }`}>
                {diffFromGoal! > 0 ? `+${diffFromGoal}` : diffFromGoal} от цели
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400 mt-2">Нет данных</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm card-appear">
          <p className="text-xs text-slate-400 mb-1">Дней в норме</p>
          {daysWithData.length > 0 ? (
            <>
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {daysOnTarget}
                <span className="text-base font-normal text-slate-400"> / {daysWithData.length}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">≤ {goals.kcal} ккал</p>
              <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-[width] duration-500"
                  style={{ width: `${daysWithData.length > 0 ? (daysOnTarget / daysWithData.length) * 100 : 0}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 mt-2">Нет данных</p>
          )}
        </div>
      </div>

      <CalorieChart data={data} goals={goals} />
      <MacroChart data={data} goals={goals} />
    </div>
  );
}
