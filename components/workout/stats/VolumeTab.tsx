'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  useVolumeStats, MUSCLE_TARGETS, MUSCLE_LABELS, MUSCLE_COLORS, MUSCLE_ORDER,
  WeekVolumeData,
} from '@/hooks/useWorkoutStats';

function fmtChartDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)}.${parseInt(m)}`;
}

function muscleColor(sets: number, min: number, max: number): string {
  if (sets === 0)       return '#ff453a'; // red
  if (sets < min)       return '#f0a500'; // yellow
  if (sets <= max)      return '#30d158'; // green
  return '#ff9f0a';                       // orange
}

function WeekCard({ week }: { week: WeekVolumeData }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-4)' }}>Тренировок</p>
        <p className="text-3xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>{week.total_sessions}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>за неделю</p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-4)' }}>Рабочих подходов</p>
        <p className="text-3xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>{week.total_working_sets}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>RPE ≥ 7</p>
      </div>
    </div>
  );
}

function MuscleBars({ week }: { week: WeekVolumeData }) {
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Группы мышц · эта неделя</p>
      <div className="flex flex-col gap-2.5">
        {MUSCLE_ORDER.map(m => {
          const sets   = week.by_muscle[m]?.sets ?? 0;
          const target = MUSCLE_TARGETS[m];
          const pct    = Math.min((sets / target.max) * 100, 110);
          const color  = muscleColor(sets, target.min, target.max);
          const freq   = week.by_muscle[m]?.frequency ?? 0;
          return (
            <div key={m}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                  {MUSCLE_LABELS[m]}
                  {freq >= 2 && <span className="ml-1.5 text-[10px]" style={{ color: 'var(--success)' }}>×{freq}</span>}
                </span>
                <span className="text-xs tabular-nums" style={{ color: sets === 0 ? 'var(--text-4)' : 'var(--text-2)' }}>
                  {sets}/{target.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {[['#30d158','10–20'], ['#f0a500','<10'], ['#ff9f0a','>20'], ['#ff453a','0']].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-4)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

function StackedChart({ weeks }: { weeks: WeekVolumeData[] }) {
  const activeMuscles = useMemo(
    () => MUSCLE_ORDER.filter(m => weeks.some(w => (w.by_muscle[m]?.sets ?? 0) > 0)),
    [weeks],
  );

  const chartData = weeks.slice(-12).map(week => {
    const entry: Record<string, number | string> = { label: fmtChartDate(week.week_start) };
    for (const m of activeMuscles) entry[m] = week.by_muscle[m]?.sets ?? 0;
    return entry;
  });

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl flex items-center justify-center" style={{ minHeight: 160, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Недостаточно данных</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Объём за 12 недель</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {activeMuscles.map(m => (
          <span key={m} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-3)' }}>
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: MUSCLE_COLORS[m] }} />
            {MUSCLE_LABELS[m]}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }} barCategoryGap="20%">
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const total = payload.reduce((s, p) => s + (Number(p.value) || 0), 0);
              return (
                <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Нед. {label}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{total.toFixed(1)} подх.</p>
                  {[...payload].reverse().filter(p => Number(p.value) > 0).map(p => (
                    <p key={p.dataKey as string} className="text-xs" style={{ color: p.fill }}>
                      {MUSCLE_LABELS[p.dataKey as string]}: {p.value}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          {activeMuscles.map(m => (
            <Bar key={m} dataKey={m} stackId="a" fill={MUSCLE_COLORS[m]} radius={m === activeMuscles[activeMuscles.length - 1] ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VolumeTab() {
  const { data, loading } = useVolumeStats(12);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    );
  }

  const emptyWeek: WeekVolumeData = { week_start: '', total_sessions: 0, total_working_sets: 0, by_muscle: {} };
  const currentWeek = data?.current_week ?? emptyWeek;

  return (
    <div className="flex flex-col px-4">
      <WeekCard week={currentWeek} />
      <MuscleBars week={currentWeek} />
      <StackedChart weeks={data?.weeks ?? []} />
      <div style={{ height: 16 }} />
    </div>
  );
}
