'use client';

import { useEffect, useRef, useState } from 'react';
import { FoodEntry } from '@/lib/types';
import { getTodayDate, calcTotals } from '@/lib/storage';
import { haptic } from '@/lib/haptics';

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  nutritionData: Record<string, FoodEntry[]>;
  goalKcal: number;
}

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0=Sun..6=Sat
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return toDateStr(date);
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function lerpColor(c1: string, c2: string, t: number): string {
  t = Math.max(0, Math.min(1, t));
  const p1 = hexToRgb(c1), p2 = hexToRgb(c2);
  return `rgb(${Math.round(p1.r + (p2.r - p1.r) * t)},${Math.round(p1.g + (p2.g - p1.g) * t)},${Math.round(p1.b + (p2.b - p1.b) * t)})`;
}
function zoneColor(totalKcal: number, goalKcal: number, isToday: boolean): string | null {
  if (isToday) return '#f4f4f5';
  if (totalKcal <= 0) return null;
  const diff = Math.abs(totalKcal - goalKcal);
  if (diff <= 150) return '#30d158';
  const t = (diff - 150) / (600 - 150);
  return lerpColor('#ff9f0a', '#ff453a', t);
}

const MAX_DRAG = 90;
const THRESHOLD = 55;
const DAMP = 0.35;
const SPRING = 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)';

export function WeekStrip({ selectedDate, onSelectDate, nutritionData, goalKcal }: Props) {
  const today = getTodayDate();
  const [weekMonday, setWeekMonday] = useState(() => mondayOf(selectedDate));
  const [mounted, setMounted] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const dx = useRef(0);
  const locked = useRef<'h' | 'v' | null>(null);
  const didDrag = useRef(false);
  const animating = useRef(false);

  // Re-sync visible week if selectedDate changes from outside this component
  // (e.g. jumping far away via the header's native date picker)
  useEffect(() => {
    const m = mondayOf(selectedDate);
    if (m !== weekMonday) setWeekMonday(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i));
  const isCurrentWeek = weekMonday === mondayOf(today);

  function totalFor(dateStr: string): number {
    return Math.round(calcTotals(nutritionData[dateStr] ?? []).kcal);
  }

  function commitWeek(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    animating.current = true;
    const flyOut = dir > 0 ? -140 : 140;
    track.style.transition = 'transform 200ms ease-in, opacity 200ms ease-in';
    track.style.transform = `translateX(${flyOut}px)`;
    track.style.opacity = '0';
    setTimeout(() => {
      const newMonday = addDays(weekMonday, dir * 7);
      setWeekMonday(newMonday);
      onSelectDate(dir > 0 ? newMonday : addDays(newMonday, 6));
      track.style.transition = 'none';
      track.style.transform = `translateX(${-flyOut}px)`;
      track.style.opacity = '0';
      requestAnimationFrame(() => {
        track.style.transition = `${SPRING}, opacity 260ms ease-out`;
        track.style.transform = 'translateX(0px)';
        track.style.opacity = '1';
        setTimeout(() => { animating.current = false; }, 440);
      });
    }, 200);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (animating.current) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dx.current = 0;
    locked.current = null;
    didDrag.current = false;
    if (trackRef.current) trackRef.current.style.transition = 'none';
  }

  function onTouchMove(e: React.TouchEvent) {
    if (animating.current) return;
    const rawDx = e.touches[0].clientX - startX.current;
    const rawDy = e.touches[0].clientY - startY.current;
    if (locked.current === null) {
      if (Math.abs(rawDx) < 8 && Math.abs(rawDy) < 8) return;
      locked.current = Math.abs(rawDx) > Math.abs(rawDy) ? 'h' : 'v';
      if (locked.current === 'h') didDrag.current = true;
    }
    if (locked.current !== 'h') return;
    dx.current = rawDx;
    const blockedForward = isCurrentWeek && rawDx < 0;
    const damped = Math.abs(rawDx) > MAX_DRAG
      ? Math.sign(rawDx) * (MAX_DRAG + (Math.abs(rawDx) - MAX_DRAG) * DAMP)
      : rawDx;
    const finalDx = blockedForward ? damped * 0.4 : damped;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${finalDx}px)`;
  }

  function onTouchEnd() {
    if (animating.current || locked.current !== 'h') { locked.current = null; return; }
    const wantsForward = dx.current < 0;
    const committed = Math.abs(dx.current) > THRESHOLD && !(isCurrentWeek && wantsForward);

    if (committed) {
      haptic('light');
      commitWeek(dx.current < 0 ? 1 : -1);
    } else if (trackRef.current) {
      trackRef.current.style.transition = SPRING;
      trackRef.current.style.transform = 'translateX(0px)';
    }
    dx.current = 0; locked.current = null;
  }

  return (
    <div className="px-3 pb-1" style={{ overflow: 'hidden', touchAction: 'pan-y' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div ref={trackRef} className="flex justify-between gap-1">
        {days.map((dateStr, i) => {
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          const isSelected = dateStr === selectedDate;
          const total = isFuture ? 0 : totalFor(dateStr);
          const color = isFuture ? 'rgba(255,255,255,0.08)' : (zoneColor(total, goalKcal, isToday) ?? 'rgba(255,255,255,0.12)');
          const heightPct = isFuture ? 8 : Math.max(10, Math.min(100, (total / goalKcal) * 100));

          return (
            <button
              key={dateStr}
              disabled={isFuture}
              onClick={() => { if (!isFuture) { haptic('light'); onSelectDate(dateStr); } }}
              className="flex-1 flex flex-col items-center gap-1.5 rounded-2xl active:scale-95 transition-transform duration-100"
              style={{
                padding: '7px 2px 8px',
                background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${isSelected ? 'var(--border)' : 'transparent'}`,
                opacity: isFuture ? 0.35 : 1,
                cursor: isFuture ? 'default' : 'pointer',
              }}
            >
              <span className="text-[10px] font-bold tracking-wide" style={{ color: isSelected ? 'var(--text-2)' : 'var(--text-4)' }}>
                {WEEKDAYS[i]}
              </span>
              <div style={{ width: 5, height: 22, borderRadius: 3, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                <div style={{
                  width: '100%',
                  height: mounted ? `${heightPct}%` : 0,
                  borderRadius: 3,
                  background: color,
                  transition: `height 0.45s cubic-bezier(0.2,0,0,1) ${i * 40}ms`,
                }} />
              </div>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-1)', opacity: isToday ? 1 : 0, marginTop: -1 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
