'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Goals } from '@/lib/types';

interface DayStats { displayDate: string; p: number; f: number; c: number; }
interface Props { data: DayStats[]; goals: Goals; }

const MACROS = [
  { key: 'p', label: 'Белки',    color: 'var(--protein)', goalKey: 'protein' },
  { key: 'f', label: 'Жиры',     color: 'var(--fat)',     goalKey: 'fat'     },
  { key: 'c', label: 'Углеводы', color: 'var(--carbs)',   goalKey: 'carbs'   },
] as const;

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
      {payload.map(p => {
        const m = MACROS.find(m => m.key === p.name);
        return (
          <p key={p.name} className="text-xs font-semibold tabular-nums" style={{ color: m?.color }}>
            {m?.label}: {p.value} г
          </p>
        );
      })}
    </div>
  );
}

export function MacroChart({ data, goals }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);

  if (data.filter(d => d.p > 0 || d.f > 0 || d.c > 0).length < 2) {
    return (
      <div className="rounded-2xl flex items-center justify-center" style={{ minHeight: 180, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Недостаточно данных</p>
      </div>
    );
  }

  function toggle(key: string) {
    setHidden(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  const visible = MACROS.filter(m => !hidden.includes(m.key));

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>БЖУ по дням, г</p>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {MACROS.map(m => {
          const isHidden = hidden.includes(m.key);
          return (
            <button key={m.key} onClick={() => toggle(m.key)}
              className="flex items-center gap-1.5 text-xs transition-opacity active:scale-95"
              style={{ opacity: isHidden ? 0.25 : 1, color: 'var(--text-2)' }}>
              <span className="w-5 h-0.5 inline-block rounded-full" style={{ background: m.color }} />
              {m.label}
              <span style={{ color: 'var(--text-4)' }}>({goals[m.goalKey]}г)</span>
            </button>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickLine={false} axisLine={false} width={30} />
          <Tooltip content={<CustomTooltip />} />
          {visible.map(m => (
            <ReferenceLine key={`ref-${m.key}`} y={goals[m.goalKey]}
              stroke={m.color} strokeDasharray="4 4" strokeOpacity={0.25} />
          ))}
          {visible.map(m => (
            <Line key={m.key} type="monotone" dataKey={m.key}
              stroke={m.color} strokeWidth={2}
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
