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
      className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
    >
      {/* overflow:hidden removed — it breaks backdrop-filter in Safari */}
      <div
        className="flex items-stretch mx-4 w-full max-w-sm pointer-events-auto"
        style={{
          borderRadius: '26px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(248,250,252,0.68) 100%)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.75)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
        }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-all duration-150 active:scale-95 ${
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
