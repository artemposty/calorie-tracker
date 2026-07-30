interface Stats {
  min: number; max: number; start: number; current: number;
  weekTrend: number | null; count: number;
}
interface Props { stats: Stats | null; }

function sign(n: number) { return n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1); }
function trendColor(n: number) {
  return n < 0 ? 'var(--success)' : n > 0 ? 'var(--danger)' : 'var(--text-1)';
}

export function WeightStats({ stats }: Props) {
  const fromStart = stats ? stats.current - stats.start : null;

  return (
    <div className="grid grid-cols-2 gap-3 mx-4">
      <div className="rounded-2xl px-4 py-3.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>За всё время</p>
        {stats && fromStart !== null ? (
          <>
            <p className="tabular-nums mt-1.5" style={{ fontSize: 22, fontWeight: 200, letterSpacing: '-0.02em', color: trendColor(fromStart) }}>
              {sign(fromStart)} кг
            </p>
            <p className="text-[11px] mt-1 tabular-nums" style={{ color: 'var(--text-3)' }}>
              {stats.start.toFixed(1)} → {stats.current.toFixed(1)} · {stats.count} замер{stats.count % 10 === 1 && stats.count % 100 !== 11 ? '' : 'ов'}
            </p>
          </>
        ) : <p className="text-sm mt-2" style={{ color: 'var(--text-4)' }}>Нет данных</p>}
      </div>

      <div className="rounded-2xl px-4 py-3.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>Тренд 7 дней</p>
        {stats?.weekTrend != null ? (
          <>
            <p className="tabular-nums mt-1.5" style={{ fontSize: 22, fontWeight: 200, letterSpacing: '-0.02em', color: trendColor(stats.weekTrend) }}>
              {sign(stats.weekTrend)} кг
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>ср. 7д vs пред. 7д</p>
          </>
        ) : <p className="text-sm mt-2" style={{ color: 'var(--text-4)' }}>Мало данных</p>}
      </div>
    </div>
  );
}
