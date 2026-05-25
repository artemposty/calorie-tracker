'use client';

import { useEffect, useRef, useState } from 'react';
import { haptic } from '@/lib/haptics';

const THRESHOLD = 100;
const LOCK_DISTANCE = 12; // px before direction is determined

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pull, setPull]       = useState(0);   // 0..1 progress
  const [triggered, setTriggered] = useState(false);
  const startY   = useRef(0);
  const startX   = useRef(0);
  const pulling  = useRef(false);
  const locked   = useRef(false); // true = confirmed vertical, false = waiting / cancelled
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      startY.current  = e.touches[0].clientY;
      startX.current  = e.touches[0].clientX;
      pulling.current = true;
      locked.current  = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = Math.abs(e.touches[0].clientX - startX.current);

      // Determine direction once enough movement has happened
      if (!locked.current) {
        const dist = Math.sqrt(dy * dy + dx * dx);
        if (dist < LOCK_DISTANCE) return; // not enough movement yet
        if (dx > dy || dy <= 0) {         // horizontal-dominant or upward → cancel
          pulling.current = false;
          return;
        }
        locked.current = true;
      }

      if (dy <= 0) { setPull(0); return; }
      if (window.scrollY > 0) { pulling.current = false; setPull(0); return; }
      const progress = Math.min(dy / THRESHOLD, 1.4);
      setPull(progress);
      if (progress >= 1 && !triggered) {
        setTriggered(true);
        haptic('heavy');
      }
    }

    function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (pull >= 1) {
        // Short bounce animation then reload
        setPull(0.6);
        setTimeout(() => { window.location.reload(); }, 300);
      } else {
        setPull(0);
        setTriggered(false);
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove',  onTouchMove,  { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove',  onTouchMove);
      document.removeEventListener('touchend',   onTouchEnd);
    };
  }, [pull, triggered]);

  const indicatorSize = 36;
  const translate     = pull > 0 ? Math.min(pull, 1) * 56 : 0;
  const opacity       = Math.min(pull * 2, 1);
  const scale         = 0.5 + Math.min(pull, 1) * 0.5;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Indicator */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 44px) + 8px)',
          left: '50%',
          transform: `translateX(-50%) translateY(${translate - indicatorSize}px) scale(${scale})`,
          opacity,
          transition: pull === 0 ? 'all 0.35s cubic-bezier(0.4,0,0.2,1)' : 'none',
          zIndex: 100,
          width: indicatorSize, height: indicatorSize,
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {triggered ? (
          // Spinner
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            border: '2px solid var(--bg-card)', borderTopColor: 'var(--text-1)',
            animation: 'spin 0.6s linear infinite',
          }} />
        ) : (
          // Arrow
          <svg width="16" height="16" fill="none" stroke="var(--text-2)" strokeWidth="2" viewBox="0 0 24 24"
            style={{ transform: pull >= 1 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </div>

      {children}
    </div>
  );
}
