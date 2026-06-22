'use client';

import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Smoothly animates a numeric value from its previous state to the new target.
 * On first render returns `target` immediately (no initial animation).
 * On subsequent target changes tweens over `duration` ms.
 */
export function useTweenedValue(target: number, duration = 600): number {
  const [display, setDisplay]   = useState(target);
  const displayRef  = useRef(target);
  const targetRef   = useRef(target);
  const fromRef     = useRef(target);
  const startTsRef  = useRef<number | null>(null);
  const rafRef      = useRef<number | null>(null);

  useEffect(() => {
    if (target === targetRef.current) return;

    targetRef.current = target;
    fromRef.current   = displayRef.current;
    startTsRef.current = null;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    function frame(now: number) {
      if (startTsRef.current === null) startTsRef.current = now;
      const t   = Math.min((now - startTsRef.current) / duration, 1);
      const val = Math.round(fromRef.current + (targetRef.current - fromRef.current) * easeOutCubic(t));
      displayRef.current = val;
      setDisplay(val);
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
      else        rafRef.current = null;
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
