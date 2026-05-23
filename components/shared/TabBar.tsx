'use client';

import { Utensils, Scale, BarChart2 } from 'lucide-react';

export type Tab = 'nutrition' | 'weight' | 'stats';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; Icon: typeof Utensils }[] = [
  { id: 'nutrition', label: 'Питание', Icon: Utensils },
  { id: 'weight', label: 'Вес', Icon: Scale },
  { id: 'stats', label: 'Статистика', Icon: BarChart2 },
];

export function TabBar({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto flex h-16">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 duration-100 ${
              active === id ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            <Icon size={22} strokeWidth={active === id ? 2 : 1.5} />
            <span className={`text-xs ${active === id ? 'font-semibold' : 'font-normal'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
