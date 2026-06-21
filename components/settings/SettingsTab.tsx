'use client';

import { useState } from 'react';
import { Goals, AppExport } from '@/lib/types';
import { haptic } from '@/lib/haptics';
import { ModuleHeader } from '@/components/shared/ModuleHeader';
import { ExportModal } from '@/components/shared/ExportModal';
import { WeightEntry, FoodEntry } from '@/lib/types';

interface Props {
  goals: Goals;
  onSave: (goals: Goals) => void;
  nutrition: Record<string, FoodEntry[]>;
  weight: WeightEntry[];
  onImport: (data: AppExport) => void;
  onMenuOpen: () => void;
}

function num(v: string) { return parseInt(v, 10) || 0; }

function FieldRow({ label, unit, color, value, onChange }: {
  label: string; unit: string; color: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{unit}</p>
        </div>
      </div>
      <input
        type="number" inputMode="numeric" value={value}
        onChange={e => onChange(e.target.value)}
        className="w-20 px-3 py-2 text-right text-sm font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 tabular-nums"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
      />
    </div>
  );
}

export function SettingsTab({ goals, onSave, nutrition, weight, onImport, onMenuOpen }: Props) {
  const [kcal,     setKcal]     = useState(String(goals.kcal));
  const [protein,  setProtein]  = useState(String(goals.protein));
  const [fat,      setFat]      = useState(String(goals.fat));
  const [carbs,    setCarbs]    = useState(String(goals.carbs));
  const [baseTdee, setBaseTdee] = useState(String(goals.base_tdee ?? 2400));
  const [saved,   setSaved]   = useState(false);
  const [showExport, setShowExport] = useState(false);

  function handleSave() {
    haptic('success');
    onSave({ kcal: num(kcal), protein: num(protein), fat: num(fat), carbs: num(carbs), base_tdee: num(baseTdee) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const fields = [
    { label: 'Калории',   unit: 'ккал/день', color: 'var(--kcal)',    value: kcal,    onChange: setKcal    },
    { label: 'Белки',     unit: 'г/день',    color: 'var(--protein)', value: protein, onChange: setProtein },
    { label: 'Жиры',      unit: 'г/день',    color: 'var(--fat)',     value: fat,     onChange: setFat     },
    { label: 'Углеводы',  unit: 'г/день',    color: 'var(--carbs)',   value: carbs,   onChange: setCarbs   },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <ModuleHeader title="Настройки" onMenuOpen={onMenuOpen} />

      {/* Goals */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
          Цели на день
        </p>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {fields.map((f, i) => (
            <div key={f.label}>
              <FieldRow {...f} />
              {i < fields.length - 1 && <div style={{ height: 1, background: 'var(--border-sub)', marginLeft: 48 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* TDEE */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
          Расход без тренировки (Base TDEE)
        </p>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <FieldRow
            label="Base TDEE"
            unit="ккал/день · калибруй по факту"
            color="rgba(255,255,255,0.3)"
            value={baseTdee}
            onChange={setBaseTdee}
          />
        </div>
        <p className="text-xs mt-1.5 px-1" style={{ color: 'var(--text-4)' }}>
          Расход в день без тренировки. По умолчанию 2400 — скорректируй под свой реальный TDEE.
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold active:scale-95 transition-all duration-150"
        style={{
          background: saved ? 'var(--success)' : '#ffffff',
          color: saved ? '#fff' : '#0a0a0b',
        }}
      >
        {saved ? '✓ Сохранено' : 'Сохранить цели'}
      </button>

      {/* Data */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
          Данные
        </p>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <button
            onClick={() => { haptic('light'); setShowExport(true); }}
            className="w-full flex items-center justify-between px-4 py-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" fill="none" stroke="var(--text-2)" strokeWidth="1.8" viewBox="0 0 24 24">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Экспорт / Импорт</p>
            </div>
            <svg width="16" height="16" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Account */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
          Аккаунт
        </p>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <button
            onClick={async () => {
              haptic('light');
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="w-full flex items-center justify-between px-4 py-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" fill="none" stroke="var(--danger)" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Выйти</p>
            </div>
          </button>
        </div>
      </div>

      {showExport && (
        <ExportModal
          nutrition={nutrition}
          weight={weight}
          goals={goals}
          onImport={(data) => { onImport(data); setShowExport(false); }}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
