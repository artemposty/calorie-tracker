'use client';

import { useState, useEffect, useCallback } from 'react';
import { Exercise, WorkoutSetWithExercise } from '@/lib/types';
import { supabase, USER_ID } from '@/lib/supabase';

function epley(weight: number, reps: number) {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function rowToExercise(r: Record<string, unknown>): Exercise {
  return {
    id: r.id as string,
    name: r.name as string,
    primaryMuscle: r.primary_muscle as Exercise['primaryMuscle'],
    secondaryMuscles: (r.secondary_muscles as Exercise['secondaryMuscles']) ?? [],
    equipment: r.equipment as Exercise['equipment'],
    isCustom: r.is_custom as boolean,
    isSystem: r.is_system as boolean,
    notes: r.notes as string | undefined,
    displayOrder: Number(r.display_order),
  };
}

async function fetchSetsForDate(date: string): Promise<WorkoutSetWithExercise[]> {
  const { data: setsData, error } = await supabase
    .from('workout_sets')
    .select('id, exercise_id, date, weight, reps, rpe, notes, created_at')
    .eq('user_id', USER_ID)
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error || !setsData || setsData.length === 0) return [];

  // Fetch exercises separately (no FK constraint needed)
  const exerciseIds = [...new Set(setsData.map(s => s.exercise_id as string))];
  const { data: exData } = await supabase
    .from('exercises')
    .select('id, name, primary_muscle, secondary_muscles, equipment, is_custom, is_system, notes, display_order')
    .in('id', exerciseIds)
    .eq('user_id', USER_ID);

  const exMap = new Map<string, Exercise>(
    (exData ?? []).map(r => [r.id as string, rowToExercise(r as Record<string, unknown>)])
  );

  return setsData
    .filter(s => exMap.has(s.exercise_id as string))
    .map(s => ({
      id: s.id as string,
      exerciseId: s.exercise_id as string,
      date: s.date as string,
      weight: Number(s.weight),
      reps: s.reps as number,
      rpe: Number(s.rpe ?? 0),
      notes: s.notes as string | undefined,
      createdAt: s.created_at as string,
      exercise: exMap.get(s.exercise_id as string)!,
    }));
}

export function useWorkout(date: string) {
  const [sets, setSets] = useState<WorkoutSetWithExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchSetsForDate(date);
    setSets(result);
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const addSet = useCallback(async (params: {
    exerciseId: string;
    weight: number;
    reps: number;
    rpe: number;
    notes?: string;
  }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await supabase.from('workout_sets').insert({
      id,
      user_id: USER_ID,
      exercise_id: params.exerciseId,
      date,
      weight: params.weight,
      reps: params.reps,
      rpe: params.rpe ?? null,
      notes: params.notes ?? null,
    });
    if (!error) await load();
    return !error;
  }, [date, load]);

  const deleteSet = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', USER_ID);
    if (!error) setSets(prev => prev.filter(s => s.id !== id));
    return !error;
  }, []);

  const byExercise = sets.reduce<Record<string, { exercise: Exercise; sets: (WorkoutSetWithExercise & { e1rm: number })[] }>>((acc, s) => {
    if (!acc[s.exerciseId]) acc[s.exerciseId] = { exercise: s.exercise, sets: [] };
    acc[s.exerciseId].sets.push({ ...s, e1rm: epley(s.weight, s.reps) });
    return acc;
  }, {});

  const totalSets = sets.length;
  const totalTonnage = Math.round(sets.reduce((sum, s) => sum + s.weight * s.reps, 0));

  return { sets, byExercise, totalSets, totalTonnage, loading, reload: load, addSet, deleteSet };
}

