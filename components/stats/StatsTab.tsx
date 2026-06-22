'use client';

import { useState, useMemo } from 'react';
import { FoodEntry, Goals } from '@/lib/types';
import { getTodayDate, shiftDate, formatShortDate, calcTotals } from '@/lib/storage';
import { haptic } from '@/lib/haptics';
import { calcWorkoutKcal, calcExpenditure, calcDeficit, ENERGY_CONFIG } from '@/lib/energy';
import { useWorkoutTonnageByDate } from '@/hooks/useWorkout';
import { CalorieChart } from './CalorieChart';
import { MacroChart } from './MacroChart';

interface DayStats { date: string; displayDate: string; kcal: number; p: number; f: number; c: number; }
type Period = '7' | '30' | 'all';
interface Props { nutritionData: Record<string, FoodEntry[]>; goals: Goals; }

function buildData(nutritionData: Record<string, FoodEntry[]>, period: Period): DayStats[] {
  const today = getTodayDate();
  if (period === 'all') {
    return Object.keys(nutritionData).sort().map(date => {
      const t = calcTotals(nutritionData[date] ?? []);
      return { date, displayDate: formatShortDate(date), kcal: Math.round(t.kcal), p: Math.round(t.p), f: Math.round(t.f), c: Math.round(t.c) };
    }).filter(d => d.kcal > 0);
  }
  const days = Number(period);
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDate(today, -(days - 1 - i));
    const t = calcTotals(nutritionData[date] ?? []);
    return { date, displayDate: formatShortDate(date), kcal: Math.round(t.kcal), p: Math.round(t.p), f: Math.round(t.f), c: Math.round(t.c) };
  });
}

const PERIODS: { id: Period; label: string }[] = [
  { id: '7',   label: '7 дней'    },
  { id: '30',  label: '30 дней'   },
  { id: 'all', label: 'Всё время' },
];

export function StatsTab({ nutritionData, goals }: Props) {
  const [period, setPeriod] = useState<Period>('7');
  const data = useMemo(() => buildData(nutritionData, period), [nutritionData, period]);

  const today = getTodayDate();
  const fromDate = useMemo(() => {
    if (period === 'all') return Object.keys(nutritionData).sort()[0] ?? today;
    return shiftDate(today, -(Number(period) - 1));
  }, [period, nutritionData, today]);

  const tonnageByDate = useWorkoutTonnageByDate(fromDate, today);
  const baseTdee = goals.base_tdee ?? ENERGY_CONFIG.DEFAULT_BASE_TDEE;

  const daysWithData  = data.filter(d => d.kcal > 0);
  const avgKcal       = daysWithData.length > 0 ? Math.round(daysWithData.reduce((s, d) => s + d.kcal, 0) / daysWithData.length) : null;
  const daysOnTarget  = daysWithData.filter(d => d.kcal <= goals.kcal).length;
  const diffFromGoal  = avgKcal !== null ? avgKcal - goals.kcal : null;

  // Energy balance stats (only days with nutrition logged)
  const deficitDays = daysWithData.map(d => {
    const wkcal = calcWorkoutKcal(tonnageByDate[d.date] ?? 0);
    return calcDeficit(calcExpenditure(baseTdee, wkcal), d.kcal);
  });
  const avgDeficit = deficitDays.length > 0
    ? Math.round(deficitDays.reduce((a, b) => a + b, 0) / deficitDays.length)
    : null;
  const avgExpenditure = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((sum, d) => sum + calcExpenditure(baseTdee, calcWorkoutKcal(tonnageByDate[d.date] ?? 0)), 0) / daysWithData.length)
    : null;
  const estFatLoss = avgDeficit !== null && daysWithData.length > 0
    ? Math.round(avgDeficit * daysWithData.length / 7700 * 100) / 100
    : null;

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-2">

      {/* Period selector */}
      <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => { haptic('light'); setPeriod(p.id); }}
            className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95"
            style={{
              background: period === p.id ? '#ffffff' : 'transparent',
              color: period === p.id ? '#0a0a0b' : 'var(--text-4)',
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Nutrition summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 card-appear" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-4)' }}>Средний ккал</p>
          {avgKcal !== null ? (
            <>
              <p className="text-3xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>{avgKcal}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>ккал/день</p>
              <p className="text-xs font-semibold mt-1.5" style={{ color: diffFromGoal! > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {diffFromGoal! > 0 ? `+${diffFromGoal}` : diffFromGoal} от цели
              </p>
            </>
          ) : <p className="text-sm mt-2" style={{ color: 'var(--text-4)' }}>Нет данных</p>}
        </div>

        <div className="rounded-2xl p-4 card-appear" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-4)' }}>Дней в норме</p>
          {daysWithData.length > 0 ? (
            <>
              <p className="text-3xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>
                {daysOnTarget}<span className="text-lg" style={{ color: 'var(--text-4)' }}>/{daysWithData.length}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>≤ {goals.kcal} ккал</p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${daysWithData.length > 0 ? (daysOnTarget / daysWithData.length) * 100 : 0}%`, background: 'var(--success)' }} />
              </div>
            </>
          ) : <p className="text-sm mt-2" style={{ color: 'var(--text-4)' }}>Нет данных</p>}
        </div>
      </div>

      {/* Energy balance */}
      {avgDeficit !== null && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>
            Энергетический баланс · с учётом тренировок
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>{avgExpenditure}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>ср. расход</p>
            </div>
            <div>
              <p
                className="text-xl font-light tabular-nums"
                style={{ color: avgDeficit >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {avgDeficit >= 0 ? '−' : '+'}{Math.abs(avgDeficit)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                {avgDeficit >= 0 ? 'ср. дефицит' : 'ср. профицит'}
              </p>
            </div>
            <div>
              {estFatLoss !== null && estFatLoss !== 0 && (
                <>
                  <p className="text-xl font-light tabular-nums"
                    style={{ color: estFatLoss > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {estFatLoss > 0 ? '−' : '+'}{Math.abs(estFatLoss)}
                  </p>
                  {/* "кг жира" — estimate based on TDEE, not actual weigh-ins */}
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>≈ кг жира</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <CalorieChart data={data} goals={goals} baseTdee={baseTdee} tonnageByDate={tonnageByDate} />
      <MacroChart data={data} goals={goals} />
    </div>
  );
}
