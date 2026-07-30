'use client';

import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
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
  const lastIdx = data.length - 1;

  return (
    <div className="mx-4 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[10.5px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>Динамика веса</p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="weightAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(226,228,255,0.16)" />
              <stop offset="100%" stopColor="rgba(226,228,255,0)" />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={domain} tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} unit=" кг" width={52} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={STARTING_WEIGHT} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4"
            label={{ value: `${STARTING_WEIGHT}`, fontSize: 10, fill: 'var(--text-4)', position: 'right' }} />
          {/* Soft gradient wash under the line */}
          <Area type="monotone" dataKey="weight" stroke="none" fill="url(#weightAreaFill)" isAnimationActive={false} />
          <Line type="monotone" dataKey="weight"
            stroke="rgba(255,255,255,0.85)" strokeWidth={2}
            isAnimationActive={false}
            // Only the latest reading gets a dot — glowing, like the ring's endpoint cap
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, index } = props as { cx?: number; cy?: number; index?: number };
              if (cx == null || cy == null || index !== lastIdx) return <circle key={`d${index}`} r={0} />;
              return <circle key={`d${index}`} cx={cx} cy={cy} r={3.5} fill="#ffffff"
                style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.6))' }} />;
            }}
            activeDot={{ r: 5, fill: '#ffffff', style: { filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))' } }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
