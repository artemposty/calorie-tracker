'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { Goals } from '@/lib/types';

interface DayStats {
  displayDate: string;
  p: number;
  f: number;
  c: number;
}

interface Props {
  data: DayStats[];
  goals: Goals;
}

export function MacroChart({ data, goals }: Props) {
  if (data.filter(d => d.p > 0 || d.f > 0 || d.c > 0).length < 2) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center min-h-[180px]">
        <p className="text-sm text-slate-400">Недостаточно данных для графика</p>
      </div>
    );
  }

  const MACROS = [
    { key: 'p', label: 'Белки', color: '#3b82f6', goal: goals.protein },
    { key: 'f', label: 'Жиры', color: '#f59e0b', goal: goals.fat },
    { key: 'c', label: 'Углеводы', color: '#10b981', goal: goals.carbs },
  ] as const;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-slate-400 mb-3">БЖУ по дням, г</p>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {MACROS.map(m => (
          <span key={m.key} className="flex items-center gap-1 text-xs text-slate-500">
            <span className="w-5 h-0.5 inline-block" style={{ backgroundColor: m.color }} />
            {m.label} <span className="text-slate-300">({m.goal}г)</span>
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false} axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false} axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(v, name) => [`${v} г`, name === 'p' ? 'Белки' : name === 'f' ? 'Жиры' : 'Углеводы']}
          />
          {MACROS.map(m => (
            <ReferenceLine
              key={`ref-${m.key}`}
              y={m.goal}
              stroke={m.color}
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
          ))}
          {MACROS.map(m => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              stroke={m.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
