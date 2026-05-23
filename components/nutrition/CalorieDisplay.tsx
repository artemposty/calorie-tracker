import { Goals, DayTotals } from '@/lib/types';

interface Props {
  totals: DayTotals;
  goals: Goals;
}

export function CalorieDisplay({ totals, goals }: Props) {
  const eaten = Math.round(totals.kcal);
  const remaining = goals.kcal - eaten;
  const isOver = remaining < 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center gap-1">
      <span className={`text-5xl font-bold tabular-nums ${isOver ? 'text-red-500' : 'text-slate-900'}`}>
        {eaten}
      </span>
      <span className="text-sm text-slate-400">
        из {goals.kcal} ккал
      </span>
      <span className={`text-sm font-medium mt-1 ${isOver ? 'text-red-500' : 'text-slate-600'}`}>
        {isOver
          ? `превышение ${Math.abs(remaining)} ккал`
          : `остаток ${remaining} ккал`}
      </span>

      {/* thin progress bar */}
      <div className="w-full mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-red-400' : 'bg-slate-700'}`}
          style={{ width: `${Math.min(100, (eaten / goals.kcal) * 100)}%` }}
        />
      </div>
    </div>
  );
}
