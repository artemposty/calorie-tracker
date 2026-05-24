'use client';

import { haptic } from '@/lib/haptics';
import { getTodayDate, shiftDate } from '@/lib/storage';

interface Props {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  onDateChange: (date: string) => void;
}

function formatDate(dateStr: string): { weekday: string; date: string } {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date(getTodayDate() + 'T12:00:00');
  const yesterday = new Date(shiftDate(getTodayDate(), -1) + 'T12:00:00');

  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const dateStr2 = `${d.getDate()} ${months[d.getMonth()]}`;

  let weekday: string;
  if (d.toDateString() === today.toDateString()) weekday = 'Сегодня';
  else if (d.toDateString() === yesterday.toDateString()) weekday = 'Вчера';
  else {
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    weekday = days[d.getDay()].charAt(0).toUpperCase() + days[d.getDay()].slice(1);
  }

  return { weekday, date: dateStr2 };
}

export function DayHeader({ date, onPrev, onNext, onDateChange }: Props) {
  const isToday = date === getTodayDate();
  const { weekday, date: dateLabel } = formatDate(date);

  return (
    <div
      className="flex items-center justify-between px-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 44px) + 12px)',
        paddingBottom: 12,
      }}
    >
      {/* Prev */}
      <button
        onClick={() => { haptic('light'); onPrev(); }}
        className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-100"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <svg width="16" height="16" fill="none" stroke="var(--text-2)" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Date center — native date input overlaid for reliable picker on iOS */}
      <div className="relative flex flex-col items-center gap-0.5 px-4">
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{weekday}</span>
          <svg width="14" height="14" fill="none" stroke="var(--text-3)" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <span className="text-xs pointer-events-none" style={{ color: 'var(--text-3)' }}>{dateLabel}</span>
        <input
          type="date"
          value={date}
          max={getTodayDate()}
          onChange={e => { if (e.target.value) { haptic('light'); onDateChange(e.target.value); } }}
          style={{
            position: 'absolute', inset: 0, opacity: 0,
            cursor: 'pointer', width: '100%', height: '100%',
          }}
        />
      </div>

      {/* Next */}
      <button
        onClick={() => { if (!isToday) { haptic('light'); onNext(); } }}
        disabled={isToday}
        className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-100"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          opacity: isToday ? 0.25 : 1,
        }}
      >
        <svg width="16" height="16" fill="none" stroke="var(--text-2)" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
