'use client';

import { useState, useEffect, useCallback } from 'react';
import { FoodEntry } from '@/lib/types';
import { NUTRITION_STORAGE_KEY } from '@/lib/constants';
import { newId, getTodayDate } from '@/lib/storage';

type NutritionData = Record<string, FoodEntry[]>;

export function useNutrition() {
  const [data, setData] = useState<NutritionData>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NUTRITION_STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch { /* corrupted data */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(NUTRITION_STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const addEntry = useCallback((
    date: string,
    entry: Omit<FoodEntry, 'id' | 'time'>
  ) => {
    const full: FoodEntry = {
      ...entry,
      id: newId(),
      time: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      [date]: [...(prev[date] ?? []), full],
    }));
  }, []);

  const addEntries = useCallback((date: string, entries: Omit<FoodEntry, 'id' | 'time'>[]) => {
    const now = new Date().toISOString();
    const full: FoodEntry[] = entries.map(e => ({ ...e, id: newId(), time: now }));
    setData(prev => ({
      ...prev,
      [date]: [...(prev[date] ?? []), ...full],
    }));
  }, []);

  const deleteEntry = useCallback((date: string, id: string) => {
    setData(prev => ({
      ...prev,
      [date]: (prev[date] ?? []).filter(e => e.id !== id),
    }));
  }, []);

  const getDayEntries = useCallback(
    (date: string): FoodEntry[] => data[date] ?? [],
    [data]
  );

  const replaceAll = useCallback((newData: NutritionData) => {
    setData(newData);
  }, []);

  return { data, loaded, addEntry, addEntries, deleteEntry, getDayEntries, replaceAll };
}
