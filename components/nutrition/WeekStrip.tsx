'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return toDateStr(date);
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}

function weekDaysOf(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
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

const THRESHOLD_FRAC = 0.22; // fraction of panel width needed to commit
const BLOCKED_DAMP = 0.15;   // heavy resistance when dragging into the future
const SPRING = 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)';

interface DayCellData {
  dateStr: string;
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
  total: number;
}

function DayCell({ d, i, mounted, goalKcal, onSelectDate }: {
  d: DayCellData; i: number; mounted: boolean; goalKcal: number; onSelectDate: (date: string) => void;
}) {
  const color = d.isFuture ? 'rgba(255,255,255,0.08)' : (zoneColor(d.total, goalKcal, d.isToday) ?? 'rgba(255,255,255,0.12)');
  const heightPct = d.isFuture ? 8 : Math.max(10, Math.min(100, (d.total / goalKcal) * 100));

  return (
    <button
      disabled={d.isFuture}
      onClick={() => { if (!d.isFuture) { haptic('light'); onSelectDate(d.dateStr); } }}
      className="flex-1 flex flex-col items-center gap-1.5 rounded-2xl active:scale-95 transition-transform duration-100"
      style={{
        padding: '7px 2px 8px',
        background: d.isSelected ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${d.isSelected ? 'var(--border)' : 'transparent'}`,
        opacity: d.isFuture ? 0.35 : 1,
        cursor: d.isFuture ? 'default' : 'pointer',
      }}
    >
      <span className="text-[10px] font-bold tracking-wide" style={{ color: d.isSelected ? 'var(--text-2)' : 'var(--text-4)' }}>
        {WEEKDAYS[i]}
      </span>
      <div style={{ width: 5, height: 22, borderRadius: 3, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <div style={{
          width: '100%',
          height: mounted ? `${heightPct}%` : 0,
          borderRadius: 3,
          background: color,
          // Collapse instantly (invisible reset frame), refill with stagger
          transition: mounted ? `height 0.45s cubic-bezier(0.2,0,0,1) ${i * 40}ms` : 'none',
        }} />
      </div>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-1)', opacity: d.isToday ? 1 : 0, marginTop: -1 }} />
    </button>
  );
}

function WeekPanel({ monday, selectedDate, today, nutritionData, goalKcal, mounted, onSelectDate, width }: {
  monday: string; selectedDate: string; today: string;
  nutritionData: Record<string, FoodEntry[]>; goalKcal: number; mounted: boolean;
  onSelectDate: (date: string) => void; width: number;
}) {
  const days = weekDaysOf(monday);
  return (
    // Horizontal padding lives INSIDE each panel: the outer container is
    // measured with getBoundingClientRect(), and padding on the measured
    // element would make every panel 24px wider than the visible content box
    // (ВС overflowing the right edge).
    <div className="flex justify-between gap-1" style={{ width, flexShrink: 0, padding: '0 12px' }}>
      {days.map((dateStr, i) => {
        const cell: DayCellData = {
          dateStr,
          isToday: dateStr === today,
          isFuture: dateStr > today,
          isSelected: dateStr === selectedDate,
          total: dateStr > today ? 0 : Math.round(calcTotals(nutritionData[dateStr] ?? []).kcal),
        };
        return <DayCell key={dateStr} d={cell} i={i} mounted={mounted} goalKcal={goalKcal} onSelectDate={onSelectDate} />;
      })}
    </div>
  );
}

export function WeekStrip({ selectedDate, onSelectDate, nutritionData, goalKcal }: Props) {
  const today = getTodayDate();
  const [weekMonday, setWeekMonday] = useState(() => mondayOf(selectedDate));
  const [mounted, setMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const dx = useRef(0);
  const locked = useRef<'h' | 'v' | null>(null);
  const animating = useRef(false);

  useLayoutEffect(() => {
    function measure() { if (outerRef.current) setContainerWidth(outerRef.current.getBoundingClientRect().width); }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Re-sync visible week if selectedDate changes from outside (e.g. native date picker)
  useEffect(() => {
    const m = mondayOf(selectedDate);
    if (m !== weekMonday) setWeekMonday(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Snap the track to resting position instantly whenever the center week changes
  // (initial mount, external date jump, or right after a swipe commits).
  useEffect(() => {
    if (!trackRef.current || !containerWidth) return;
    trackRef.current.style.transition = 'none';
    trackRef.current.style.transform = `translateX(-${containerWidth}px)`;
    void trackRef.current.offsetHeight; // force reflow so 'none' takes effect first
  }, [weekMonday, containerWidth]);

  // Staggered bar-fill plays once, on screen open only.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const isCurrentWeek = weekMonday === mondayOf(today);
  const prevMonday = addDays(weekMonday, -7);
  const nextMonday = addDays(weekMonday, 7);

  function onTouchStart(e: React.TouchEvent) {
    if (animating.current || !containerWidth) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dx.current = 0;
    locked.current = null;
    if (trackRef.current) trackRef.current.style.transition = 'none';
  }

  function onTouchMove(e: React.TouchEvent) {
    if (animating.current || !containerWidth) return;
    const rawDx = e.touches[0].clientX - startX.current;
    const rawDy = e.touches[0].clientY - startY.current;
    if (locked.current === null) {
      if (Math.abs(rawDx) < 8 && Math.abs(rawDy) < 8) return;
      locked.current = Math.abs(rawDx) > Math.abs(rawDy) ? 'h' : 'v';
    }
    if (locked.current !== 'h') return;
    // No preventDefault here: React root touch listeners are passive, so the
    // call would be a no-op console error. touchAction: 'pan-y' on the
    // container already stops the browser from hijacking horizontal drags.

    const wantsFuture = rawDx < 0;
    const blocked = isCurrentWeek && wantsFuture;
    const damped = blocked ? rawDx * BLOCKED_DAMP : rawDx;
    const clamped = Math.max(-containerWidth, Math.min(containerWidth, damped));
    dx.current = clamped;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${-containerWidth + clamped}px)`;
  }

  function onTouchEnd() {
    if (animating.current || locked.current !== 'h' || !containerWidth) { locked.current = null; return; }
    const wantsFuture = dx.current < 0;
    const blocked = isCurrentWeek && wantsFuture;
    const committed = !blocked && Math.abs(dx.current) > containerWidth * THRESHOLD_FRAC;

    const track = trackRef.current;
    if (committed && track) {
      haptic('light');
      animating.current = true;
      const dir = dx.current < 0 ? 1 : -1; // +1 = next week, -1 = prev week
      const target = dir > 0 ? -2 * containerWidth : 0;
      track.style.transition = SPRING;
      track.style.transform = `translateX(${target}px)`;
      setTimeout(() => {
        const newMonday = addDays(weekMonday, dir * 7);
        setWeekMonday(newMonday);
        onSelectDate(dir > 0 ? newMonday : addDays(newMonday, 6));
        animating.current = false;
      }, 430);
    } else if (track) {
      track.style.transition = SPRING;
      track.style.transform = `translateX(${-containerWidth}px)`;
    }
    dx.current = 0; locked.current = null;
  }

  return (
    <div
      ref={outerRef}
      className="pb-1"
      style={{ overflow: 'hidden', touchAction: 'pan-y' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <div ref={trackRef} style={{ display: 'flex', width: containerWidth * 3, transform: `translateX(-${containerWidth}px)` }}>
        {containerWidth > 0 && [prevMonday, weekMonday, nextMonday].map(monday => (
          <WeekPanel
            key={monday}
            monday={monday}
            selectedDate={selectedDate}
            today={today}
            nutritionData={nutritionData}
            goalKcal={goalKcal}
            mounted={mounted}
            onSelectDate={d => { if (!animating.current) onSelectDate(d); }}
            width={containerWidth}
          />
        ))}
      </div>
    </div>
  );
}
