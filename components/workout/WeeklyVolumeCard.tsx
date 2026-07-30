'use client';

import { MUSCLE_TARGETS, MUSCLE_LABELS } from '@/hooks/useWorkoutStats';

interface Props {
  volume: Record<string, number>;
  loading: boolean;
}

export function WeeklyVolumeCard({ volume, loading }: Props) {
  const entries = Object.entries(volume).sort(([, a], [, b]) => b - a);

  if (loading) {
    return (
      <div className="mx-4 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="skeleton h-4 rounded w-1/2 mb-4" />
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-6 rounded mb-2" />)}
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <div className="mx-4 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[10.5px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>
        Объём за 7 дней · целевые диапазоны
      </p>
      <div className="flex flex-col gap-2.5">
        {entries.map(([muscle, sets]) => {
          // Single source of truth for targets — same ranges the stats module uses
          const t = MUSCLE_TARGETS[muscle] ?? { min: 8, max: 16 };
          const scaleMax = Math.max(t.max * 1.3, sets + 2);
          const color = sets < t.min ? 'var(--fat)' : sets <= t.max ? 'var(--success)' : 'var(--danger)';
          return (
            <div key={muscle}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                  {MUSCLE_LABELS[muscle] ?? muscle}
                </span>
                <span className="text-xs tabular-nums" style={{ color }}>
                  {sets} <span style={{ color: 'var(--text-4)' }}>/ {t.min}–{t.max}</span>
                </span>
              </div>
              <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                {/* Target range band */}
                <div className="absolute inset-y-0" style={{
                  left: `${(t.min / scaleMax) * 100}%`,
                  width: `${((t.max - t.min) / scaleMax) * 100}%`,
                  background: 'rgba(255,255,255,0.07)',
                }} />
                <div className="absolute inset-y-0 left-0 rounded-full" style={{
                  width: `${Math.min((sets / scaleMax) * 100, 100)}%`,
                  background: color,
                  transition: 'width 0.5s ease-out',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
