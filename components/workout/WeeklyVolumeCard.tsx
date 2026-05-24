'use client';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Грудь', back: 'Спина', shoulders: 'Плечи',
  biceps: 'Бицепс', triceps: 'Трицепс', legs: 'Ноги',
  glutes: 'Ягодицы', core: 'Кор', calves: 'Икры',
  forearms: 'Предплечья', lower_back: 'Поясница',
};

// Evidence-based MEV/MRV targets (weekly sets per muscle)
const TARGETS: Record<string, number> = {
  chest: 12, back: 14, shoulders: 12, biceps: 10, triceps: 10,
  legs: 14, glutes: 12, core: 8, calves: 8, forearms: 6, lower_back: 6,
};

interface Props {
  volume: Record<string, number>;
  loading: boolean;
}

export function WeeklyVolumeCard({ volume, loading }: Props) {
  const entries = Object.entries(volume)
    .sort(([, a], [, b]) => b - a);

  if (loading) {
    return (
      <div className="mx-4 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="skeleton h-4 rounded w-1/2 mb-4" />
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-6 rounded mb-2" />)}
      </div>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mx-4 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>
        Объём за 7 дней
      </p>
      <div className="flex flex-col gap-2.5">
        {entries.map(([muscle, sets]) => {
          const target = TARGETS[muscle] ?? 10;
          const pct = Math.min((sets / target) * 100, 100);
          return (
            <div key={muscle}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                  {MUSCLE_LABELS[muscle] ?? muscle}
                </span>
                <span className="text-xs tabular-nums" style={{ color: sets >= target ? 'var(--success)' : 'var(--text-3)' }}>
                  {sets} / {target}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: sets >= target ? 'var(--success)' : 'var(--purple)',
                    transition: 'width 0.5s ease-out',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
