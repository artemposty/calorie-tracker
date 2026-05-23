'use client';

import { useState, useEffect, useCallback } from 'react';
import { FoodEntry } from '@/lib/types';
import { supabase, USER_ID } from '@/lib/supabase';
import { newId } from '@/lib/storage';

type NutritionData = Record<string, FoodEntry[]>;

function rowToEntry(row: Record<string, unknown>): FoodEntry {
  return {
    id: row.id as string,
    name: row.name as string,
    grams: Number(row.grams),
    kcal: Number(row.kcal),
    p: Number(row.p),
    f: Number(row.f),
    c: Number(row.c),
    time: row.created_at as string,
  };
}

export function useNutrition() {
  const [data, setData] = useState<NutritionData>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('nutrition_entries')
      .select('*')
      .eq('user_id', USER_ID)
      .then(({ data: rows }) => {
        if (rows) {
          const grouped: NutritionData = {};
          for (const row of rows) {
            const date = row.date as string;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(rowToEntry(row));
          }
          setData(grouped);
        }
        setLoaded(true);
      });
  }, []);

  const addEntry = useCallback((date: string, entry: Omit<FoodEntry, 'id' | 'time'>) => {
    const id = newId();
    const full: FoodEntry = { ...entry, id, time: new Date().toISOString() };
    // Optimistic update
    setData(prev => ({ ...prev, [date]: [...(prev[date] ?? []), full] }));
    supabase.from('nutrition_entries').insert({ id, user_id: USER_ID, date, ...entry });
  }, []);

  const addEntries = useCallback((date: string, entries: Omit<FoodEntry, 'id' | 'time'>[]) => {
    const now = new Date().toISOString();
    const rows = entries.map(e => ({ id: newId(), user_id: USER_ID, date, ...e }));
    const full: FoodEntry[] = rows.map(r => ({
      id: r.id, name: r.name, grams: r.grams,
      kcal: r.kcal, p: r.p, f: r.f, c: r.c, time: now,
    }));
    // Optimistic update
    setData(prev => ({ ...prev, [date]: [...(prev[date] ?? []), ...full] }));
    supabase.from('nutrition_entries').insert(rows);
  }, []);

  const deleteEntry = useCallback((date: string, id: string) => {
    // Optimistic update
    setData(prev => ({ ...prev, [date]: (prev[date] ?? []).filter(e => e.id !== id) }));
    supabase.from('nutrition_entries').delete().eq('id', id);
  }, []);

  const getDayEntries = useCallback(
    (date: string): FoodEntry[] => data[date] ?? [],
    [data]
  );

  const replaceAll = useCallback(async (newData: NutritionData) => {
    await supabase.from('nutrition_entries').delete().eq('user_id', USER_ID);
    const rows = Object.entries(newData).flatMap(([date, entries]) =>
      entries.map(e => ({
        id: e.id || newId(),
        user_id: USER_ID,
        date,
        name: e.name,
        grams: e.grams,
        kcal: e.kcal,
        p: e.p,
        f: e.f,
        c: e.c,
      }))
    );
    if (rows.length > 0) await supabase.from('nutrition_entries').insert(rows);
    setData(newData);
  }, []);

  return { data, loaded, addEntry, addEntries, deleteEntry, getDayEntries, replaceAll };
}
