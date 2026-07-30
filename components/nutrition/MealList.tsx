'use client';

import { useEffect, useRef, useState } from 'react';
import { FoodEntry } from '@/lib/types';
import { calcFromPer100 } from '@/lib/storage';
import { groupMeals, MealGroupName } from '@/lib/mealGroups';
import { haptic } from '@/lib/haptics';

const GROUP_ICON: Record<MealGroupName, React.ReactNode> = {
  'Завтрак': (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <line x1="8" y1="1.5" x2="8" y2="2.8" /><line x1="8" y1="13.2" x2="8" y2="14.5" />
      <line x1="1.5" y1="8" x2="2.8" y2="8" /><line x1="13.2" y1="8" x2="14.5" y2="8" />
      <line x1="3.4" y1="3.4" x2="4.3" y2="4.3" /><line x1="11.7" y1="11.7" x2="12.6" y2="12.6" />
      <line x1="3.4" y1="12.6" x2="4.3" y2="11.7" /><line x1="11.7" y1="4.3" x2="12.6" y2="3.4" />
    </svg>
  ),
  'Обед': (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="1.5" x2="4" y2="14.5" /><line x1="2.2" y1="1.5" x2="2.2" y2="6" />
      <line x1="5.8" y1="1.5" x2="5.8" y2="6" /><path d="M2.2 6 Q4 8 5.8 6" />
      <line x1="12" y1="1.5" x2="12" y2="14.5" /><path d="M10.3 1.5 L10.3 6.2 Q10.3 8 12 8 Q13.7 8 13.7 6.2 L13.7 1.5" />
    </svg>
  ),
  'Перекус': (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <polygon points="9,1 3.5,9 7.5,9 6,15 12.5,7 8.5,7" />
    </svg>
  ),
  'Ужин': (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 8.5A6 6 0 1 1 7.2 2.2 5 5 0 0 0 13 8.5Z" />
    </svg>
  ),
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface SwipeRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
}

function SwipeRow({ children, onDelete, onEdit }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const [awaitConfirm, setAwaitConfirm] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const direction = useRef<'h' | 'v' | null>(null);
  const editFired = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // The native listener below is attached once; keep the latest callback reachable.
  const onEditRef = useRef(onEdit);
  useEffect(() => { onEditRef.current = onEdit; });

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    function onMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (!direction.current) {
        if (Math.abs(dx) > Math.abs(dy) + 6) direction.current = 'h';
        else if (Math.abs(dy) > 6) direction.current = 'v';
        return;
      }
      if (direction.current === 'h') {
        e.preventDefault();
        if (editFired.current) return;
        setOffset(Math.max(-80, Math.min(80, dx)));
        // Edit opens the moment the threshold is crossed, mid-drag —
        // no waiting for release (native iOS list behavior). Delete stays
        // release-then-confirm because it's destructive.
        if (dx >= 65) {
          editFired.current = true;
          haptic('light');
          setSnapping(true);
          setOffset(0);
          onEditRef.current();
        }
      }
    }

    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    if (awaitConfirm) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    direction.current = null;
    editFired.current = false;
    setSnapping(false);
  }

  function onTouchEnd() {
    if (editFired.current) { direction.current = null; return; }
    setSnapping(true);
    if (offset <= -65) {
      haptic('medium');
      setOffset(-80);
      setAwaitConfirm(true);
    } else {
      if (Math.abs(offset) > 8) haptic('light');
      setOffset(0);
      setAwaitConfirm(false);
    }
  }

  function handleDelete() {
    haptic('heavy');
    setSnapping(true);
    setOffset(0);
    setAwaitConfirm(false);
    onDelete();
  }

  function handleCancel() {
    setSnapping(true);
    setOffset(0);
    setAwaitConfirm(false);
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Edit reveal — left side */}
      <div
        className="absolute inset-y-0 left-0 flex items-center justify-center"
        style={{ width: 80, background: 'var(--carbs)' }}
      >
        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
      {/* Delete reveal — right side */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{ width: 80, background: 'var(--danger)' }}
      >
        {awaitConfirm ? (
          <div className="flex flex-col w-full items-center gap-1 px-2">
            <button onClick={handleDelete} className="w-full text-xs font-bold text-white py-1 active:opacity-70">
              Удалить
            </button>
            <button onClick={handleCancel} className="w-full text-[10px] active:opacity-70" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Отмена
            </button>
          </div>
        ) : (
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        )}
      </div>
      <div
        ref={rowRef}
        style={{
          transform: `translateX(${offset}px)`,
          transition: snapping ? 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          background: 'var(--bg-card)',
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

interface EntryRowProps {
  entry: FoodEntry;
  editing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onSave: (grams: number) => void;
}

function EntryRow({ entry, editing, onToggleEdit, onDelete, onSave }: EntryRowProps) {
  const [grams, setGrams] = useState(entry.grams);
  useEffect(() => { if (editing) setGrams(entry.grams); }, [editing, entry.grams]);

  const kcalPer100 = entry.grams > 0 ? entry.kcal / entry.grams * 100 : 0;
  const editKcal = Math.round(kcalPer100 * grams / 100);

  return (
    <div>
      <SwipeRow onDelete={onDelete} onEdit={onToggleEdit}>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>
              {entry.name}
            </p>
            <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--text-3)' }}>
              <span style={{ color: 'var(--text-4)' }}>{formatTime(entry.time)}</span> · {entry.grams} г · Б {Math.round(entry.p * 10) / 10} · Ж {Math.round(entry.f * 10) / 10} · У {Math.round(entry.c * 10) / 10}
            </p>
          </div>
          <p className="text-sm font-bold tabular-nums shrink-0" style={{ color: 'var(--text-2)' }}>
            {Math.round(entry.kcal)} ккал
          </p>
        </div>
      </SwipeRow>

      {editing && (
        <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-sub)' }}>
          <button onClick={() => setGrams(g => Math.max(10, g - 10))}
            className="w-8 h-8 rounded-lg text-base font-semibold active:scale-90 transition-transform"
            style={{ background: 'var(--bg-card)', color: 'var(--text-1)' }}>–</button>
          <span className="text-sm font-bold tabular-nums flex-1 text-center" style={{ color: 'var(--text-1)' }}>
            {grams} г · {editKcal} ккал
          </span>
          <button onClick={() => setGrams(g => g + 10)}
            className="w-8 h-8 rounded-lg text-base font-semibold active:scale-90 transition-transform"
            style={{ background: 'var(--bg-card)', color: 'var(--text-1)' }}>+</button>
          <button
            onClick={() => { haptic('success'); onSave(grams); }}
            className="px-3.5 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform"
            style={{ background: '#ffffff', color: '#0a0a0b' }}
          >
            Сохранить
          </button>
        </div>
      )}
    </div>
  );
}

