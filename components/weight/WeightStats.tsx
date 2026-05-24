interface Stats {
  min: number; max: number; start: number; current: number;
  weekTrend: number | null; count: number;
}
interface Props { stats: Stats | null; todayWeight: number | null; }

function sign(n: number) { return n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1); }

export function WeightStats({ stats, todayWeight }: Props) {
  const fromStart = stats ? stats.current - stats.start : null;

  return (
    <div className="flex flex-col gap-3 mx-4">
      {/* Big current weight */}
      <div className="rounded-2xl flex flex-col items-center py-7"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="tabular-nums" style={{ fontSize: 72, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
          {todayWeight !== null ? todayWeight.toFixed(1) : '—'}
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>кг сегодня</p>
        {fromStart !== null && (
          <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full"
            style={{ background: fromStart < 0 ? 'rgba(48,209,88,0.12)' : fromStart > 0 ? 'rgba(255,69,58,0.12)' : 'var(--bg-elevated)' }}>
            <span className="text-sm font-semibold" style={{ color: fromStart < 0 ? 'var(--success)' : fromStart > 0 ? 'var(--danger)' : 'var(--text-3)' }}>
              {sign(fromStart)} кг от старта
            </span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-4)' }}>За всё время</p>
          {stats ? (
            <>
              <p className="text-2xl font-light tabular-nums" style={{ color: stats.current - stats.start < 0 ? 'var(--success)' : stats.current - stats.start > 0 ? 'var(--danger)' : 'var(--text-1)' }}>
                {sign(stats.current - stats.start)} кг
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
                {stats.start.toFixed(1)} → {stats.current.toFixed(1)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                {stats.count} замер{stats.count === 1 ? '' : 'а'}
              </p>
            </>
          ) : <p className="text-sm mt-2" style={{ color: 'var(--text-4)' }}>Нет данных</p>}
        </div>

        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-4)' }}>Тренд 7 дней</p>
          {stats?.weekTrend != null ? (
            <>
              <p className="text-2xl font-light tabular-nums"
                style={{ color: stats.weekTrend < 0 ? 'var(--success)' : stats.weekTrend > 0 ? 'var(--danger)' : 'var(--text-1)' }}>
                {sign(stats.weekTrend)} кг
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>ср. 7д vs пред. 7д</p>
            </>
          ) : <p className="text-sm mt-2" style={{ color: 'var(--text-4)' }}>Мало данных</p>}
        </div>
      </div>
    </div>
  );
}
