'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { WeightEntry } from '@/lib/types';
import { STARTING_WEIGHT } from '@/lib/constants';
import { formatShortDate } from '@/lib/storage';

interface Props { entries: WeightEntry[]; }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{payload[0].value.toFixed(1)} кг</p>
    </div>
  );
}

export function WeightChart({ entries }: Props) {
  if (entries.length < 2) {
    return (
      <div className="mx-4 rounded-2xl flex items-center justify-center" style={{ minHeight: 180, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Добавьте минимум 2 замера для графика</p>
      </div>
    );
  }

  const data = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({ date: formatShortDate(e.date), weight: e.weight }));

  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights, STARTING_WEIGHT);
  const maxW = Math.max(...weights, STARTING_WEIGHT);
  const pad  = 0.5;
  const domain: [number, number] = [Math.floor(minW - pad), Math.ceil(maxW + pad)];

  return (
    <div className="mx-4 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>Динамика веса</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={domain} tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} unit=" кг" width={52} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={STARTING_WEIGHT} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4"
            label={{ value: `${STARTING_WEIGHT}`, fontSize: 10, fill: 'var(--text-4)', position: 'right' }} />
          <Line type="monotone" dataKey="weight"
            stroke="rgba(255,255,255,0.9)" strokeWidth={2}
            dot={{ fill: '#ffffff', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#ffffff', style: { filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))' } }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.2))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
