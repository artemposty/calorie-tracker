'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useStrengthStats, MUSCLE_LABELS } from '@/hooks/useWorkoutStats';
import { useExercises } from '@/hooks/useExercises';
import { haptic } from '@/lib/haptics';

function fmtDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)}.${parseInt(m)}`;
}

function fmtFull(dateStr: string): string {
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

interface ExPickerProps {
  exercises: { id: string; name: string; primaryMuscle: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}

function ExercisePicker({ exercises, selected, onSelect }: ExPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState('');

  const grouped = useMemo(() => {
    const q2 = q.toLowerCase();
    const filtered = q2
      ? exercises.filter(e => e.name.toLowerCase().includes(q2))
      : exercises;
    const g: Record<string, typeof exercises> = {};
    for (const ex of filtered) {
      const label = MUSCLE_LABELS[ex.primaryMuscle] ?? ex.primaryMuscle;
      if (!g[label]) g[label] = [];
      g[label].push(ex);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b, 'ru'));
  }, [exercises, q]);

  const selectedEx = exercises.find(e => e.id === selected);

  return (
    <>
      <button
        onClick={() => { haptic('light'); setOpen(true); }}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-4 active:opacity-70"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-4)' }}>Упражнение</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            {selectedEx?.name ?? 'Выбрать упражнение'}
          </p>
        </div>
        <svg width="16" height="16" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex flex-col modal-sheet"
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px 20px 0 0',
              maxHeight: '80dvh',
              paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>
            <p className="text-base font-semibold px-4 py-2" style={{ color: 'var(--text-1)' }}>Выбери упражнение</p>
            <div className="px-4 pb-2">
              <input
                type="text" placeholder="Поиск..." value={q} onChange={e => setQ(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl outline-none"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
              />
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-2">
              {grouped.map(([muscle, exs]) => (
                <div key={muscle} className="mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-4)' }}>{muscle}</p>
                  <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    {exs.map((ex, i) => (
                      <div key={ex.id}>
                        <button
                          className="w-full text-left px-4 py-3 active:opacity-60"
                          style={{
                            background: ex.id === selected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                            color: 'var(--text-1)',
                          }}
                          onClick={() => { haptic('light'); onSelect(ex.id); setOpen(false); setQ(''); }}
                        >
                          <p className="text-sm font-medium">{ex.name}</p>
                        </button>
                        {i < exs.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PrDot(props: { cx?: number; cy?: number; payload?: { is_pr: boolean }; isPr?: boolean }) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload?.is_pr) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="var(--bg-card)" stroke="var(--success)" strokeWidth={2} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="var(--success)">★</text>
    </g>
  );
}

export function StrengthTab() {
  const { exercises, loading: exLoading } = useExercises();
  const [exerciseId, setExerciseId] = useState<string | null>(null);

  const defaultId = useMemo(() => {
    if (exerciseId) return exerciseId;
    return exercises[0]?.id ?? null;
  }, [exercises, exerciseId]);

  const activeId = exerciseId ?? defaultId;

  const { data, loading } = useStrengthStats(activeId, 16);

  const chartData = data?.sessions.map(s => ({
    label: fmtDate(s.date),
    e1rm: s.e1rm,
    is_pr: s.is_pr,
    top_weight: s.top_set.weight,
    top_reps: s.top_set.reps,
    date: s.date,
  })) ?? [];

  const trend = data?.trend_4w;
  const trendUp    = trend && trend.delta_pct > 2;
  const trendDown  = trend && trend.delta_pct < -2;
  const trendColor = trendUp ? 'var(--success)' : trendDown ? 'var(--danger)' : 'var(--text-3)';
  const trendSign  = trend ? (trend.delta_pct > 0 ? '+' : '') : '';

  if (exLoading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4">
      <ExercisePicker
        exercises={exercises}
        selected={activeId}
        onSelect={id => setExerciseId(id)}
      />

      {/* PR card */}
      {data?.pr && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Личный рекорд</p>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-3xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>
              {data.pr.weight} кг
            </span>
            <span className="text-base mb-0.5" style={{ color: 'var(--text-3)' }}>× {data.pr.reps}</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
            e1RM {data.pr.e1rm} кг
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{fmtFull(data.pr.date)}</p>
        </div>
      )}

      {/* e1RM chart */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-4)' }}>Прогрессия e1RM</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-4)' }}>★ = новый рекорд</p>
        {loading ? (
          <div className="skeleton h-32 rounded-xl" />
        ) : chartData.length < 2 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>Нужно ≥ 2 тренировок</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{fmtFull(d.date)}</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>e1RM {d.e1rm} кг</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{d.top_weight} кг × {d.top_reps} повт.</p>
                      {d.is_pr && <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>★ Рекорд</p>}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="e1rm"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={2}
                dot={(props) => <PrDot {...props} />}
                activeDot={{ r: 5 }}
              />
              {chartData.filter(d => d.is_pr).map(d => (
                <ReferenceDot key={d.date} x={d.label} y={d.e1rm} r={0} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 4w trend */}
      {trend && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Тренд · 4 недели</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold tabular-nums" style={{ color: trendColor }}>
              {trendSign}{trend.delta_pct}%
            </span>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {trendUp ? '↑ Прогресс идёт' : trendDown ? '↓ Возможен деллоад' : '→ Стагнация'}
              </p>
              <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--text-4)' }}>
                {trend.current_avg_e1rm} vs {trend.previous_avg_e1rm} кг (ср. e1RM)
              </p>
            </div>
          </div>
          {trendDown && (
            <p className="text-xs mt-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,69,58,0.1)', color: 'var(--danger)' }}>
              e1RM падает 4+ нед. — рассмотри деллоад или смену программы
            </p>
          )}
        </div>
      )}

      {!data?.pr && !loading && activeId && (
        <div className="rounded-2xl flex items-center justify-center px-4" style={{ minHeight: 120, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-4)' }}>Нет данных по этому упражнению</p>
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