export function useWeeklyVolume() {
  const [volume, setVolume] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayStr = fmt(today);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    const fromStr = fmt(weekAgo);

    (async () => {
      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('exercise_id, weight, reps')
        .eq('user_id', USER_ID)
        .gte('date', fromStr)
        .lte('date', todayStr);

      if (!setsData || setsData.length === 0) { setLoading(false); return; }

      const exerciseIds = [...new Set(setsData.map(s => s.exercise_id as string))];
      const { data: exData } = await supabase
        .from('exercises')
        .select('id, primary_muscle, secondary_muscles')
        .in('id', exerciseIds)
        .eq('user_id', USER_ID);

      const exMap = new Map((exData ?? []).map(r => [
        r.id as string,
        { primaryMuscle: r.primary_muscle as string, secondaryMuscles: (r.secondary_muscles as string[]) ?? [] },
      ]));

      const vol: Record<string, number> = {};
      for (const row of setsData) {
        const ex = exMap.get(row.exercise_id as string);
        if (!ex) continue;
        const add = (m: string, frac: number) => { vol[m] = (vol[m] ?? 0) + frac; };
        add(ex.primaryMuscle, 1.0);
        for (const m of ex.secondaryMuscles) add(m, 0.5);
      }
      for (const m of Object.keys(vol)) vol[m] = Math.round(vol[m] * 10) / 10;
      setVolume(vol);
      setLoading(false);
    })();
  }, []);

  return { volume, loading };
}

/** Lightweight hook: fetches total tonnage (kg) for a single day. */
export function useTodayTonnage(date: string): number {
  const [tonnage, setTonnage] = useState(0);
  useEffect(() => {
    supabase
      .from('workout_sets')
      .select('weight, reps')
      .eq('user_id', USER_ID)
      .eq('date', date)
      .then(({ data }) => {
        setTonnage(Math.round((data ?? []).reduce((s, r) => s + Number(r.weight) * (r.reps as number), 0)));
      });
  }, [date]);
  return tonnage;
}

/** Fetches tonnage per date for a date range (for stats). */
export function useWorkoutTonnageByDate(from: string, to: string): Record<string, number> {
  const [byDate, setByDate] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!from || !to) return;
    (async () => {
      const { data } = await supabase
        .from('workout_sets')
        .select('date, weight, reps')
        .eq('user_id', USER_ID)
        .gte('date', from)
        .lte('date', to);
      const map: Record<string, number> = {};
      for (const r of data ?? []) {
        const d = r.date as string;
        map[d] = (map[d] ?? 0) + Number(r.weight) * (r.reps as number);
      }
      for (const d of Object.keys(map)) map[d] = Math.round(map[d]);
      setByDate(map);
    })();
  }, [from, to]);
  return byDate;
}

/** Info about the most recent workout strictly before the given date — for empty-day context. */
export function useLastWorkoutInfo(beforeDate: string) {
  const [info, setInfo] = useState<{ date: string; muscles: string[]; totalSets: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: latest } = await supabase
        .from('workout_sets')
        .select('date')
        .eq('user_id', USER_ID)
        .lt('date', beforeDate)
        .order('date', { ascending: false })
        .limit(1);

      if (!latest || latest.length === 0) { setInfo(null); return; }
      const d = latest[0].date as string;

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('exercise_id')
        .eq('user_id', USER_ID)
        .eq('date', d);

      const ids = [...new Set((sets ?? []).map(s => s.exercise_id as string))];
      let muscles: string[] = [];
      if (ids.length > 0) {
        const { data: ex } = await supabase
          .from('exercises')
          .select('primary_muscle')
          .in('id', ids)
          .eq('user_id', USER_ID);
        muscles = [...new Set((ex ?? []).map(r => r.primary_muscle as string))];
      }
      setInfo({ date: d, muscles, totalSets: (sets ?? []).length });
    })();
  }, [beforeDate]);

  return info;
}

export function useLastSession(exerciseId: string | null) {
  const [session, setSession] = useState<{ date: string; sets: { weight: number; reps: number; rpe?: number }[] } | null>(null);

  useEffect(() => {
    if (!exerciseId) { setSession(null); return; }

    (async () => {
      const { data: latest } = await supabase
        .from('workout_sets')
        .select('date')
        .eq('user_id', USER_ID)
        .eq('exercise_id', exerciseId)
        .order('date', { ascending: false })
        .limit(1);

      if (!latest || latest.length === 0) { setSession(null); return; }
      const lastDate = latest[0].date as string;

      const { data } = await supabase
        .from('workout_sets')
        .select('weight, reps, rpe')
        .eq('user_id', USER_ID)
        .eq('exercise_id', exerciseId)
        .eq('date', lastDate)
        .order('created_at', { ascending: true });

      setSession({
        date: lastDate,
        sets: (data ?? []).map(r => ({ weight: Number(r.weight), reps: r.reps as number, rpe: r.rpe as number | undefined })),
      });
    })();
  }, [exerciseId]);

  return session;
}
