'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { Goals } from '@/lib/types';

interface DayStats { displayDate: string; p: number; f: number; c: number; }
interface Props { data: DayStats[]; goals: Goals; }

// Zone boundaries as fractions of goal
// Protein: ≤74% red, ≤97% yellow, ≥97% green (no upper limit)
// Fat:     ≤54% red, ≤69% yellow, 85-108% green, ≥108% yellow, ≥138% red
// Carbs:   ≤43% red, ≤68% yellow, 68-111% green, ≥111% yellow, ≥136% red
type Zone = { lo: number; hi: number; fill: string };

const MACRO_CONFIG: {
  key: 'p' | 'f' | 'c';
  label: string;
  goalKey: 'protein' | 'fat' | 'carbs';
  color: string;
  zones: Zone[];
}[] = [
  {
    key: 'p', label: 'Белок', goalKey: 'protein', color: 'var(--protein)',
    zones: [
      { lo: 0,    hi: 0.74, fill: 'rgba(255,69,58,0.07)' },
      { lo: 0.74, hi: 0.97, fill: 'rgba(255,159,10,0.06)' },
      { lo: 0.97, hi: 9,    fill: 'rgba(48,209,88,0.06)' },
    ],
  },
  {
    key: 'f', label: 'Жиры', goalKey: 'fat', color: 'var(--fat)',
    zones: [
      { lo: 0,    hi: 0.54, fill: 'rgba(255,69,58,0.07)' },
      { lo: 0.54, hi: 0.69, fill: 'rgba(255,159,10,0.06)' },
      { lo: 0.69, hi: 1.08, fill: 'rgba(48,209,88,0.06)' },
      { lo: 1.08, hi: 1.38, fill: 'rgba(255,159,10,0.06)' },
      { lo: 1.38, hi: 9,    fill: 'rgba(255,69,58,0.07)' },
    ],
  },
  {
    key: 'c', label: 'Углеводы', goalKey: 'carbs', color: 'var(--carbs)',
    zones: [
      { lo: 0,    hi: 0.43, fill: 'rgba(255,69,58,0.07)' },
      { lo: 0.43, hi: 0.68, fill: 'rgba(255,159,10,0.06)' },
      { lo: 0.68, hi: 1.11, fill: 'rgba(48,209,88,0.06)' },
      { lo: 1.11, hi: 1.36, fill: 'rgba(255,159,10,0.06)' },
      { lo: 1.36, hi: 9,    fill: 'rgba(255,69,58,0.07)' },
    ],
  },
];

function getZoneColor(frac: number, zones: Zone[]): string {
  if (frac <= 0) return 'transparent';
  for (const z of zones) {
    if (frac <= z.hi) {
      // Use fill opacity to derive dot color
      if (z.fill.includes('69,58'))  return '#ff453a';
      if (z.fill.includes('159,10')) return '#ff9f0a';
      return '#30d158';
    }
  }
  return '#ff453a';
}

function SingleChart({ data, dataKey, label, goal, color, zones }: {
  data: DayStats[]; dataKey: 'p' | 'f' | 'c'; label: string;
  goal: number; color: string; zones: Zone[];
}) {
  const vals = data.map(d => d[dataKey]).filter(v => v > 0);
  if (vals.length < 2) return null;

  const maxVal = Math.max(...vals, goal * 1.4);
  const yMax   = Math.ceil((maxVal + 10) / 20) * 20;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
          {label}
        </p>
        <p className="text-[10px] tabular-nums" style={{ color: 'var(--text-4)' }}>
          цель {goal} г
        </p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          {/* Zone bands */}
          {zones.map((z, i) => (
            <ReferenceArea key={i}
              y1={Math.round(goal * z.lo)}
              y2={Math.min(Math.round(goal * z.hi), yMax)}
              fill={z.fill} ifOverflow="hidden" />
          ))}

          <XAxis dataKey="displayDate" tick={{ fontSize: 9, fill: 'var(--text-4)' }}
            tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, yMax]} tick={{ fontSize: 9, fill: 'var(--text-4)' }}
            tickLine={false} axisLine={false} width={32} />
          <Tooltip content={({ active, payload, label: lbl }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{lbl}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color }}>{payload[0].value} г</p>
              </div>
            );
          }} />

          <ReferenceLine y={goal} stroke={color} strokeOpacity={0.3} strokeDasharray="4 4" />

          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: DayStats };
              if (!cx || !cy || !payload) return <circle key="e" r={0} />;
              const val = payload[dataKey];
              if (val === 0) return <circle key="e0" r={0} />;
              const fill = getZoneColor(val / goal, zones);
              return <circle key={`d-${cx}`} cx={cx} cy={cy} r={3.5} fill={fill} stroke="var(--bg-card)" strokeWidth={1.5} />;
            }}
            activeDot={{ r: 4.5, strokeWidth: 0 }}
            connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MacroChart({ data, goals }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {MACRO_CONFIG.map(m => (
        <SingleChart
          key={m.key}
          data={data}
          dataKey={m.key}
          label={m.label}
          goal={goals[m.goalKey]}
          color={m.color}
          zones={m.zones}
        />
      ))}
    </div>
  );
}
