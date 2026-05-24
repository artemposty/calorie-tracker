'use client';

import { haptic } from '@/lib/haptics';

export type Tab = 'nutrition' | 'weight' | 'workout' | 'stats' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'nutrition',
    label: 'Питание',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 20.5C8.5 20.5 5.5 17.5 5.5 14c0-3 1.5-5.5 4-7" strokeLinecap="round" />
        <path d="M12 20.5C15.5 20.5 18.5 17.5 18.5 14c0-3-1.5-5.5-4-7" strokeLinecap="round" />
        <path d="M12 7C12 7 10 5 10 3.5C10 2.7 10.7 2 12 2s2 .7 2 1.5C14 5 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="7" x2="12" y2="20.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'weight',
    label: 'Вес',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="20" strokeLinecap="round" />
        <line x1="8" y1="20" x2="16" y2="20" strokeLinecap="round" />
        <line x1="3" y1="8" x2="21" y2="8" strokeLinecap="round" />
        <path d="M3 8 L5 14 Q6 16 7 14 L9 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 8 L17 14 Q18 16 19 14 L21 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'workout',
    label: 'Тренировка',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M6.5 6.5h11M6.5 17.5h11M3 12h2m14 0h2" strokeLinecap="round" />
        <path d="M5 9.5l-2 2.5 2 2.5M19 9.5l2 2.5-2 2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Статистика',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Настройки',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function TabBar({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex justify-around items-end"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        background: 'rgba(10,10,11,0.94)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {TABS.map(({ id, label, icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => { haptic('light'); onChange(id); }}
            className="flex flex-col items-center gap-0.5 py-2 px-2 flex-1 active:scale-90 transition-transform duration-100"
          >
            <span style={{ color: isActive ? '#ffffff' : '#3f3f46', transition: 'color 0.15s' }}>
              {icon}
            </span>
            {isActive && (
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ color: '#ffffff' }}
              >
                {label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
