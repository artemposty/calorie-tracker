interface Stats {
  min: number;
  max: number;
  start: number;
  current: number;
  weekTrend: number | null;
  count: number;
}

interface Props {
  stats: Stats | null;
  todayWeight: number | null;
}

function sign(n: number) {
  if (n > 0) return `+${n.toFixed(1)}`;
  return n.toFixed(1);
}

export function WeightStats({ stats, todayWeight }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Today big number */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center gap-1">
        <span className="text-5xl font-bold tabular-nums text-slate-900">
          {todayWeight !== null ? todayWeight.toFixed(1) : '—'}
        </span>
        <span className="text-sm text-slate-400">кг сегодня</span>
      </div>

      {/* Two stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* All time */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-2">За всё время</p>
          {stats ? (
            <>
              <p className="text-lg font-bold tabular-nums text-slate-900">
                {sign(stats.current - stats.start)} кг
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.start.toFixed(1)} → {stats.current.toFixed(1)}
              </p>
              <p className="text-xs text-slate-300 mt-1">{stats.count} замер{stats.count === 1 ? '' : 'а'}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Нет данных</p>
          )}
        </div>

        {/* Week trend */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 mb-2">Тренд за неделю</p>
          {stats?.weekTrend !== null && stats?.weekTrend !== undefined ? (
            <>
              <p className={`text-lg font-bold tabular-nums ${
                stats.weekTrend < 0 ? 'text-emerald-600' : stats.weekTrend > 0 ? 'text-red-500' : 'text-slate-900'
              }`}>
                {sign(stats.weekTrend)} кг
              </p>
              <p className="text-xs text-slate-400 mt-1">ср. 7д vs пред. 7д</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Мало данных</p>
          )}
        </div>
      </div>
    </div>
  );
}