interface Props {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: { grams: number; kcal: number; p: number; f: number; c: number }) => void;
}

export function MealList({ entries, onDelete, onEdit }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-20 mx-4"
        style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Нет записей за этот день</p>
      </div>
    );
  }

  const groups = groupMeals(entries);

  function handleSave(entry: FoodEntry, grams: number) {
    const kcalPer100 = entry.grams > 0 ? entry.kcal / entry.grams * 100 : 0;
    const pPer100    = entry.grams > 0 ? entry.p / entry.grams * 100    : 0;
    const fPer100    = entry.grams > 0 ? entry.f / entry.grams * 100    : 0;
    const cPer100    = entry.grams > 0 ? entry.c / entry.grams * 100    : 0;
    onEdit(entry.id, {
      grams,
      kcal: Math.round(kcalPer100 * grams / 100),
      p: calcFromPer100(pPer100, grams),
      f: calcFromPer100(fPer100, grams),
      c: calcFromPer100(cPer100, grams),
    });
    setEditingId(null);
  }

  return (
    <div className="px-4 flex flex-col gap-4">
      {groups.map((group, gi) => (
        <div key={gi}>
          <div className="flex items-center gap-2 mb-2 px-0.5">
            <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0" style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)' }}>
              {GROUP_ICON[group.name]}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest flex-1" style={{ color: 'var(--text-4)' }}>
              {group.name}
            </p>
            <p className="text-[11.5px] tabular-nums" style={{ color: 'var(--text-3)' }}>{group.totalKcal} ккал</p>
          </div>
          <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {group.entries.map((entry, i) => (
              <div key={entry.id}>
                <EntryRow
                  entry={entry}
                  editing={editingId === entry.id}
                  onToggleEdit={() => { haptic('light'); setEditingId(prev => prev === entry.id ? null : entry.id); }}
                  onDelete={() => onDelete(entry.id)}
                  onSave={grams => handleSave(entry, grams)}
                />
                {i < group.entries.length - 1 && (
                  <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
