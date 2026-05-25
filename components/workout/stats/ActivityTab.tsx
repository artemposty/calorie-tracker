'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useActivityStats, MUSCLE_LABELS } from '@/hooks/useWorkoutStats';

const MONTH_NAMES = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function getMondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shiftDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tonnageColor(tonnage: number, maxTonnage: number): string {
  if (tonnage === 0) return 'rgba(255,255,255,0.06)';
  const r = tonnage / maxTonnage;
  if (r < 0.25) return 'rgba(48,209,88,0.3)';
  if (r < 0.5)  return 'rgba(48,209,88,0.55)';
  if (r < 0.75) return 'rgba(48,209,88,0.75)';
  return 'rgba(48,209,88,1)';
}

function Heatmap({ days }: { days: { date: string; tonnage: number }[] }) {
  const today = getToday();
  const dayMap = useMemo(() => new Map(days.map(d => [d.date, d.tonnage])), [days]);
  const maxTonnage = useMemo(() => Math.max(...days.map(d => d.tonnage), 1), [days]);

  // Generate weeks from 6 months ago (Monday) to today
  const { weeks, monthLabels } = useMemo(() => {
    const [y, m, d] = today.split('-').map(Number);
    const fromDate = new Date(y, m - 6, d);
    const fromStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
    const startMonday = getMondayOf(fromStr);

    const result: { weekStart: string; dates: string[] }[] = [];
    let cur = startMonday;
    while (cur <= today) {
      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        weekDates.push(shiftDays(cur, i));
      }
      result.push({ weekStart: cur, dates: weekDates });
      cur = shiftDays(cur, 7);
    }

    // Month label positions
    const labels: { weekIndex: number; label: string }[] = [];
    result.forEach((w, i) => {
      const month = w.weekStart.slice(0, 7);
      if (i === 0 || result[i - 1].weekStart.slice(0, 7) !== month) {
        const [, mm] = w.weekStart.split('-').map(Number);
        labels.push({ weekIndex: i, label: MONTH_NAMES[mm - 1] });
      }
    });

    return { weeks: result, monthLabels: labels };
  }, [today]);

  const DAY_LABELS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const CELL = 11;
  const GAP  = 2;

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Активность</p>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginLeft: 22 }}>
            {weeks.map((_, wi) => {
              const label = monthLabels.find(l => l.weekIndex === wi);
              return (
                <div key={wi} style={{ width: CELL + GAP, flexShrink: 0, fontSize: 9, color: 'var(--text-4)', lineHeight: '12px' }}>
                  {label?.label ?? ''}
                </div>
              );
            })}
          </div>
          {/* Day rows */}
          {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
            <div key={dayOfWeek} style={{ display: 'flex', alignItems: 'center', gap: GAP }}>
              <span style={{ width: 18, fontSize: 8, color: 'var(--text-4)', textAlign: 'right', flexShrink: 0 }}>
                {dayOfWeek % 2 === 0 ? DAY_LABELS[dayOfWeek] : ''}
              </span>
              {weeks.map(({ dates }) => {
                const date = dates[dayOfWeek];
                const isFuture = date > today;
                const tonnage  = dayMap.get(date) ?? 0;
                return (
                  <div
                    key={date}
                    title={`${date}: ${tonnage > 0 ? tonnage + ' кг' : 'нет'}`}
                    style={{
                      width: CELL, height: CELL, borderRadius: 2, flexShrink: 0,
                      background: isFuture ? 'transparent' : tonnageColor(tonnage, maxTonnage),
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 mt-3 items-center">
        <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>Мало</span>
        {[0.3, 0.55, 0.75, 1].map(o => (
          <div key={o} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(48,209,88,${o})` }} />
        ))}
        <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>Много</span>
      </div>
    </div>
  );
}

function RpeChart({ distribution }: { distribution: Record<string, number> }) {
  const RPE_VALUES = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];
  const chartData = RPE_VALUES.map(v => ({
    rpe: String(v),
    count: distribution[String(v)] ?? 0,
  }));

  const total = chartData.reduce((s, d) => s + d.count, 0);
  const lowPct  = total > 0 ? ((distribution['6'] ?? 0) + (distribution['5'] ?? 0)) / total * 100 : 0;
  const highPct = total > 0 ? ((distribution['9.5'] ?? 0) + (distribution['10'] ?? 0)) / total * 100 : 0;

  const rpeColor = (rpe: string) => {
    const v = Number(rpe);
    if (v < 7) return 'rgba(255,255,255,0.2)';
    if (v <= 9) return 'rgba(48,209,88,0.7)';
    return 'rgba(255,159,10,0.8)';
  };

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-4)' }}>Распределение RPE · 30 дней</p>
      {total === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--text-4)' }}>Нет данных</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="15%">
              <XAxis dataKey="rpe" tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>RPE {payload[0].payload.rpe}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{payload[0].value} подх.</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {chartData.map(entry => (
                  <Cell key={entry.rpe} fill={rpeColor(entry.rpe)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {lowPct >= 50 && (
            <p className="text-xs mt-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)' }}>
              Большинство подходов в RPE &lt; 7 — работай ближе к отказу для оптимальной гипертрофии
            </p>
          )}
          {highPct >= 40 && (
            <p className="text-xs mt-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,159,10,0.1)', color: '#ff9f0a' }}>
              Много подходов RPE 9.5–10 — возможна перетренировка, снизь интенсивность
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function ActivityTab() {
  const { data, loading } = useActivityStats(6);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    );
  }

  const summary = data?.month_summary;

  return (
    <div className="flex flex-col px-4">
      <Heatmap days={data?.days ?? []} />
      <RpeChart distribution={summary?.rpe_distribution ?? {}} />

      {/* Month summary */}
      {summary && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>Месяц</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-4)' }}>Тренировок</p>
              <p className="text-3xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>{summary.sessions}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-4)' }}>Подходов</p>
              <p className="text-3xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>{summary.total_sets}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>из них рабочих: {summary.total_working_sets}</p>
            </div>
          </div>

          {(summary.most_trained_muscle || summary.least_trained_muscle) && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {summary.most_trained_muscle && (
                <div className="flex justify-between items-center py-1.5">
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>Больше всего</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                    {MUSCLE_LABELS[summary.most_trained_muscle] ?? summary.most_trained_muscle}
                  </p>
                </div>
              )}
              {summary.most_trained_muscle && summary.least_trained_muscle && (
                <div style={{ height: 1, background: 'var(--border-sub)' }} />
              )}
              {summary.least_trained_muscle && (
                <div className="flex justify-between items-center py-1.5">
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>Меньше всего</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-3)' }}>
                    {MUSCLE_LABELS[summary.least_trained_muscle] ?? summary.least_trained_muscle}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
