'use client';

import { useState, useEffect, useCallback } from 'react';
import { Exercise } from '@/lib/types';
import { supabase, USER_ID } from '@/lib/supabase';

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

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, primary_muscle, secondary_muscles, equipment, is_custom, is_system, notes, display_order')
      .eq('user_id', USER_ID)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (!error) setExercises((data ?? []).map(r => rowToExercise(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addExercise = useCallback(async (ex: Omit<Exercise, 'id' | 'isCustom' | 'isSystem' | 'displayOrder'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      id,
      user_id: USER_ID,
      name: ex.name,
      primary_muscle: ex.primaryMuscle,
      secondary_muscles: ex.secondaryMuscles,
      equipment: ex.equipment,
      is_custom: true,
      is_system: false,
      notes: ex.notes ?? null,
      display_order: 999,
    };
    const { error } = await supabase.from('exercises').insert(row);
    if (!error) await load();
    return !error;
  }, [load]);

  return { exercises, loading, reload: load, addExercise };
}
