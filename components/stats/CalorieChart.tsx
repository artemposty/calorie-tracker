'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { Goals } from '@/lib/types';
import { calcWorkoutKcal, calcExpenditure } from '@/lib/energy';

interface DayStats { date: string; displayDate: string; kcal: number; }
interface Props {
  data: DayStats[];
  goals: Goals;
  baseTdee: number;
  tonnageByDate: Record<string, number>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const kcalP = payload.find(p => p.dataKey === 'kcal');
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
      {kcalP && <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{kcalP.value} ккал</p>}
    </div>
  );
}

export function CalorieChart({ data, goals, baseTdee, tonnageByDate }: Props) {
  const goal = goals.kcal;
  const yellowLow = Math.round(goal * 0.84);
  const redLow    = Math.round(goal * 0.73);

  // Per-day expenditure for dot coloring
  const expenditureByDate: Record<string, number> = {};
  for (const d of data) {
    expenditureByDate[d.date] = calcExpenditure(baseTdee, calcWorkoutKcal(tonnageByDate[d.date] ?? 0));
  }

  // Average expenditure for the static upper zone
  const expValues = Object.values(expenditureByDate);
  const avgExp = expValues.length > 0
    ? Math.round(expValues.reduce((a, b) => a + b, 0) / expValues.length)
    : baseTdee;

  const chartData = data.map(d => ({
    displayDate: d.displayDate,
    kcal: d.kcal,
    date: d.date,
  }));

  const hasData = chartData.filter(d => d.kcal > 0).length >= 2;
  if (!hasData) {
    return (
      <div className="rounded-2xl flex items-center justify-center" style={{ minHeight: 180, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Недостаточно данных</p>
      </div>
    );
  }

  const maxVal = Math.max(...chartData.map(d => d.kcal), avgExp);
  const yMax   = Math.ceil((maxVal + 300) / 200) * 200;

  function dotColor(kcal: number, exp: number): string {
    if (kcal === 0) return 'transparent';
    if (kcal < redLow)    return '#ff453a';
    if (kcal < yellowLow) return '#ff9f0a';
    if (kcal <= goal)     return '#30d158';
    if (kcal <= exp)      return '#ff9f0a';
    return '#ff453a';
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
        Калории по дням
      </p>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {[
          ['#ff453a', 'перебор / недобор'],
          ['#ff9f0a', 'внимание'],
          ['#30d158', 'в норме'],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-3)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          {/* ── Zone bands (bottom to top) ─────────────────────────── */}
          <ReferenceArea y1={0}       y2={redLow}    fill="rgba(255,69,58,0.06)"  ifOverflow="hidden" />
          <ReferenceArea y1={redLow}  y2={yellowLow} fill="rgba(255,159,10,0.05)" ifOverflow="hidden" />
          <ReferenceArea y1={yellowLow} y2={goal}    fill="rgba(48,209,88,0.06)"  ifOverflow="hidden" />
          <ReferenceArea y1={goal}    y2={avgExp}    fill="rgba(255,159,10,0.05)" ifOverflow="hidden" />
          <ReferenceArea y1={avgExp}  y2={yMax}      fill="rgba(255,69,58,0.06)"  ifOverflow="hidden" />

          <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: 'var(--text-4)' }}
            tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, yMax]} tick={{ fontSize: 10, fill: 'var(--text-4)' }}
            tickLine={false} axisLine={false} width={42} />
          <Tooltip content={<CustomTooltip />} />

          {/* ── Reference lines ───────────────────────────────────── */}
          <ReferenceLine y={goal} stroke="rgba(48,209,88,0.25)" strokeDasharray="4 4"
            label={{ value: `цель`, fontSize: 9, fill: 'rgba(48,209,88,0.45)', position: 'right' }} />
          <ReferenceLine y={avgExp} stroke="rgba(255,158,10,0.25)" strokeDasharray="4 4"
            label={{ value: `расход`, fontSize: 9, fill: 'rgba(255,158,10,0.40)', position: 'right' }} />

          {/* ── Intake line ───────────────────────────────────────── */}
          <Line type="monotone" dataKey="kcal" stroke="rgba(255,255,255,0.55)" strokeWidth={2}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: { kcal: number; date: string } };
              if (!cx || !cy || !payload || payload.kcal === 0) return <circle key="e" r={0} />;
              const exp = expenditureByDate[payload.date] ?? avgExp;
              return <circle key={`d-${cx}`} cx={cx} cy={cy} r={4} fill={dotColor(payload.kcal, exp)} stroke="var(--bg-card)" strokeWidth={2} />;
            }}
            activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
