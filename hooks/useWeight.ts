'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeightEntry } from '@/lib/types';
import { WEIGHT_STORAGE_KEY } from '@/lib/constants';
import { newId } from '@/lib/storage';

export function useWeight() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEIGHT_STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* corrupted data */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(entries));
  }, [entries, loaded]);

  const setWeight = useCallback((date: string, weight: number) => {
    setEntries(prev => {
      const existing = prev.findIndex(e => e.date === date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], weight };
        return updated;
      }
      return [...prev, { id: newId(), date, weight }];
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const getByDate = useCallback(
    (date: string) => entries.find(e => e.date === date)?.weight ?? null,
    [entries]
  );

  const getStats = useCallback(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return null;

    const allWeights = sorted.map(e => e.weight);
    const min = Math.min(...allWeights);
    const max = Math.max(...allWeights);
    const start = sorted[0].weight;
    const current = sorted[sorted.length - 1].weight;

    let weekTrend: number | null = null;
    if (sorted.length >= 14) {
      const last7 = sorted.slice(-7).map(e => e.weight);
      const prev7 = sorted.slice(-14, -7).map(e => e.weight);
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      weekTrend = avg(last7) - avg(prev7);
    }

    return { min, max, start, current, weekTrend, count: sorted.length };
  }, [entries]);

  const replaceAll = useCallback((newEntries: WeightEntry[]) => {
    setEntries(newEntries);
  }, []);

  return { entries, loaded, setWeight, deleteEntry, getByDate, getStats, replaceAll };
}
