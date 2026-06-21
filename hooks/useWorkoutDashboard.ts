'use client';

import { useState, useEffect } from 'react';
import { supabase, USER_ID } from '@/lib/supabase';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Грудь', back: 'Спина', shoulders: 'Плечи',
  biceps: 'Бицепс', triceps: 'Трицепс', legs: 'Ноги',
  glutes: 'Ягодицы', core: 'Кор', calves: 'Икры',
  forearms: 'Предплечья', lower_back: 'Поясница',
};

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return fmt(d);
}

export interface DashboardData {
  weeklyFreq: number[];          // [3w ago, 2w ago, last week, this week]
  prsThisWeek: { name: string; weight: number; reps: number; e1rm: number }[];
  topProgress: { name: string; deltaPct: number; currentE1rm: number }[];
  neglectedMuscles: { label: string; days: number }[];
}

export function useWorkoutDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch all sets ever
      const { data: allSetsData } = await supabase
        .from('workout_sets')
        .select('exercise_id, date, weight, reps')
        .eq('user_id', USER_ID)
        .order('date', { ascending: true });

      if (!allSetsData || allSetsData.length === 0) {
        setData({ weeklyFreq: [0, 0, 0, 0], prsThisWeek: [], topProgress: [], neglectedMuscles: [] });
        setLoading(false);
        return;
      }

      // Fetch all exercises referenced
      const allExIds = [...new Set(allSetsData.map(s => s.exercise_id as string))];
      const { data: exData } = await supabase
        .from('exercises')
        .select('id, name, primary_muscle')
        .in('id', allExIds)
        .eq('user_id', USER_ID);

      const exMap = new Map((exData ?? []).map(e => [
        e.id as string,
        { name: e.name as string, muscle: e.primary_muscle as string },
      ]));

      const today = new Date();
      const todayStr = fmt(today);
      const thisWeekStart = getMondayOfWeek(todayStr);
      const fourWeeksAgoStr = fmt(new Date(today.getTime() - 28 * 86400000));

      type Row = { exercise_id: string; date: string; weight: number; reps: number; e1rm: number };
      const rows: Row[] = allSetsData.map(s => {
        const w = Number(s.weight);
        const r = s.reps as number;
        return {
          exercise_id: s.exercise_id as string,
          date: s.date as string,
          weight: w,
          reps: r,
          e1rm: w * (1 + r / 30),
        };
      });

      // ── 1. Weekly frequency ──────────────────────────────────────────────
      const weekStarts = [3, 2, 1, 0].map(i => {
        const d = new Date(today.getTime() - i * 7 * 86400000);
        return getMondayOfWeek(fmt(d));
      });
      const weekSessions = new Map<string, Set<string>>(weekStarts.map(w => [w, new Set()]));
      for (const r of rows) {
        const ws = getMondayOfWeek(r.date);
        weekSessions.get(ws)?.add(r.date);
      }
      const weeklyFreq = weekStarts.map(w => weekSessions.get(w)!.size);

      // ── 2. PRs this week ─────────────────────────────────────────────────
      const prevBest: Record<string, number> = {};
      const thisWeekBest: Record<string, { e1rm: number; weight: number; reps: number }> = {};
      for (const r of rows) {
        if (r.date < thisWeekStart) {
          if (r.e1rm > (prevBest[r.exercise_id] ?? 0)) prevBest[r.exercise_id] = r.e1rm;
        } else {
          if (r.e1rm > (thisWeekBest[r.exercise_id]?.e1rm ?? 0)) {
            thisWeekBest[r.exercise_id] = { e1rm: r.e1rm, weight: r.weight, reps: r.reps };
          }
        }
      }
      const prsThisWeek = Object.entries(thisWeekBest)
        .filter(([id, best]) => best.e1rm > (prevBest[id] ?? 0) && exMap.has(id))
        .map(([id, best]) => ({
          name: exMap.get(id)!.name,
          weight: best.weight,
          reps: best.reps,
          e1rm: Math.round(best.e1rm * 10) / 10,
        }));

      // ── 3. Top progress (last 4w vs prev 4w) ────────────────────────────
      const last4wBest: Record<string, number> = {};
      const prev4wBest: Record<string, number> = {};
      for (const r of rows) {
        if (r.date >= fourWeeksAgoStr) {
          if (r.e1rm > (last4wBest[r.exercise_id] ?? 0)) last4wBest[r.exercise_id] = r.e1rm;
        } else {
          if (r.e1rm > (prev4wBest[r.exercise_id] ?? 0)) prev4wBest[r.exercise_id] = r.e1rm;
        }
      }
      const topProgress = Object.entries(last4wBest)
        .filter(([id]) => (prev4wBest[id] ?? 0) > 0 && exMap.has(id))
        .map(([id, current]) => ({
          name: exMap.get(id)!.name,
          deltaPct: Math.round((current - prev4wBest[id]) / prev4wBest[id] * 100),
          currentE1rm: Math.round(current),
        }))
        .filter(x => x.deltaPct > 0)
        .sort((a, b) => b.deltaPct - a.deltaPct)
        .slice(0, 3);

      // ── 4. Neglected muscles ─────────────────────────────────────────────
      const lastByMuscle: Record<string, string> = {};
      for (const r of rows) {
        const muscle = exMap.get(r.exercise_id)?.muscle;
        if (muscle && r.date > (lastByMuscle[muscle] ?? '')) lastByMuscle[muscle] = r.date;
      }
      const neglectedMuscles = Object.entries(lastByMuscle)
        .map(([muscle, lastDate]) => {
          const days = Math.floor(
            (new Date(todayStr + 'T12:00:00').getTime() - new Date(lastDate + 'T12:00:00').getTime()) / 86400000
          );
          return { label: MUSCLE_LABELS[muscle] ?? muscle, days };
        })
        .filter(x => x.days >= 7)
        .sort((a, b) => b.days - a.days)
        .slice(0, 5);

      setData({ weeklyFreq, prsThisWeek, topProgress, neglectedMuscles });
      setLoading(false);
    })();
  }, []);

  return { data, loading };
}
