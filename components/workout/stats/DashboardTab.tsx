'use client';

import { useWorkoutDashboard } from '@/hooks/useWorkoutDashboard';

const BAR_MAX_H = 44;
const WEEK_LABELS = ['3 нед.', '2 нед.', '1 нед.', 'Эта'];

export function DashboardTab() {
  const { data, loading } = useWorkoutDashboard();

  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    );
  }

  if (!data) return null;

  const { weeklyFreq, prsThisWeek, topProgress, neglectedMuscles } = data;
  const maxFreq = Math.max(...weeklyFreq, 1);
  const totalSessions = weeklyFreq.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">

      {/* Weekly frequency */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
            Тренировок по неделям
          </p>
          <p className="text-xs tabular-nums" style={{ color: 'var(--text-3)' }}>
            {totalSessions} за 4 нед.
          </p>
        </div>
        <div className="flex items-end gap-2" style={{ height: BAR_MAX_H + 32 }}>
          {weeklyFreq.map((count, i) => {
            const barH = count === 0 ? 3 : Math.max(6, Math.round((count / maxFreq) * BAR_MAX_H));
            const isCurrent = i === weeklyFreq.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold tabular-nums" style={{ color: isCurrent ? 'var(--text-1)' : 'var(--text-3)' }}>
                  {count}
                </span>
                <div
                  className="w-full rounded-md"
                  style={{
                    height: barH,
                    background: isCurrent ? 'var(--text-1)' : 'var(--bg-elevated)',
                    transition: 'height 0.4s ease',
                  }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>{WEEK_LABELS[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRs this week */}
      {prsThisWeek.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>
            🏆 Рекорды этой недели
          </p>
          <div className="flex flex-col gap-2.5">
            {prsThisWeek.map((pr, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{pr.name}</p>
                  <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--text-3)' }}>
                    {pr.weight} кг × {pr.reps}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--success)' }}>
                    e1RM {pr.e1rm}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>кг</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top progress */}
      {topProgress.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>
            Лучший прогресс · 4 недели
          </p>
          <div className="flex flex-col gap-2.5">
            {topProgress.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{item.name}</p>
                  <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--text-3)' }}>
                    e1RM {item.currentE1rm} кг
                  </p>
                </div>
                <div
                  className="text-sm font-bold tabular-nums ml-3"
                  style={{ color: 'var(--success)' }}
                >
                  ↑ +{item.deltaPct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neglected muscles */}
      {neglectedMuscles.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>
            Давно не тренировал
          </p>
          <div className="flex flex-col gap-2">
            {neglectedMuscles.map((m, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{m.label}</p>
                <p
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: m.days >= 14 ? 'var(--danger)' : m.days >= 10 ? 'var(--warning, #f59e0b)' : 'var(--text-3)' }}
                >
                  {m.days} дн.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {weeklyFreq.every(v => v === 0) && (
        <div
          className="rounded-2xl flex items-center justify-center"
          style={{ minHeight: 120, border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-4)' }}>Начни тренироваться, чтобы увидеть статистику</p>
        </div>
      )}
    </div>
  );
}
