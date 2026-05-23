'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeightEntry } from '@/lib/types';
import { supabase, USER_ID } from '@/lib/supabase';
import { newId } from '@/lib/storage';

export function useWeight() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', USER_ID)
      .then(({ data: rows }) => {
        if (rows) {
          setEntries(rows.map(r => ({
            id: r.id as string,
            date: r.date as string,
            weight: Number(r.weight),
          })));
        }
        setLoaded(true);
      });
  }, []);

  const setWeight = useCallback((date: string, weight: number) => {
    setEntries(prev => {
      const exists = prev.find(e => e.date === date);
      if (exists) {
        supabase.from('weight_entries').update({ weight }).eq('id', exists.id);
        return prev.map(e => e.date === date ? { ...e, weight } : e);
      }
      const id = newId();
      supabase.from('weight_entries').insert({ id, user_id: USER_ID, date, weight });
      return [...prev, { id, date, weight }];
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    supabase.from('weight_entries').delete().eq('id', id);
  }, []);

  const getByDate = useCallback(
    (date: string) => entries.find(e => e.date === date)?.weight ?? null,
    [entries]
  );

  const getStats = useCallback(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return null;

    const allWeights = sorted.map(e => e.weight);
    const start = sorted[0].weight;
    const current = sorted[sorted.length - 1].weight;

    let weekTrend: number | null = null;
    if (sorted.length >= 14) {
      const last7 = sorted.slice(-7).map(e => e.weight);
      const prev7 = sorted.slice(-14, -7).map(e => e.weight);
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      weekTrend = avg(last7) - avg(prev7);
    }

    return {
      min: Math.min(...allWeights),
      max: Math.max(...allWeights),
      start, current, weekTrend, count: sorted.length,
    };
  }, [entries]);

  const replaceAll = useCallback(async (newEntries: WeightEntry[]) => {
    await supabase.from('weight_entries').delete().eq('user_id', USER_ID);
    if (newEntries.length > 0) {
      await supabase.from('weight_entries').insert(
        newEntries.map(e => ({ id: e.id || newId(), user_id: USER_ID, date: e.date, weight: e.weight }))
      );
    }
    setEntries(newEntries);
  }, []);

  return { entries, loaded, setWeight, deleteEntry, getByDate, getStats, replaceAll };
}
