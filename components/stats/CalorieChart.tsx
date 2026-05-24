'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { Goals } from '@/lib/types';

interface DayStats { date: string; displayDate: string; kcal: number; p: number; f: number; c: number; }
interface Props { data: DayStats[]; goals: Goals; }

function CustomDot(props: { cx?: number; cy?: number; payload?: DayStats; goal: number }) {
  const { cx, cy, payload, goal } = props;
  if (!cx || !cy || !payload || payload.kcal === 0) return null;
  const color = payload.kcal > goal + 150 ? 'var(--danger)' : payload.kcal < goal - 150 ? 'var(--text-4)' : 'var(--success)';
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--bg-card)" strokeWidth={2} />;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{payload[0].value} ккал</p>
    </div>
  );
}

export function CalorieChart({ data, goals }: Props) {
  if (data.filter(d => d.kcal > 0).length < 2) {
    return (
      <div className="rounded-2xl flex items-center justify-center" style={{ minHeight: 180, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Недостаточно данных</p>
      </div>
    );
  }

  const goalLow  = Math.max(0, goals.kcal - 150);
  const goalHigh = goals.kcal + 150;
  const maxKcal  = Math.max(...data.map(d => d.kcal), goalHigh);
  const yMax     = Math.ceil((maxKcal + 200) / 100) * 100;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>Калории по дням</p>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {[['var(--success)', '±150 от цели'], ['var(--danger)', 'превышение'], ['var(--text-4)', 'дефицит']].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <ReferenceArea y1={0}        y2={goalLow}  fill="rgba(255,255,255,0.02)" ifOverflow="hidden" />
          <ReferenceArea y1={goalLow}  y2={goalHigh} fill="rgba(48,209,88,0.08)"   ifOverflow="hidden" />
          <ReferenceArea y1={goalHigh} y2={yMax}     fill="rgba(255,69,58,0.08)"   ifOverflow="hidden" />
          <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, yMax]} tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} width={42} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={goals.kcal} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"
            label={{ value: `${goals.kcal}`, fontSize: 10, fill: 'var(--text-4)', position: 'right' }} />
          <Line type="monotone" dataKey="kcal" stroke="rgba(255,255,255,0.7)" strokeWidth={2}
            dot={(props) => <CustomDot {...props} goal={goals.kcal} />}
            activeDot={{ r: 5 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
