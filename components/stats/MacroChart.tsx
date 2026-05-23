'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
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

const MACROS = [
  { key: 'p', label: 'Белки', color: '#3b82f6', goalKey: 'protein' },
  { key: 'f', label: 'Жиры', color: '#f59e0b', goalKey: 'fat' },
  { key: 'c', label: 'Углеводы', color: '#10b981', goalKey: 'carbs' },
] as const;

export function MacroChart({ data, goals }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);

  if (data.filter(d => d.p > 0 || d.f > 0 || d.c > 0).length < 2) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center min-h-[180px]">
        <p className="text-sm text-slate-400">Недостаточно данных для графика</p>
      </div>
    );
  }

  function toggle(key: string) {
    setHidden(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  const visible = MACROS.filter(m => !hidden.includes(m.key));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-slate-400 mb-3">БЖУ по дням, г</p>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {MACROS.map(m => {
          const isHidden = hidden.includes(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={`flex items-center gap-1.5 text-xs transition-opacity active:scale-95 ${isHidden ? 'opacity-30' : 'text-slate-500'}`}
            >
              <span className="w-5 h-0.5 inline-block rounded-full" style={{ backgroundColor: m.color }} />
              {m.label}
              <span className="text-slate-300">({goals[m.goalKey]}г)</span>
            </button>
          );
        })}
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
            formatter={(v, name) => {
              const m = MACROS.find(m => m.key === name);
              return [`${v} г`, m?.label ?? String(name)];
            }}
          />
          {visible.map(m => (
            <ReferenceLine
              key={`ref-${m.key}`}
              y={goals[m.goalKey]}
              stroke={m.color}
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
          ))}
          {visible.map(m => (
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
