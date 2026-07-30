'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FoodEntry } from '@/lib/types';
import { calcFromPer100 } from '@/lib/storage';
import { getRecentFoods } from '@/lib/recentFoods';
import { haptic } from '@/lib/haptics';
import { useUserFoods } from '@/hooks/useUserFoods';
import { fetchProductByBarcode } from '@/lib/openFoodFacts';
import { BarcodeScanner } from './BarcodeScanner';

type View = 'default' | 'scan' | 'custom';
type ScanState = 'scanning' | 'looking-up' | 'found' | 'not-found';

interface Props {
  nutritionData: Record<string, FoodEntry[]>;
  onAdd: (entry: Omit<FoodEntry, 'id' | 'time'>) => string;
  onDelete: (id: string) => void;
  onClose: () => void;
}

interface QuickAddItem {
  key: string;
  name: string;
  kcalPer100: number;
  pPer100: number;
  fPer100: number;
  cPer100: number;
  grams: number;
  onDelete?: () => void;
}

function num(v: string) { return parseFloat(v) || 0; }
function macrosToKcal(p: string, f: string, c: string) {
  return Math.round(num(p) * 4 + num(f) * 9 + num(c) * 4);
}

const INPUT =
  'w-full px-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 tabular-nums';
const INPUT_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-1)',
};

function DarkInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={INPUT} style={INPUT_STYLE} />;
}

