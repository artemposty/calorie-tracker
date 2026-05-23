'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { WeightEntry } from '@/lib/types';
import { STARTING_WEIGHT } from '@/lib/constants';
import { formatShortDate } from '@/lib/storage';

interface Props {
  entries: WeightEntry[];
}

export function WeightChart({ entries }: Props) {
  if (entries.length < 2) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center min-h-[180px]">
        <p className="text-sm text-slate-400">Добавьте минимум 2 замера для графика</p>
      </div>
    );
  }

  const data = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({ date: formatShortDate(e.date), weight: e.weight }));

  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights, STARTING_WEIGHT);
  const maxW = Math.max(...weights, STARTING_WEIGHT);
  const pad = 0.5;
  const domain: [number, number] = [Math.floor(minW - pad), Math.ceil(maxW + pad)];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-slate-400 mb-3">Динамика веса</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            unit=" кг"
            width={52}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(v) => [`${Number(v).toFixed(1)} кг`, 'Вес']}
          />
          <ReferenceLine
            y={STARTING_WEIGHT}
            stroke="#cbd5e1"
            strokeDasharray="4 4"
            label={{ value: `старт ${STARTING_WEIGHT}`, fontSize: 10, fill: '#94a3b8', position: 'right' }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#1e293b"
            strokeWidth={2}
            dot={{ fill: '#1e293b', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#1e293b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
