'use client';

import { useState, useMemo, useCallback } from 'react';
import { FoodEntry, UserFoodItem } from '@/lib/types';
import { calcFromPer100 } from '@/lib/storage';
import { haptic } from '@/lib/haptics';
import { useUserFoods } from '@/hooks/useUserFoods';
import { fetchProductByBarcode } from '@/lib/openFoodFacts';
import { BarcodeScanner } from './BarcodeScanner';

type ModalTab = 'custom' | 'db' | 'scan';
type DbState  = 'list' | 'selected' | 'add-to-db';
type ScanState = 'idle' | 'scanning' | 'looking-up' | 'found' | 'not-found';

interface Props {
  onAdd: (entry: Omit<FoodEntry, 'id' | 'time'>) => void;
  onClose: () => void;
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

export function AddMealModal({ onAdd, onClose }: Props) {
  const [tab, setTab] = useState<ModalTab>('custom');
  const { foods, addFood, deleteFood, findByBarcode } = useUserFoods();

  const [cName, setCName] = useState('');
  const [cP, setCP] = useState('');
  const [cF, setCF] = useState('');
  const [cC, setCC] = useState('');
  const [cGrams, setCGrams] = useState('100');

  const [dbState, setDbState]   = useState<DbState>('list');
  const [dbSearch, setDbSearch] = useState('');
  const [dbSelected, setDbSelected] = useState<UserFoodItem | null>(null);
  const [dbGrams, setDbGrams]   = useState('100');
  const [addName, setAddName]       = useState('');
  const [addP, setAddP]             = useState('');
  const [addF, setAddF]             = useState('');
  const [addC, setAddC]             = useState('');
  const [addDefaultGrams, setAddDefaultGrams] = useState('');

  // ── Scan tab ─────────────────────────────────────────────────────────
  // cameraStarted stays true across multiple scans in one session so the
  // underlying MediaStream is never released and re-requested — avoids
  // repeat permission prompts. scanState only controls what's *shown*.
  const [cameraStarted, setCameraStarted] = useState(false);
  const [scanState, setScanState]     = useState<ScanState>('idle');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [scanSource, setScanSource]   = useState<'cache' | 'off' | null>(null);
  const [sName, setSName] = useState('');
  const [sP, setSP] = useState('');
  const [sF, setSF] = useState('');
  const [sC, setSC] = useState('');
  const [sGrams, setSGrams] = useState('100');

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

  /** Fully closes the camera and returns to the start screen. */
  function closeScanner() {
    setCameraStarted(false);
    setScanState('idle');
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
    haptic('success');
    onAdd({
      name: sName.trim(), grams: sGramsNum,
      kcal: Math.round(sKcalPer100 * sGramsNum / 100),
      p: calcFromPer100(num(sP), sGramsNum),
      f: calcFromPer100(num(sF), sGramsNum),
      c: calcFromPer100(num(sC), sGramsNum),
    });
    // Cache newly-scanned products locally so the next scan is instant
    if (scanSource === 'off' && scannedBarcode) {
      addFood({
        name: sName.trim(), kcal: sKcalPer100, p: num(sP), f: num(sF), c: num(sC),
        barcode: scannedBarcode, defaultGrams: sGramsNum,
      });
    }
    onClose();
  }

  const filteredFoods = useMemo(
    () => foods.filter(f => f.name.toLowerCase().includes(dbSearch.toLowerCase())),
    [foods, dbSearch]
  );

  const cGramsNum    = num(cGrams);
  const kcalPer100   = macrosToKcal(cP, cF, cC);
  const customPreview = cGramsNum > 0 && kcalPer100 > 0 ? {
    kcal: Math.round(kcalPer100 * cGramsNum / 100),
    p: calcFromPer100(num(cP), cGramsNum),
    f: calcFromPer100(num(cF), cGramsNum),
    c: calcFromPer100(num(cC), cGramsNum),
  } : null;

  const dbGramsNum = num(dbGrams);
  const dbPreview  = dbSelected && dbGramsNum > 0 ? {
    kcal: Math.round(dbSelected.kcal * dbGramsNum / 100),
    p: calcFromPer100(dbSelected.p, dbGramsNum),
    f: calcFromPer100(dbSelected.f, dbGramsNum),
    c: calcFromPer100(dbSelected.c, dbGramsNum),
  } : null;

  const addKcal = macrosToKcal(addP, addF, addC);

  function handleAddCustom() {
    if (!cName.trim() || cGramsNum <= 0) return;
    haptic('success');
    onAdd({
      name: cName.trim(), grams: cGramsNum,
      kcal: Math.round(kcalPer100 * cGramsNum / 100),
      p: calcFromPer100(num(cP), cGramsNum),
      f: calcFromPer100(num(cF), cGramsNum),
      c: calcFromPer100(num(cC), cGramsNum),
    });
    onClose();
  }

  function handleAddFromDb() {
    if (!dbSelected || dbGramsNum <= 0) return;
    haptic('success');
    onAdd({
      name: dbSelected.name, grams: dbGramsNum,
      kcal: Math.round(dbSelected.kcal * dbGramsNum / 100),
      p: calcFromPer100(dbSelected.p, dbGramsNum),
      f: calcFromPer100(dbSelected.f, dbGramsNum),
      c: calcFromPer100(dbSelected.c, dbGramsNum),
    });
    onClose();
  }

  function handleSaveToDb() {
    if (!addName.trim()) return;
    haptic('medium');
    const dg = num(addDefaultGrams);
    addFood({
      name: addName.trim(), kcal: addKcal, p: num(addP), f: num(addF), c: num(addC),
      ...(dg > 0 ? { defaultGrams: dg } : {}),
    });
    setAddName(''); setAddP(''); setAddF(''); setAddC(''); setAddDefaultGrams('');
    setDbState('list');
  }

  const TABS: { id: ModalTab; label: string }[] = [
    { id: 'custom', label: 'Свой' },
    { id: 'db', label: 'База' },
    { id: 'scan', label: 'Скан' },
  ];

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

        {/* Tabs */}
        <div className="flex gap-1.5 px-5 mb-4 shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { haptic('light'); setTab(t.id); }}
              className="flex-1 py-2 text-sm font-semibold rounded-xl transition-colors"
              style={{
                background: tab === t.id ? '#ffffff' : 'var(--bg-elevated)',
                color: tab === t.id ? '#0a0a0b' : 'var(--text-3)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* CUSTOM TAB */}
          {tab === 'custom' && (
            <div className="px-5 pb-5 flex flex-col gap-3">
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
              <PrimaryBtn onClick={handleAddCustom} disabled={!cName.trim() || cGramsNum <= 0}>
                Добавить
              </PrimaryBtn>
            </div>
          )}

          {/* DB TAB */}
          {tab === 'db' && (
            <div className="flex flex-col">

              {dbState === 'list' && (
                <>
                  <div className="px-5 pb-3 shrink-0 flex gap-2">
                    <div className="relative flex-1">
                      <svg width="16" height="16" fill="none" stroke="var(--text-3)" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text" placeholder="Поиск…" value={dbSearch}
                        onChange={e => setDbSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                      />
                    </div>
                    <button
                      onClick={() => { haptic('light'); setDbState('add-to-db'); }}
                      className="w-10 flex items-center justify-center rounded-xl active:scale-90 transition-transform"
                      style={{ background: '#ffffff' }}
                    >
                      <svg width="18" height="18" fill="none" stroke="#0a0a0b" strokeWidth="2.5" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                        <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="px-5 pb-5">
                    {filteredFoods.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-sm mb-3" style={{ color: 'var(--text-4)' }}>
                          {foods.length === 0 ? 'База пустая' : 'Ничего не найдено'}
                        </p>
                        {foods.length === 0 && (
                          <button onClick={() => setDbState('add-to-db')} className="text-sm font-semibold underline" style={{ color: 'var(--text-2)' }}>
                            Добавить первое блюдо
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
                        {filteredFoods.map((food, i) => (
                          <div key={food.id}>
                            <div className="flex items-center">
                              <button
                                onClick={() => { haptic('light'); setDbSelected(food); setDbGrams(String(food.defaultGrams ?? 100)); setDbState('selected'); }}
                                className="flex-1 flex items-center justify-between px-4 py-3.5 text-left active:opacity-70 transition-opacity"
                              >
                                <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{food.name}</span>
                                <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-3)' }}>{food.kcal} ккал/100г</span>
                              </button>
                              <button
                                onClick={() => { haptic('medium'); deleteFood(food.id); }}
                                className="p-3 active:scale-90 transition-transform"
                                style={{ color: 'var(--text-4)' }}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                </svg>
                              </button>
                            </div>
                            {i < filteredFoods.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 16 }} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {dbState === 'selected' && dbSelected && (
                <div className="px-5 pb-5 flex flex-col gap-4">
                  <button onClick={() => setDbState('list')} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-3)' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    Назад
                  </button>
                  <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{dbSelected.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      на 100 г: {dbSelected.kcal} ккал · Б {dbSelected.p} · Ж {dbSelected.f} · У {dbSelected.c}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-3)' }}>Граммы</label>
                    <DarkInput type="number" inputMode="decimal" value={dbGrams} onChange={e => setDbGrams(e.target.value)} />
                  </div>
                  {dbPreview && <PreviewRow {...dbPreview} />}
                  <PrimaryBtn onClick={handleAddFromDb} disabled={dbGramsNum <= 0}>Добавить</PrimaryBtn>
                </div>
              )}

              {dbState === 'add-to-db' && (
                <div className="px-5 pb-5 flex flex-col gap-3">
                  <button onClick={() => setDbState('list')} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-3)' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    Назад
                  </button>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-3)' }}>Название</label>
                    <DarkInput type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Куриная грудка" />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>БЖУ на 100 г:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: 'Белки', value: addP, set: setAddP }, { label: 'Жиры', value: addF, set: setAddF }, { label: 'Углеводы', value: addC, set: setAddC }].map(({ label, value, set }) => (
                      <div key={label}>
                        <label className="text-xs block mb-1.5" style={{ color: 'var(--text-3)' }}>{label}</label>
                        <DarkInput type="number" inputMode="decimal" value={value} onChange={e => set(e.target.value)} placeholder="0" />
                      </div>
                    ))}
                  </div>
                  {addKcal > 0 && (
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      ≈ <span className="font-bold" style={{ color: 'var(--kcal)' }}>{addKcal}</span> ккал / 100 г
                    </p>
                  )}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-3)' }}>
                      Граммы по умолчанию <span style={{ color: 'var(--text-4)', fontWeight: 400, textTransform: 'none' }}>(необязательно)</span>
                    </label>
                    <DarkInput type="number" inputMode="decimal" value={addDefaultGrams} onChange={e => setAddDefaultGrams(e.target.value)} placeholder="100" />
                  </div>
                  <PrimaryBtn onClick={handleSaveToDb} disabled={!addName.trim()}>Сохранить в базу</PrimaryBtn>
                </div>
              )}
            </div>
          )}

          {/* SCAN TAB */}
          {tab === 'scan' && (
            <div className="px-5 pb-5 flex flex-col gap-4">
              {scanState === 'idle' && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <svg width="28" height="28" fill="none" stroke="var(--text-2)" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="2" height="14" /><rect x="7" y="5" width="1" height="14" />
                      <rect x="10" y="5" width="3" height="14" /><rect x="15" y="5" width="1" height="14" />
                      <rect x="17" y="5" width="2" height="14" /><rect x="20" y="5" width="1" height="14" />
                    </svg>
                  </div>
                  <p className="text-sm text-center" style={{ color: 'var(--text-3)' }}>
                    Отсканируй штрихкод с упаковки —{' '}БЖУ подтянутся автоматически
                  </p>
                  <PrimaryBtn onClick={() => { setCameraStarted(true); setScanState('scanning'); }}>Сканировать штрихкод</PrimaryBtn>
                </div>
              )}

              {/* Mounted for the whole camera session — hidden (not unmounted) whenever
                  scanState isn't 'scanning', so the MediaStream stays alive between scans. */}
              {cameraStarted && (
                <BarcodeScanner
                  paused={scanState !== 'scanning'}
                  onDetected={handleDetected}
                  onClose={closeScanner}
                />
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
                    Штрихкод {scannedBarcode} нет в базе Open Food Facts. Добавь БЖУ вручную во вкладке «Свой».
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
                      onClick={() => { haptic('light'); setCName(''); setTab('custom'); }}
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
    </div>
  );
}
