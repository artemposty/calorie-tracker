'use client';

import { useState, useEffect } from 'react';
import { Settings, Database } from 'lucide-react';
import { Goals, AppExport } from '@/lib/types';
import { DEFAULT_GOALS, GOALS_STORAGE_KEY } from '@/lib/constants';
import { useNutrition } from '@/hooks/useNutrition';
import { useWeight } from '@/hooks/useWeight';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { TabBar, Tab } from '@/components/shared/TabBar';
import { ExportModal } from '@/components/shared/ExportModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { NutritionTab } from '@/components/nutrition/NutritionTab';
import { WeightTab } from '@/components/weight/WeightTab';

export default function Home() {
  const [tab, setTab] = useState<Tab>('nutrition');
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [goalsLoaded, setGoalsLoaded] = useState(false);

  const nutrition = useNutrition();
  const weight = useWeight();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GOALS_STORAGE_KEY);
      if (raw) setGoals(JSON.parse(raw));
    } catch { /* use defaults */ }
    setGoalsLoaded(true);
  }, []);

  function saveGoals(g: Goals) {
    setGoals(g);
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(g));
  }

  function handleImport(data: AppExport) {
    nutrition.replaceAll(data.nutrition ?? {});
    weight.replaceAll(data.weight ?? []);
    if (data.goals) saveGoals(data.goals);
  }

  if (!nutrition.loaded || !weight.loaded || !goalsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-slate-50 border-b border-slate-200">
        <div
          className="max-w-md mx-auto flex items-center justify-between px-5 h-14"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <h1 className="text-lg font-bold text-slate-900">Трекер</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowExport(true)}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Экспорт/Импорт"
            >
              <Database size={18} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Настройки"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <div
        className="max-w-md mx-auto"
        style={{ paddingTop: '56px', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        {tab === 'nutrition' && (
          <NutritionTab
            goals={goals}
            getDayEntries={nutrition.getDayEntries}
            addEntry={nutrition.addEntry}
            addEntries={nutrition.addEntries}
            deleteEntry={nutrition.deleteEntry}
          />
        )}
        {tab === 'weight' && (
          <WeightTab
            entries={weight.entries}
            setWeight={weight.setWeight}
            deleteEntry={weight.deleteEntry}
            getByDate={weight.getByDate}
            getStats={weight.getStats}
          />
        )}
      </div>

      <TabBar active={tab} onChange={setTab} />

      {showExport && (
        <ExportModal
          nutrition={nutrition.data}
          weight={weight.entries}
          goals={goals}
          onImport={handleImport}
          onClose={() => setShowExport(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          goals={goals}
          onSave={saveGoals}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
