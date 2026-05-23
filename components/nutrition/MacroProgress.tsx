import { Goals, DayTotals } from '@/lib/types';

interface Props {
  totals: DayTotals;
  goals: Goals;
}

interface MacroDef {
  key: keyof DayTotals;
  label: string;
  goal: number;
  color: string;
  overColor: string;
}

export function MacroProgress({ totals, goals }: Props) {
  const macros: MacroDef[] = [
    { key: 'p', label: 'Белки', goal: goals.protein, color: 'bg-blue-500', overColor: 'bg-red-400' },
    { key: 'f', label: 'Жиры', goal: goals.fat, color: 'bg-amber-400', overColor: 'bg-red-400' },
    { key: 'c', label: 'Углеводы', goal: goals.carbs, color: 'bg-emerald-500', overColor: 'bg-red-400' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      {macros.map(({ key, label, goal, color, overColor }) => {
        const val = Math.round(totals[key] * 10) / 10;
        const pct = Math.min(100, (val / goal) * 100);
        const isOver = val > goal;
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <span className={`text-sm tabular-nums ${isOver ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                {val} <span className="text-slate-400">/ {goal} г</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isOver ? overColor : color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