function PreviewRow({ kcal, p, f, c }: { kcal: number; p: number; f: number; c: number }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center rounded-xl p-3"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      {[{ label: 'ккал', value: kcal, color: 'var(--kcal)' },
        { label: 'Б', value: p,    color: 'var(--protein)' },
        { label: 'Ж', value: f,    color: 'var(--fat)'     },
        { label: 'У', value: c,    color: 'var(--carbs)'   }].map(({ label, value, color }) => (
        <div key={label}>
          <p className="text-base font-bold tabular-nums" style={{ color }}>{value}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => { haptic('medium'); onClick(); }}
      disabled={disabled}
      className="w-full py-3.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform duration-100"
      style={{
        background: disabled ? 'var(--bg-elevated)' : '#ffffff',
        color: disabled ? 'var(--text-4)' : '#0a0a0b',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

/** One row shared by "Недавние" and "База" — tap = instant add at its default
 *  portion, pencil = inline stepper to adjust grams before confirming. */
function QuickAddRow({ item, onAdd }: { item: QuickAddItem; onAdd: (grams: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [grams, setGrams] = useState(item.grams);

  const displayKcal = Math.round(item.kcalPer100 * item.grams / 100);
  const editKcal = Math.round(item.kcalPer100 * grams / 100);

  return (
    <div
      className="rounded-2xl active:scale-[0.985] transition-transform duration-100"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '10px 12px', cursor: editing ? 'default' : 'pointer' }}
      onClick={() => { if (!editing) { onAdd(item.grams); } }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>{item.name}</p>
          <p className="text-[11.5px] tabular-nums mt-0.5" style={{ color: 'var(--text-3)' }}>{item.grams} г</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-2)' }}>{displayKcal}</p>
          <p className="text-[9px] font-medium" style={{ color: 'var(--text-4)' }}>ккал</p>
        </div>
        {item.onDelete && (
          <button
            onClick={e => { e.stopPropagation(); haptic('medium'); item.onDelete!(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-4)' }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); haptic('light'); setGrams(item.grams); setEditing(v => !v); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)' }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {editing && (
        <div
          className="flex items-center justify-between gap-2 mt-2.5 pt-2.5"
          style={{ borderTop: '1px solid var(--border-sub)' }}
          onClick={e => e.stopPropagation()}
        >
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
            onClick={() => { onAdd(grams); setEditing(false); }}
            className="px-3.5 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform"
            style={{ background: '#ffffff', color: '#0a0a0b' }}
          >
            Добавить
          </button>
        </div>
      )}
    </div>
  );
}

export function AddMealModal({ nutritionData, onAdd, onDelete, onClose }: Props) {
  const { foods, addFood, deleteFood, findByBarcode } = useUserFoods();
  const [view, setView] = useState<View>('default');
  const [search, setSearch] = useState('');
  const [now] = useState(() => new Date());

  // ── Toast (undo) — portaled above everything, including the full-screen scanner ──
  const [toast, setToast] = useState<{ id: string; label: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitAdd = useCallback((entry: Omit<FoodEntry, 'id' | 'time'>) => {
    const id = onAdd(entry);
    haptic('success');
    setToast({ id, label: `${entry.name} · ${entry.grams} г · ${entry.kcal} ккал` });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3800);
  }, [onAdd]);

  function undoToast() {
    if (!toast) return;
    onDelete(toast.id);
    setToast(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    haptic('light');
  }

  // ── Недавние (ranked, whole history pool so search can find deep matches) ──
  const allRecent = useMemo(() => getRecentFoods(nutritionData, now, 50), [nutritionData, now]);
  const query = search.trim().toLowerCase();
  const recentToShow = query
    ? allRecent.filter(r => r.name.toLowerCase().includes(query))
    : allRecent.slice(0, 6);

  const dbToShow = useMemo(
    () => query ? foods.filter(f => f.name.toLowerCase().includes(query)) : foods,
    [foods, query]
  );

  function handleQuickAdd(item: { name: string; kcalPer100: number; pPer100: number; fPer100: number; cPer100: number }, grams: number) {
    commitAdd({
      name: item.name, grams,
      kcal: Math.round(item.kcalPer100 * grams / 100),
      p: calcFromPer100(item.pPer100, grams),
      f: calcFromPer100(item.fPer100, grams),
      c: calcFromPer100(item.cPer100, grams),
    });
  }

  // ── Custom entry ─────────────────────────────────────────────────────
  const [cName, setCName] = useState('');
  const [cP, setCP] = useState('');
  const [cF, setCF] = useState('');
  const [cC, setCC] = useState('');
  const [cGrams, setCGrams] = useState('100');
  const [cSaveToDb, setCSaveToDb] = useState(false);

  const cGramsNum    = num(cGrams);
  const kcalPer100   = macrosToKcal(cP, cF, cC);
  const customPreview = cGramsNum > 0 && kcalPer100 > 0 ? {
    kcal: Math.round(kcalPer100 * cGramsNum / 100),
    p: calcFromPer100(num(cP), cGramsNum),
    f: calcFromPer100(num(cF), cGramsNum),
    c: calcFromPer100(num(cC), cGramsNum),
  } : null;

  function handleAddCustom() {
    if (!cName.trim() || cGramsNum <= 0) return;
    commitAdd({
      name: cName.trim(), grams: cGramsNum,
      kcal: Math.round(kcalPer100 * cGramsNum / 100),
      p: calcFromPer100(num(cP), cGramsNum),
      f: calcFromPer100(num(cF), cGramsNum),
      c: calcFromPer100(num(cC), cGramsNum),
    });
    if (cSaveToDb) {
      addFood({ name: cName.trim(), kcal: kcalPer100, p: num(cP), f: num(cF), c: num(cC), defaultGrams: cGramsNum });
    }
    setCName(''); setCP(''); setCF(''); setCC(''); setCGrams('100'); setCSaveToDb(false);
  }

  // ── Scan ─────────────────────────────────────────────────────────────
  // cameraStarted stays true across the whole modal session so the underlying
  // MediaStream is never released and re-requested — avoids repeat permission
  // prompts. The scanner is paused (hidden, decode ignored) whenever we're not
  // actively on the scan view, without tearing the stream down.
  const [cameraStarted, setCameraStarted] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [scanSource, setScanSource] = useState<'cache' | 'off' | null>(null);
  const [sName, setSName] = useState('');
  const [sP, setSP] = useState('');
  const [sF, setSF] = useState('');
  const [sC, setSC] = useState('');
  const [sGrams, setSGrams] = useState('100');

  function openScan() {
    setView('scan');
    setCameraStarted(true);
    setScanState('scanning');
  }

  const handleDetected = useCallback(async (barcode: string) => {
    setScanState('looking-up');
    setScannedBarcode(barcode);

    const cached = findByBarcode(barcode);
    if (cached) {
      setSName(cached.name);
      setSP(String(cached.p)); setSF(String(cached.f)); setSC(String(cached.c));
      setSGrams(String(cached.defaultGrams ?? 100));
      setScanSource('cache');
      setScanState('found');
      return;
    }

    const product = await fetchProductByBarcode(barcode);
    if (product) {
      setSName(product.name);
      setSP(String(product.p)); setSF(String(product.f)); setSC(String(product.c));
      setSGrams(product.grams ? String(product.grams) : '100');
      setScanSource('off');
      setScanState('found');
    } else {
      setScanState('not-found');
    }
  }, [findByBarcode]);

  /** Rescan within the same session — camera stream stays alive. */
  function rescan() {
    setScanState('scanning');
    setScannedBarcode(null);
    setScanSource(null);
    setSName(''); setSP(''); setSF(''); setSC(''); setSGrams('100');
  }

  /** Fully releases the camera (its own X button) and returns to search. */
  function closeScannerFully() {
    setCameraStarted(false);
    setView('default');
    setScanState('scanning');
    setScannedBarcode(null);
    setScanSource(null);
    setSName(''); setSP(''); setSF(''); setSC(''); setSGrams('100');
  }

  const sGramsNum   = num(sGrams);
  const sKcalPer100 = macrosToKcal(sP, sF, sC);
  const scanPreview = sGramsNum > 0 && sKcalPer100 > 0 ? {
    kcal: Math.round(sKcalPer100 * sGramsNum / 100),
    p: calcFromPer100(num(sP), sGramsNum),
    f: calcFromPer100(num(sF), sGramsNum),
    c: calcFromPer100(num(sC), sGramsNum),
  } : null;

  function handleAddFromScan() {
    if (!sName.trim() || sGramsNum <= 0) return;
    commitAdd({
      name: sName.trim(), grams: sGramsNum,
      kcal: Math.round(sKcalPer100 * sGramsNum / 100),
      p: calcFromPer100(num(sP), sGramsNum),
      f: calcFromPer100(num(sF), sGramsNum),
      c: calcFromPer100(num(sC), sGramsNum),
    });
    if (scanSource === 'off' && scannedBarcode) {
      addFood({
        name: sName.trim(), kcal: sKcalPer100, p: num(sP), f: num(sF), c: num(sC),
        barcode: scannedBarcode, defaultGrams: sGramsNum,
      });
    }
    rescan(); // ready for the next item — ideal for scanning a whole shopping haul
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 modal-backdrop" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div
        className="modal-sheet relative w-full max-w-md flex flex-col"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          maxHeight: '90dvh',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--bg-elevated)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>Добавить приём</h2>
          <button
            onClick={() => { haptic('light'); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <svg width="16" height="16" fill="none" stroke="var(--text-2)" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── DEFAULT VIEW: search + Недавние + База ─────────────────── */}
          {view === 'default' && (
            <div className="px-5 pb-5 flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <svg width="15" height="15" fill="none" stroke="var(--text-3)" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text" placeholder="Название или штрихкод" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { haptic('light'); openScan(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="2" height="14" /><rect x="7" y="5" width="1" height="14" />
                    <rect x="10" y="5" width="3" height="14" /><rect x="15" y="5" width="1" height="14" />
                    <rect x="17" y="5" width="2" height="14" /><rect x="20" y="5" width="1" height="14" />
                  </svg>
                  Скан
                </button>
                <button onClick={() => { haptic('light'); setView('custom'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Свой продукт
                </button>
              </div>

              {recentToShow.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>Недавние</p>
                  <div className="flex flex-col gap-1.5">
                    {recentToShow.map(r => (
                      <QuickAddRow
                        key={r.name}
                        item={{
                          key: r.name, name: r.name, grams: r.grams,
                          kcalPer100: r.grams > 0 ? r.kcal / r.grams * 100 : 0,
                          pPer100:    r.grams > 0 ? r.p / r.grams * 100    : 0,
                          fPer100:    r.grams > 0 ? r.f / r.grams * 100    : 0,
                          cPer100:    r.grams > 0 ? r.c / r.grams * 100    : 0,
                        }}
                        onAdd={grams => handleQuickAdd({ name: r.name, kcalPer100: r.grams > 0 ? r.kcal / r.grams * 100 : 0, pPer100: r.grams > 0 ? r.p / r.grams * 100 : 0, fPer100: r.grams > 0 ? r.f / r.grams * 100 : 0, cPer100: r.grams > 0 ? r.c / r.grams * 100 : 0 }, grams)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>База</p>
                {dbToShow.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-4)' }}>
                    {foods.length === 0 ? 'Пока пусто — сохраняй продукты через «Свой продукт»' : 'Ничего не найдено'}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {dbToShow.map(f => (
                      <QuickAddRow
                        key={f.id}
                        item={{
                          key: f.id, name: f.name, grams: f.defaultGrams ?? 100,
                          kcalPer100: f.kcal, pPer100: f.p, fPer100: f.f, cPer100: f.c,
                          onDelete: () => { deleteFood(f.id); },
                        }}
                        onAdd={grams => handleQuickAdd({ name: f.name, kcalPer100: f.kcal, pPer100: f.p, fPer100: f.f, cPer100: f.c }, grams)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CUSTOM VIEW ──────────────────────────────────────────────── */}
          {view === 'custom' && (
            <div className="px-5 pb-5 flex flex-col gap-3">
              <button onClick={() => { haptic('light'); setView('default'); }} className="flex items-center gap-1 text-sm self-start" style={{ color: 'var(--text-3)' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                Назад
              </button>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-3)' }}>Название</label>
                <DarkInput type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="Например: Борщ домашний" />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>БЖУ на 100 г — ккал авто:</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'Белки', value: cP, set: setCP }, { label: 'Жиры', value: cF, set: setCF }, { label: 'Углеводы', value: cC, set: setCC }].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="text-xs block mb-1.5" style={{ color: 'var(--text-3)' }}>{label}</label>
                    <DarkInput type="number" inputMode="decimal" value={value} onChange={e => set(e.target.value)} placeholder="0" />
                  </div>
                ))}
              </div>
              {kcalPer100 > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  ≈ <span className="font-bold" style={{ color: 'var(--kcal)' }}>{kcalPer100}</span> ккал / 100 г
                </p>
              )}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-3)' }}>Граммы</label>
                <DarkInput type="number" inputMode="decimal" value={cGrams} onChange={e => setCGrams(e.target.value)} />
              </div>
              {customPreview && <PreviewRow {...customPreview} />}
              <label className="flex items-center gap-2.5 py-1 cursor-pointer">
                <input type="checkbox" checked={cSaveToDb} onChange={e => setCSaveToDb(e.target.checked)}
                  className="w-4 h-4 rounded" style={{ accentColor: '#ffffff' }} />
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>Сохранить в Базу для быстрого повторного добавления</span>
              </label>
              <PrimaryBtn onClick={handleAddCustom} disabled={!cName.trim() || cGramsNum <= 0}>
                Добавить
              </PrimaryBtn>
            </div>
          )}

          {/* ── SCAN VIEW ────────────────────────────────────────────────── */}
          {view === 'scan' && (
            <div className="px-5 pb-5 flex flex-col gap-4">
              {scanState !== 'scanning' && (
                <button onClick={() => { haptic('light'); setView('default'); }} className="flex items-center gap-1 text-sm self-start" style={{ color: 'var(--text-3)' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                  Назад
                </button>
              )}

              {scanState === 'looking-up' && (
                <div className="flex flex-col items-center gap-3 py-14">
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 20 }} />
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Ищем продукт…</p>
                </div>
              )}

              {scanState === 'not-found' && (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Продукт не найден</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Штрихкод {scannedBarcode} нет в базе Open Food Facts. Добавь БЖУ вручную.
                  </p>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => { haptic('light'); rescan(); }}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)' }}
                    >
                      Сканировать снова
                    </button>
                    <button
                      onClick={() => { haptic('light'); setCName(''); setView('custom'); }}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: '#ffffff', color: '#0a0a0b' }}
                    >
                      Ввести вручную
                    </button>
                  </div>
                </div>
              )}

              {scanState === 'found' && (
                <>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: scanSource === 'cache' ? 'rgba(48,209,88,0.14)' : 'rgba(10,132,255,0.14)',
                        color: scanSource === 'cache' ? 'var(--success)' : 'var(--carbs)',
                      }}
                    >
                      {scanSource === 'cache' ? '✓ Уже сканировал' : '✓ Open Food Facts'}
                    </span>
                    <button onClick={() => { haptic('light'); rescan(); }} className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
                      Сканировать другой
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-3)' }}>Название</label>
                    <DarkInput type="text" value={sName} onChange={e => setSName(e.target.value)} placeholder="Название продукта" />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>БЖУ на 100 г — ккал авто:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: 'Белки', value: sP, set: setSP }, { label: 'Жиры', value: sF, set: setSF }, { label: 'Углеводы', value: sC, set: setSC }].map(({ label, value, set }) => (
                      <div key={label}>
                        <label className="text-xs block mb-1.5" style={{ color: 'var(--text-3)' }}>{label}</label>
                        <DarkInput type="number" inputMode="decimal" value={value} onChange={e => set(e.target.value)} placeholder="0" />
                      </div>
                    ))}
                  </div>
                  {sKcalPer100 > 0 && (
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      ≈ <span className="font-bold" style={{ color: 'var(--kcal)' }}>{sKcalPer100}</span> ккал / 100 г
                    </p>
                  )}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-3)' }}>Граммы</label>
                    <DarkInput type="number" inputMode="decimal" value={sGrams} onChange={e => setSGrams(e.target.value)} />
                  </div>
                  {scanPreview && <PreviewRow {...scanPreview} />}
                  <PrimaryBtn onClick={handleAddFromScan} disabled={!sName.trim() || sGramsNum <= 0}>
                    Добавить
                  </PrimaryBtn>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Camera — portal to escape the sheet's transformed containing block.
          Mounted for the whole session; paused (hidden, decode ignored) whenever
          we're not actively on the scan view, so the stream is never released
          and re-requested mid-session (avoids repeat permission prompts). */}
      {cameraStarted && typeof document !== 'undefined' && createPortal(
        <BarcodeScanner
          paused={!(view === 'scan' && scanState === 'scanning')}
          onDetected={handleDetected}
          onClose={closeScannerFully}
        />,
        document.body,
      )}

      {/* Undo toast — portaled above the camera overlay too */}
      {typeof document !== 'undefined' && createPortal(
        <div
          className="fixed left-4 right-4 z-[70] flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
          style={{
            bottom: 'max(env(safe-area-inset-bottom), 16px)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            transform: toast ? 'translateY(0)' : 'translateY(90px)',
            opacity: toast ? 1 : 0,
            transition: 'transform 320ms cubic-bezier(0.2,0,0,1), opacity 320ms cubic-bezier(0.2,0,0,1)',
            pointerEvents: toast ? 'auto' : 'none',
          }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(48,209,88,0.16)', color: 'var(--success)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>Добавлено</p>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{toast?.label ?? ''}</p>
          </div>
          <button onClick={undoToast} className="text-xs font-bold shrink-0" style={{ color: 'var(--carbs)' }}>
            Отменить
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
