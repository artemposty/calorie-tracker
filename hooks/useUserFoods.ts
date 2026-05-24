'use client';

import { useState, useEffect } from 'react';
import { UserFoodItem } from '@/lib/types';
import { supabase, USER_ID } from '@/lib/supabase';
import { newId } from '@/lib/storage';

function sb(promise: PromiseLike<{ error: unknown }>) {
  Promise.resolve(promise).then(({ error }) => {
    if (error) console.error('[supabase]', error);
  });
}

export function useUserFoods() {
  const [foods, setFoods] = useState<UserFoodItem[]>([]);

  useEffect(() => {
    supabase
      .from('user_foods')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setFoods(data.map(row => ({
            id: row.id as string,
            name: row.name as string,
            kcal: Number(row.kcal),
            p: Number(row.p),
            f: Number(row.f),
            c: Number(row.c),
            defaultGrams: row.default_grams ? Number(row.default_grams) : undefined,
          })));
        }
      });
  }, []);

  function addFood(food: Omit<UserFoodItem, 'id'>) {
    const id = newId();
    setFoods(prev => [{ id, ...food }, ...prev]);
    const { defaultGrams, ...rest } = food;
    sb(supabase.from('user_foods').insert({
      id, user_id: USER_ID, ...rest,
      ...(defaultGrams !== undefined ? { default_grams: defaultGrams } : {}),
    }));
  }

  function deleteFood(id: string) {
    setFoods(prev => prev.filter(f => f.id !== id));
    sb(supabase.from('user_foods').delete().eq('id', id).eq('user_id', USER_ID));
  }

  return { foods, addFood, deleteFood };
}
