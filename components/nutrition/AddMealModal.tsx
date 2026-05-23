'use client';

import { useState, useMemo } from 'react';
import { X, Search, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { FoodEntry, UserFoodItem } from '@/lib/types';
import { calcFromPer100 } from '@/lib/storage';
import { useUserFoods } from '@/hooks/useUserFoods';

type ModalTab = 'json' | 'custom' | 'db';
type DbState = 'list' | 'selected' | 'add-to-db';

interface Props {
  onAdd: (entry: Omit<FoodEntry, 'id' | 'time'>) => void;
  onAddMany: (entries: Omit<FoodEntry, 'id' | 'time'>[]) => void;
  onClose: () => void;
}

function num(v: string) { return parseFloat(v) || 0; }
function macrosToKcal(p: string, f: string, c: string) {
  return Math.round(num(p) * 4 + num(f) * 9 + num(c) * 4);
}

function PreviewRow({ kcal, p, f, c }: { kcal: number; p: number; f: number; c: number }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
      {[{ label: 'ккал', value: kcal }, { label: 'Б', value: p }, { label: 'Ж', value: f }, { label: 'У', value: c }].map(({ label, value }) => (
        <div key={label}>
          <p className="text-base font-semibold text-slate-800">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  );
}

export function AddMealModal({ onAdd, onAddMany, onClose }: Props) {
  const [tab, setTab] = useState<ModalTab>('json');
  const { foods, addFood, deleteFood } = useUserFoods();

  // Custom tab
  const [cName, setCName] = useState('');
  const [cP, setCP] = useState('');
  const [cF, setCF] = useState('');
  const [cC, setCC] = useState('');
  const [cGrams, setCGrams] = useState('100');

  // JSON tab
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  // DB tab
  const [dbState, setDbState] = useState<DbState>('list');
  const [dbSearch, setDbSearch] = useState('');
  const [dbSelected, setDbSelected] = useState<UserFoodItem | null>(null);
  const [dbGrams, setDbGrams] = useState('100');
  const [addName, setAddName] = useState('');
  const [addP, setAddP] = useState('');
  const [addF, setAddF] = useState('');
  const [addC, setAddC] = useState('');

  const filteredFoods = useMemo(
    () => foods.filter(f => f.name.toLowerCase().includes(dbSearch.toLowerCase())),
    [foods, dbSearch]
  );

  const cGramsNum = num(cGrams);
  const kcalPer100 = macrosToKcal(cP, cF, cC);
  const customPreview = cGramsNum > 0 && kcalPer100 > 0 ? {
    kcal: Math.round(kcalPer100 * cGramsNum / 100),
    p: calcFromPer100(num(cP), cGramsNum),
    f: calcFromPer100(num(cF), cGramsNum),
    c: calcFromPer100(num(cC), cGramsNum),
  } : null;

  const dbGramsNum = num(dbGrams);
  const dbPreview = dbSelected && dbGramsNum > 0 ? {
    kcal: Math.round(dbSelected.kcal * dbGramsNum / 100),
    p: calcFromPer100(dbSelected.p, dbGramsNum),
    f: calcFromPer100(dbSelected.f, dbGramsNum),
    c: calcFromPer100(dbSelected.c, dbGramsNum),
  } : null;

  const addKcal = macrosToKcal(addP, addF, addC);

  function handleAddCustom() {
    if (!cName.trim() || cGramsNum <= 0) return;
    onAdd({
      name: cName.trim(),
      grams: cGramsNum,
      kcal: Math.round(kcalPer100 * cGramsNum / 100),
      p: calcFromPer100(num(cP), cGramsNum),
      f: calcFromPer100(num(cF), cGramsNum),
      c: calcFromPer100(num(cC), cGramsNum),
    });
    onClose();
  }

  function handleImportJson() {
    setJsonError('');
    try {
      const arr = JSON.parse(jsonText);
      if (!Array.isArray(arr)) { setJsonError('Ожидается массив JSON'); return; }
      const entries: Omit<FoodEntry, 'id' | 'time'>[] = arr.map((item: Record<string, unknown>) => {
        const p = num(String(item.p ?? 0));
        const f = num(String(item.f ?? 0));
        const c = num(String(item.c ?? 0));
        const specified = num(String(item.kcal ?? 0));
        return {
          name: String(item.name ?? 'Продукт'),
          grams: num(String(item.grams ?? 100)),
          kcal: specified || Math.round(p * 4 + f * 9 + c * 4),
          p, f, c,
        };
      });
      onAddMany(entries);
      onClose();
    } catch {
      setJsonError('Ошибка парсинга JSON');
    }
  }

  function handleAddFromDb() {
    if (!dbSelected || dbGramsNum <= 0) return;
    onAdd({
      name: dbSelected.name,
      grams: dbGramsNum,
      kcal: Math.round(dbSelected.kcal * dbGramsNum / 100),
      p: calcFromPer100(dbSelected.p, dbGramsNum),
      f: calcFromPer100(dbSelected.f, dbGramsNum),
      c: calcFromPer100(dbSelected.c, dbGramsNum),
    });
    onClose();
  }

  function handleSaveToDb() {
    if (!addName.trim()) return;
    addFood({ name: addName.trim(), kcal: addKcal, p: num(addP), f: num(addF), c: num(addC) });
    setAddName(''); setAddP(''); setAddF(''); setAddC('');
    setDbState('list');
  }

  const TABS: { id: ModalTab; label: string }[] = [
    { id: 'json', label: 'JSON' },
    { id: 'custom', label: 'Свой' },
    { id: 'db', label: 'База' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 modal-backdrop" onClick={onClose} />
      <div
        className="modal-sheet relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md flex flex-col"
        style={{ maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">Добавить приём пищи</h2>
          <button onClick={onClose} className="text-slate-400 p-1"><X size={20} /></button>
        </div>

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

        <div className="flex-1 overflow-y-auto">

          {/* JSON TAB */}
          {tab === 'json' && (
            <div className="px-5 pb-5 flex flex-col gap-3">
              <p className="text-sm text-slate-500">
                Массив объектов <code className="bg-slate-100 px-1 rounded text-xs">{'{ name, grams, p, f, c }'}</code>. Ккал считаются автоматически из БЖУ.
              </p>
              <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder={`[\n  {"name":"Рис","grams":200,"p":5,"f":0.6,"c":56}\n]`}
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

              <p className="text-xs text-slate-400">БЖУ на 100 г — ккал рассчитаются автоматически:</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Белки (г)', value: cP, set: setCP },
                  { label: 'Жиры (г)', value: cF, set: setCF },
                  { label: 'Углеводы (г)', value: cC, set: setCC },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="text-xs text-slate-500 block mb-1">{label}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                    />
                  </div>
                ))}
              </div>

              {kcalPer100 > 0 && (
                <p className="text-xs text-slate-400">
                  ≈ <span className="font-semibold text-slate-600">{kcalPer100}</span> ккал на 100 г
                </p>
              )}

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

              {customPreview && <PreviewRow {...customPreview} />}

              <button
                onClick={handleAddCustom}
                disabled={!cName.trim() || cGramsNum <= 0}
                className="bg-slate-900 text-white py-3.5 rounded-xl font-medium disabled:opacity-40"
              >
                Добавить
              </button>
            </div>
          )}

          {/* DB TAB */}
          {tab === 'db' && (
            <div className="flex flex-col h-full">

              {/* List */}
              {dbState === 'list' && (
                <>
                  <div className="px-5 pb-3 shrink-0 flex gap-2">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Поиск…"
                        value={dbSearch}
                        onChange={e => setDbSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <button
                      onClick={() => setDbState('add-to-db')}
                      className="flex items-center justify-center w-10 bg-slate-900 text-white rounded-xl shrink-0"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 pb-5">
                    {filteredFoods.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-slate-400 text-sm mb-3">
                          {foods.length === 0 ? 'База пустая' : 'Ничего не найдено'}
                        </p>
                        {foods.length === 0 && (
                          <button
                            onClick={() => setDbState('add-to-db')}
                            className="text-sm text-slate-700 font-medium underline"
                          >
                            Добавить первое блюдо
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredFoods.map(food => (
                        <div key={food.id} className="flex items-center border-b border-slate-100 last:border-0">
                          <button
                            onClick={() => { setDbSelected(food); setDbGrams('100'); setDbState('selected'); }}
                            className="flex-1 flex items-center justify-between py-3 text-left"
                          >
                            <span className="text-sm text-slate-800">{food.name}</span>
                            <span className="text-xs text-slate-400 shrink-0 ml-2">{food.kcal} ккал/100г</span>
                          </button>
                          <button
                            onClick={() => deleteFood(food.id)}
                            className="p-2 text-slate-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Selected food */}
              {dbState === 'selected' && dbSelected && (
                <div className="px-5 pb-5 flex flex-col gap-4">
                  <button onClick={() => setDbState('list')} className="flex items-center gap-1 text-sm text-slate-500 -mt-1">
                    <ChevronLeft size={16} /> Назад
                  </button>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-1">{dbSelected.name}</p>
                    <p className="text-xs text-slate-400">
                      на 100 г: {dbSelected.kcal} ккал · Б {dbSelected.p} · Ж {dbSelected.f} · У {dbSelected.c}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Граммы</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={dbGrams}
                      onChange={e => setDbGrams(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  {dbPreview && <PreviewRow {...dbPreview} />}
                  <button
                    onClick={handleAddFromDb}
                    disabled={dbGramsNum <= 0}
                    className="bg-slate-900 text-white py-3.5 rounded-xl font-medium disabled:opacity-40"
                  >
                    Добавить
                  </button>
                </div>
              )}

              {/* Add food to DB */}
              {dbState === 'add-to-db' && (
                <div className="px-5 pb-5 flex flex-col gap-3">
                  <button onClick={() => setDbState('list')} className="flex items-center gap-1 text-sm text-slate-500 -mt-1">
                    <ChevronLeft size={16} /> Назад
                  </button>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Название</label>
                    <input
                      type="text"
                      value={addName}
                      onChange={e => setAddName(e.target.value)}
                      placeholder="Например: Куриная грудка"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <p className="text-xs text-slate-400">БЖУ на 100 г:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Белки', value: addP, set: setAddP },
                      { label: 'Жиры', value: addF, set: setAddF },
                      { label: 'Углеводы', value: addC, set: setAddC },
                    ].map(({ label, value, set }) => (
                      <div key={label}>
                        <label className="text-xs text-slate-500 block mb-1">{label}</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={value}
                          onChange={e => set(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
                        />
                      </div>
                    ))}
                  </div>
                  {addKcal > 0 && (
                    <p className="text-xs text-slate-400">
                      ≈ <span className="font-semibold text-slate-600">{addKcal}</span> ккал на 100 г
                    </p>
                  )}
                  <button
                    onClick={handleSaveToDb}
                    disabled={!addName.trim()}
                    className="bg-slate-900 text-white py-3.5 rounded-xl font-medium disabled:opacity-40"
                  >
                    Сохранить в базу
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
