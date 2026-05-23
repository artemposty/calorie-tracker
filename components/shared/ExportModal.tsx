'use client';

import { useState, useRef } from 'react';
import { X, Download, Upload, Copy, Check } from 'lucide-react';
import { FoodEntry, WeightEntry, Goals, AppExport } from '@/lib/types';
import { getTodayDate, copyToClipboard } from '@/lib/storage';

interface Props {
  nutrition: Record<string, FoodEntry[]>;
  weight: WeightEntry[];
  goals: Goals;
  onImport: (data: AppExport) => void;
  onClose: () => void;
}

export function ExportModal({ nutrition, weight, goals, onImport, onClose }: Props) {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const exportData: AppExport = {
    version: 1,
    exportDate: getTodayDate(),
    nutrition,
    weight,
    goals,
  };
  const exportJson = JSON.stringify(exportData, null, 2);

  async function handleCopy() {
    const ok = await copyToClipboard(exportJson);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDownload() {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calorie-tracker-${getTodayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    setImportError('');
    try {
      const parsed = JSON.parse(importText) as AppExport;
      if (!parsed.nutrition || !Array.isArray(parsed.weight)) {
        setImportError('Неверный формат данных');
        return;
      }
      onImport(parsed);
      onClose();
    } catch {
      setImportError('Ошибка парсинга JSON');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 modal-backdrop" onClick={onClose} />
      <div
        className="modal-sheet relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85dvh] flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-slate-900">Данные</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 mb-4">
          {(['export', 'import'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                tab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t === 'export' ? 'Экспорт' : 'Импорт'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {tab === 'export' ? (
            <div className="flex flex-col gap-3">
              <textarea
                ref={textareaRef}
                readOnly
                value={exportJson}
                className="w-full h-48 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none text-slate-700"
              />
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition-colors"
              >
                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                {copied ? 'Скопировано!' : 'Скопировать'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-medium"
              >
                <Download size={18} />
                Скачать .json
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-500">
                Вставьте ранее экспортированный JSON ниже. Это заменит все текущие данные.
              </p>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='{"version":1,"nutrition":{...},...}'
                className="w-full h-48 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none text-slate-700"
              />
              {importError && (
                <p className="text-sm text-red-500">{importError}</p>
              )}
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-medium disabled:opacity-40"
              >
                <Upload size={18} />
                Импортировать
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
