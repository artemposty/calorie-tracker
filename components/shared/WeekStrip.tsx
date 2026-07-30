'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getTodayDate } from '@/lib/storage';
import { haptic } from '@/lib/haptics';

// Generic swipeable week carousel: 3 panels ([prev][current][next]) that
// track the finger 1:1, spring-commit past a threshold, and heavily damp
// drags into the future. What each day's bar shows is up to the caller
// via getDay — nutrition colors by goal zones, workout by tonnage.

export interface DayBar {
  /** 0..1+ fill fraction of the bar (clamped to 10–100% visually). */
  frac: number;
  /** Bar color; null renders the dim "no data" stub. */
  color: string | null;
}

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** Called for today + past days only; future days always render disabled stubs. */
  getDay: (dateStr: string) => DayBar;
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

const THRESHOLD_FRAC = 0.22;
const BLOCKED_DAMP = 0.15;
const SPRING = 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)';

function DayCell({ dateStr, i, isToday, isFuture, isSelected, bar, mounted, onSelectDate }: {
  dateStr: string; i: number; isToday: boolean; isFuture: boolean; isSelected: boolean;
  bar: DayBar | null; mounted: boolean; onSelectDate: (date: string) => void;
}) {
  const color = isFuture ? 'rgba(255,255,255,0.08)' : (bar?.color ?? 'rgba(255,255,255,0.12)');
  const heightPct = isFuture ? 8 : Math.max(10, Math.min(100, (bar?.frac ?? 0) * 100));

  return (
    <button
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
          transition: mounted ? `height 0.45s cubic-bezier(0.2,0,0,1) ${i * 40}ms` : 'none',
        }} />
      </div>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-1)', opacity: isToday ? 1 : 0, marginTop: -1 }} />
    </button>
  );
}

function WeekPanel({ monday, selectedDate, today, getDay, mounted, onSelectDate, width }: {
  monday: string; selectedDate: string; today: string;
  getDay: (dateStr: string) => DayBar; mounted: boolean;
  onSelectDate: (date: string) => void; width: number;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return (
    // Horizontal padding lives INSIDE each panel: the outer container is
    // measured with getBoundingClientRect(), and padding on the measured
    // element would make every panel 24px wider than the visible content box.
    <div className="flex justify-between gap-1" style={{ width, flexShrink: 0, padding: '0 12px' }}>
      {days.map((dateStr, i) => {
        const isFuture = dateStr > today;
        return (
          <DayCell
            key={dateStr}
            dateStr={dateStr}
            i={i}
            isToday={dateStr === today}
            isFuture={isFuture}
            isSelected={dateStr === selectedDate}
            bar={isFuture ? null : getDay(dateStr)}
            mounted={mounted}
            onSelectDate={onSelectDate}
          />
        );
      })}
    </div>
  );
}

export function WeekStrip({ selectedDate, onSelectDate, getDay }: Props) {
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

  // Snap the track to resting position instantly whenever the center week changes.
  useEffect(() => {
    if (!trackRef.current || !containerWidth) return;
    trackRef.current.style.transition = 'none';
    trackRef.current.style.transform = `translateX(-${containerWidth}px)`;
    void trackRef.current.offsetHeight;
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
      const dir = dx.current < 0 ? 1 : -1;
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
            getDay={getDay}
            mounted={mounted}
            onSelectDate={d => { if (!animating.current) onSelectDate(d); }}
            width={containerWidth}
          />
        ))}
      </div>
    </div>
  );
}
