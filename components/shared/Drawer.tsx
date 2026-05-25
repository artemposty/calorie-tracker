'use client';

import { useEffect, useRef } from 'react';
import { haptic } from '@/lib/haptics';

export type Module = 'nutrition' | 'workout' | 'weight' | 'settings';

interface DrawerItem {
  id: Module;
  label: string;
  icon: React.ReactNode;
}

const ITEMS: DrawerItem[] = [
  {
    id: 'nutrition',
    label: 'Питание',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 11l19-9-9 19-2-8-8-2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'workout',
    label: 'Тренировки',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M6.5 6.5h11M6.5 17.5h11M3 12h2m14 0h2" strokeLinecap="round" />
        <path d="M5 9.5l-2 2.5 2 2.5M19 9.5l2 2.5-2 2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'weight',
    label: 'Вес',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="20" strokeLinecap="round" />
        <line x1="8" y1="20" x2="16" y2="20" strokeLinecap="round" />
        <line x1="3" y1="8" x2="21" y2="8" strokeLinecap="round" />
        <path d="M3 8 L5 14 Q6 16 7 14 L9 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 8 L17 14 Q18 16 19 14 L21 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

interface Props {
  open: boolean;
  active: Module;
  onSelect: (m: Module) => void;
  onClose: () => void;
}

export function Drawer({ open, active, onSelect, onClose }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);
  // Swipe-to-close
  const startX = useRef(0);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -60) onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={drawerRef}
        className="fixed top-0 left-0 bottom-0 z-50 flex flex-col"
        style={{
          width: '80%',
          maxWidth: 320,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          paddingTop: 'env(safe-area-inset-top, 44px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
          willChange: 'transform',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* App title */}
        <div className="px-6 py-5">
          <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Трекер</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3">
          {ITEMS.map(item => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { haptic('light'); onSelect(item.id); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 relative"
                style={{
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-2 bottom-2 rounded-r-full"
                    style={{ width: 3, background: 'var(--text-1)' }}
                  />
                )}
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Separator + Settings */}
        <div className="px-3">
          <div className="mx-3 mb-2" style={{ height: 1, background: 'var(--border)' }} />
          <button
            onClick={() => { haptic('light'); onSelect('settings'); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl relative"
            style={{
              background: active === 'settings' ? 'var(--bg-elevated)' : 'transparent',
              color: active === 'settings' ? 'var(--text-1)' : 'var(--text-3)',
            }}
          >
            {active === 'settings' && (
              <div className="absolute left-0 top-2 bottom-2 rounded-r-full" style={{ width: 3, background: 'var(--text-1)' }} />
            )}
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-sm font-medium">Настройки</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ── Swipe-to-open edge detector ───────────────────────────────────────────
// Mount once in the app root; calls onOpen when user swipes right from left edge
export function SwipeEdgeDetector({ onOpen }: { onOpen: () => void }) {
  const startX = useRef<number | null>(null);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (e.touches[0].clientX < 24) startX.current = e.touches[0].clientX;
      else startX.current = null;
    }
    function onTouchEnd(e: TouchEvent) {
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      if (dx > 60) onOpen();
      startX.current = null;
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onOpen]);

  return null;
}
