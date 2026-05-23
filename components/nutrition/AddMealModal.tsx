'use client';

import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { FoodEntry } from '@/lib/types';
import { FoodItem } from '@/lib/types';
import { FOOD_DB, searchFoods } from '@/lib/food-db';
import { calcFromPer100 } from '@/lib/storage';

type ModalTab = 'db' | 'custom' | 'json';

interface Props {
  onAdd: (entry: Omit<FoodEntry, 'id' | 'time'>) => void;
  onAddMany: (entries: Omit<FoodEntry, 'id' | 'time'>[]) => void;
  onClose: () => void;
}

function num(v: string) { return parseFloat(v) || 0; }

export function AddMealModal({ onAdd, onAddMany, onClose }: Props) {
  const [tab, setTab] = useState<ModalTab>('db');

  // DB tab
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState('100');

  // Custom tab
  const [cName, setCName] = useState('');
  const [cKcal, setCKcal] = useState('');
  const [cP, setCP] = useState('');
  const [cF, setCF] = useState('');
  const [cC, setCC] = useState('');
  const [cGrams, setCGrams] = useState('100');

  // JSON tab
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const filtered = useMemo(() => searchFoods(search), [search]);

  function handleSelectFood(food: FoodItem) {
    setSelected(food);
    setGrams('100');
  }

  function handleAddFromDb() {
    if (!selected) return;
    const g = num(grams);
    if (g <= 0) return;
    onAdd({
      name: selected.name,
      grams: g,
      kcal: calcFromPer100(selected.kcal, g),
      p: calcFromPer100(selected.p, g),
      f: calcFromPer100(selected.f, g),
      c: calcFromPer100(selected.c, g),
    });
    onClose();
  }

  function handleAddCustom() {
    if (!cName.trim() || !cKcal) return;
    const g = num(cGrams);
    if (g <= 0) return;
    onAdd({
      name: cName.trim(),
      grams: g,
      kcal: calcFromPer100(num(cKcal), g),
      p: calcFromPer100(num(cP), g),
      f: calcFromPer100(num(cF), g),
      c: calcFromPer100(num(cC), g),
    });
    onClose();
  }

  function handleImportJson() {
    setJsonError('');
    try {
      const arr = JSON.parse(jsonText);
      if (!Array.isArray(arr)) { setJsonError('Ожидается массив JSON'); return; }
      const entries: Omit<FoodEntry, 'id' | 'time'>[] = arr.map((item: Record<string, unknown>) => ({
        name: String(item.name ?? 'Продукт'),
        grams: num(String(item.grams ?? 100)),
        kcal: num(String(item.kcal ?? 0)),
        p: num(String(item.p ?? 0)),
        f: num(String(item.f ?? 0)),
        c: num(String(item.c ?? 0)),
      }));
      onAddMany(entries);
      onClose();
    } catch {
      setJsonError('Ошибка парсинга JSON');
    }
  }

  const dbPreview = selected && num(grams) > 0 ? {
    kcal: calcFromPer100(selected.kcal, num(grams)),
    p: calcFromPer100(selected.p, num(grams)),
    f: calcFromPer100(selected.f, num(grams)),
    c: calcFromPer100(selected.c, num(grams)),
  } : null;

  const customPreview = cKcal && num(cGrams) > 0 ? {
    kcal: calcFromPer100(num(cKcal), num(cGrams)),
    p: calcFromPer100(num(cP), num(cGrams)),
    f: calcFromPer100(num(cF), num(cGrams)),
    c: calcFromPer100(num(cC), num(cGrams)),
  } : null;

  const TABS: { id: ModalTab; label: string }[] = [
    { id: 'db', label: 'База' },
    { id: 'custom', label: 'Свой' },
    { id: 'json', label: 'JSON' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md flex flex-col"
        style={{ maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">Добавить приём пищи</h2>
          <button onClick={onClose} className="text-slate-400 p-1"><X size={20} /></button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 px-5 mb-4 shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                tab === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* DB TAB */}
          {tab === 'db' && (
            <div className="flex flex-col h-full">
              <div className="px-5 pb-3 shrink-0">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск продукта…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSelected(null); }}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Product list */}
              {!selected && (
                <div className="flex-1 overflow-y-auto px-5 pb-2">
                  {filtered.slice(0, 40).map(food => (
                    <button
                      key={food.name}
                      onClick={() => handleSelectFood(food)}
                      className="w-full flex items-center justify-between py-3 border-b border-slate-100 last:border-0 text-left"
                    >
                      <span className="text-sm text-slate-800">{food.name}</span>
                      <span className="text-xs text-slate-400 shrink-0 ml-2">{food.kcal} ккал</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected product + grams */}
              {selected && (
                <div className="px-5 pb-5 flex flex-col gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-800">{selected.name}</span>
                      <button onClick={() => setSelected(null)} className="text-xs text-slate-400 underline">изменить</button>
                    </div>
                    <p className="text-xs text-slate-400">
                      на 100 г: {selected.kcal} ккал · Б {selected.p} · Ж {selected.f} · У {selected.c}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Граммы</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={grams}
                      onChange={e => setGrams(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {dbPreview && (
                    <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'ккал', value: Math.round(dbPreview.kcal) },
                        { label: 'Б', value: dbPreview.p },
                        { label: 'Ж', value: dbPreview.f },
                        { label: 'У', value: dbPreview.c },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-base font-semibold text-slate-800">{value}</p>
                          <p className="text-xs text-slate-400">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleAddFromDb}
                    disabled={!grams || num(grams) <= 0}
                    className="bg-slate-900 text-white py-3.5 rounded-xl font-medium disabled:opacity-40"
                  >
                    Добавить
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CUSTOM TAB */}
          {tab === 'custom' && (
            <div className="px-5 pb-5 flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Название</label>
                <input
                  type="text"
                  value={cName}
                  onChange={e => setCName(e.target.value)}
                  placeholder="Например: Борщ домашний"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              <p className="text-xs text-slate-400">На 100 г:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Калории', value: cKcal, set: setCKcal, placeholder: 'ккал' },
                  { label: 'Белки (г)', value: cP, set: setCP, placeholder: '0' },
                  { label: 'Жиры (г)', value: cF, set: setCF, placeholder: '0' },
                  { label: 'Углеводы (г)', value: cC, set: setCC, placeholder: '0' },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="text-xs text-slate-500 block mb-1">{label}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Граммы</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={cGrams}
                  onChange={e => setCGrams(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              {customPreview && (
                <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'ккал', value: Math.round(customPreview.kcal) },
                    { label: 'Б', value: customPreview.p },
                    { label: 'Ж', value: customPreview.f },
                    { label: 'У', value: customPreview.c },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-base font-semibold text-slate-800">{value}</p>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAddCustom}
                disabled={!cName.trim() || !cKcal || num(cGrams) <= 0}
                className="bg-slate-900 text-white py-3.5 rounded-xl font-medium disabled:opacity-40"
              >
                Добавить
              </button>
            </div>
          )}

          {/* JSON TAB */}
          {tab === 'json' && (
            <div className="px-5 pb-5 flex flex-col gap-3">
              <p className="text-sm text-slate-500">
                Формат: массив объектов <code className="bg-slate-100 px-1 rounded text-xs">&#123;name, grams, kcal, p, f, c&#125;</code>
              </p>
              <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder={`[\n  {"name":"Рис","grams":200,"kcal":260,"p":5,"f":0.6,"c":56}\n]`}
                className="w-full h-44 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-slate-400"
              />
              {jsonError && <p className="text-sm text-red-500">{jsonError}</p>}
              <button
                onClick={handleImportJson}
                disabled={!jsonText.trim()}
                className="bg-slate-900 text-white py-3.5 rounded-xl font-medium disabled:opacity-40"
              >
                Импортировать
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
