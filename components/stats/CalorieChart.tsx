'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { Goals } from '@/lib/types';

interface DayStats {
  date: string;
  displayDate: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
}

interface Props {
  data: DayStats[];
  goals: Goals;
}

function CustomDot(props: { cx?: number; cy?: number; payload?: DayStats; goal: number }) {
  const { cx, cy, payload, goal } = props;
  if (!cx || !cy || !payload || payload.kcal === 0) return null;
  const fill = payload.kcal > goal + 150 ? '#ef4444' : payload.kcal < goal - 150 ? '#94a3b8' : '#22c55e';
  return <circle cx={cx} cy={cy} r={4} fill={fill} stroke="white" strokeWidth={1.5} />;
}

export function CalorieChart({ data, goals }: Props) {
  if (data.filter(d => d.kcal > 0).length < 2) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center min-h-[180px]">
        <p className="text-sm text-slate-400">Недостаточно данных для графика</p>
      </div>
    );
  }

  const goalLow = Math.max(0, goals.kcal - 150);
  const goalHigh = goals.kcal + 150;
  const maxKcal = Math.max(...data.map(d => d.kcal), goalHigh);
  const yMax = Math.ceil((maxKcal + 200) / 100) * 100;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-slate-400 mb-1">Калории по дням</p>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> ±150 ккал от цели
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> превышение
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> дефицит
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <ReferenceArea y1={0} y2={goalLow} fill="#f1f5f9" fillOpacity={0.9} ifOverflow="hidden" />
          <ReferenceArea y1={goalLow} y2={goalHigh} fill="#dcfce7" fillOpacity={0.7} ifOverflow="hidden" />
          <ReferenceArea y1={goalHigh} y2={yMax} fill="#fee2e2" fillOpacity={0.5} ifOverflow="hidden" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false} axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false} axisLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(v) => [`${v} ккал`, 'Калории']}
          />
          <ReferenceLine
            y={goals.kcal}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: `${goals.kcal}`, fontSize: 10, fill: '#94a3b8', position: 'right' }}
          />
          <Line
            type="monotone"
            dataKey="kcal"
            stroke="#1e293b"
            strokeWidth={2}
            dot={(props) => <CustomDot {...props} goal={goals.kcal} />}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
