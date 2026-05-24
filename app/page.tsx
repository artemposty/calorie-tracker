'use client';

import { useState, useCallback } from 'react';
import { Goals, AppExport } from '@/lib/types';
import { DEFAULT_GOALS } from '@/lib/constants';
import { supabase, USER_ID } from '@/lib/supabase';
import { useNutrition } from '@/hooks/useNutrition';
import { useWeight } from '@/hooks/useWeight';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { Drawer, SwipeEdgeDetector, Module } from '@/components/shared/Drawer';
import { NutritionTab } from '@/components/nutrition/NutritionTab';
import { WeightTab } from '@/components/weight/WeightTab';
import { StatsTab } from '@/components/stats/StatsTab';
import { SettingsTab } from '@/components/settings/SettingsTab';
import { WorkoutTab } from '@/components/workout/WorkoutTab';
import { PullToRefresh } from '@/components/shared/PullToRefresh';

export default function Home() {
  const [module,      setModule]      = useState<Module>('nutrition');
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [goals,       setGoals]       = useState<Goals>(DEFAULT_GOALS);
  const [goalsLoaded, setGoalsLoaded] = useState(false);

  const nutrition = useNutrition();
  const weight    = useWeight();

  const openDrawer  = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', USER_ID)
      .single()
      .then(({ data }) => {
        if (data) setGoals({ kcal: data.kcal, protein: data.protein, fat: data.fat, carbs: data.carbs });
        setGoalsLoaded(true);
      });
  }, []);

  function saveGoals(g: Goals) {
    setGoals(g);
    supabase.from('user_goals').upsert({ user_id: USER_ID, ...g, updated_at: new Date().toISOString() });
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
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text-1)' }}>
      <SwipeEdgeDetector onOpen={openDrawer} />
      <Drawer open={drawerOpen} active={module} onSelect={setModule} onClose={closeDrawer} />

      <PullToRefresh>
        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
          {module === 'nutrition' && (
            <NutritionTab
              goals={goals}
              getDayEntries={nutrition.getDayEntries}
              addEntry={nutrition.addEntry}
              addEntries={nutrition.addEntries}
              deleteEntry={nutrition.deleteEntry}
              onMenuOpen={openDrawer}
            />
          )}
          {module === 'workout' && <WorkoutTab onMenuOpen={openDrawer} />}
          {module === 'weight' && (
            <WeightTab
              entries={weight.entries}
              setWeight={weight.setWeight}
              deleteEntry={weight.deleteEntry}
              getByDate={weight.getByDate}
              getStats={weight.getStats}
              onMenuOpen={openDrawer}
            />
          )}
          {module === 'stats' && (
            <StatsTab nutritionData={nutrition.data} goals={goals} onMenuOpen={openDrawer} />
          )}
          {module === 'settings' && (
            <SettingsTab
              goals={goals}
              onSave={saveGoals}
              nutrition={nutrition.data}
              weight={weight.entries}
              onImport={handleImport}
              onMenuOpen={openDrawer}
            />
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
