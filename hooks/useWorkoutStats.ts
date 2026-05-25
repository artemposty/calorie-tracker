'use client';
import { useState, useEffect } from 'react';
import { supabase, USER_ID } from '@/lib/supabase';

export const MUSCLE_TARGETS: Record<string, { min: number; max: number }> = {
  chest:      { min: 10, max: 20 },
  back:       { min: 10, max: 20 },
  legs:       { min: 10, max: 20 },
  shoulders:  { min: 10, max: 20 },
  biceps:     { min: 8,  max: 16 },
  triceps:    { min: 8,  max: 16 },
  glutes:     { min: 8,  max: 16 },
  core:       { min: 8,  max: 15 },
  calves:     { min: 8,  max: 15 },
  forearms:   { min: 8,  max: 15 },
  lower_back: { min: 8,  max: 15 },
};

export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Грудь', back: 'Спина', legs: 'Ноги', shoulders: 'Плечи',
  biceps: 'Бицепс', triceps: 'Трицепс', glutes: 'Ягодицы',
  core: 'Кор', calves: 'Икры', forearms: 'Предплечья', lower_back: 'Поясница',
};

export const MUSCLE_COLORS: Record<string, string> = {
  chest: '#e07e7e', back: '#5cb8b2', legs: '#d4b84a', shoulders: '#7cb87f',
  biceps: '#7baad4', triceps: '#c47fd4', glutes: '#d47a9e',
  core: '#d4956e', calves: '#a0a0d4', lower_back: '#c4b87a', forearms: '#6db8a0',
};

export const MUSCLE_ORDER = [
  'chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps',
  'glutes', 'core', 'calves', 'lower_back', 'forearms',
];

function epley(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function getMondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shiftDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Volume ────────────────────────────────────────────────────────────────────

export interface MuscleWeekData { sets: number; tonnage: number; frequency: number; }
export interface WeekVolumeData {
  week_start: string;
  total_sessions: number;
  total_working_sets: number;
  by_muscle: Record<string, MuscleWeekData>;
}
export interface VolumeStats { weeks: WeekVolumeData[]; current_week: WeekVolumeData | null; }

export function useVolumeStats(weeks: number) {
  const [data, setData] = useState<VolumeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const today = getToday();
      const from = getMondayOf(shiftDays(today, -(weeks * 7)));

      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('date, exercise_id, weight, reps, rpe')
        .eq('user_id', USER_ID)
        .gte('date', from)
        .lte('date', today)
        .order('date', { ascending: true });

      if (!setsData || setsData.length === 0) {
        if (!cancelled) { setData({ weeks: [], current_week: null }); setLoading(false); }
        return;
      }

      const exerciseIds = [...new Set(setsData.map(s => s.exercise_id as string))];
      const { data: exData } = await supabase
        .from('exercises')
        .select('id, primary_muscle, secondary_muscles')
        .in('id', exerciseIds)
        .eq('user_id', USER_ID);

      const exMap = new Map((exData ?? []).map(r => [
        r.id as string,
        { primary: r.primary_muscle as string, secondary: (r.secondary_muscles as string[]) ?? [] },
      ]));

      interface WeekAcc {
        week_start: string;
        by_muscle: Record<string, { sets: number; tonnage: number; days: Set<string> }>;
        session_days: Set<string>;
        working_sets: number;
      }
      const weekMap = new Map<string, WeekAcc>();

      for (const row of setsData) {
        const weekStart = getMondayOf(row.date as string);
        if (!weekMap.has(weekStart)) {
          weekMap.set(weekStart, { week_start: weekStart, by_muscle: {}, session_days: new Set(), working_sets: 0 });
        }
        const week = weekMap.get(weekStart)!;
        week.session_days.add(row.date as string);
        const rpe = Number(row.rpe ?? 0);
        if (rpe === 0 || rpe >= 7) week.working_sets++;

        const ex = exMap.get(row.exercise_id as string);
        if (!ex) continue;
        const tonnage = Number(row.weight) * (row.reps as number);
        const add = (muscle: string, frac: number) => {
          if (!week.by_muscle[muscle]) week.by_muscle[muscle] = { sets: 0, tonnage: 0, days: new Set() };
          week.by_muscle[muscle].sets += frac;
          week.by_muscle[muscle].tonnage += tonnage * frac;
          week.by_muscle[muscle].days.add(row.date as string);
        };
        add(ex.primary, 1.0);
        for (const sec of ex.secondary) add(sec, 0.5);
      }

      const weeksList: WeekVolumeData[] = Array.from(weekMap.values())
        .sort((a, b) => a.week_start.localeCompare(b.week_start))
        .map(w => ({
          week_start: w.week_start,
          total_sessions: w.session_days.size,
          total_working_sets: w.working_sets,
          by_muscle: Object.fromEntries(
            Object.entries(w.by_muscle).map(([muscle, v]) => [muscle, {
              sets: Math.round(v.sets * 10) / 10,
              tonnage: Math.round(v.tonnage),
              frequency: v.days.size,
            }])
          ),
        }));

      const currentWeekStart = getMondayOf(today);
      const current_week = weeksList.find(w => w.week_start === currentWeekStart) ?? null;

      if (!cancelled) { setData({ weeks: weeksList, current_week }); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [weeks]);

  return { data, loading };
}

// ── Strength ──────────────────────────────────────────────────────────────────

export interface SessionData {
  date: string;
  top_set: { weight: number; reps: number; rpe: number };
  e1rm: number;
  total_volume: number;
  is_pr: boolean;
}
export interface StrengthStats {
  sessions: SessionData[];
  pr: { weight: number; reps: number; date: string; e1rm: number } | null;
  trend_4w: { current_avg_e1rm: number; previous_avg_e1rm: number; delta_pct: number } | null;
}

export function useStrengthStats(exerciseId: string | null, weeks: number) {
  const [data, setData] = useState<StrengthStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    async function load() {
      const today = getToday();
      const from = shiftDays(today, -(weeks * 7) + 1);

      const { data: allHistory } = await supabase
        .from('workout_sets')
        .select('date, weight, reps, rpe')
        .eq('user_id', USER_ID)
        .eq('exercise_id', exerciseId)
        .order('date', { ascending: true });

      if (!allHistory || allHistory.length === 0) {
        if (!cancelled) { setData({ sessions: [], pr: null, trend_4w: null }); setLoading(false); }
        return;
      }

      const byDate: Record<string, { weight: number; reps: number; rpe: number }[]> = {};
      for (const s of allHistory) {
        const date = s.date as string;
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push({ weight: Number(s.weight), reps: s.reps as number, rpe: Number(s.rpe ?? 0) });
      }

      let runningPrE1rm = 0;
      let allTimePr: StrengthStats['pr'] = null;
      const sessions: SessionData[] = [];

      for (const date of Object.keys(byDate).sort()) {
        const sets = byDate[date];
        let topSet = sets[0];
        for (const s of sets) {
          if (epley(s.weight, s.reps) > epley(topSet.weight, topSet.reps)) topSet = s;
        }
        const e1rm = epley(topSet.weight, topSet.reps);
        const is_pr = e1rm > runningPrE1rm;
        if (is_pr) {
          runningPrE1rm = e1rm;
          allTimePr = { weight: topSet.weight, reps: topSet.reps, date, e1rm };
        }
        if (date >= from) {
          sessions.push({
            date,
            top_set: topSet,
            e1rm,
            total_volume: Math.round(sets.reduce((acc, s) => acc + s.weight * s.reps, 0)),
            is_pr,
          });
        }
      }

      const b4 = shiftDays(today, -28);
      const b8 = shiftDays(today, -56);
      const cur4 = sessions.filter(s => s.date >= b4);
      const prev4 = sessions.filter(s => s.date >= b8 && s.date < b4);
      let trend_4w: StrengthStats['trend_4w'] = null;
      if (cur4.length >= 1 && prev4.length >= 1) {
        const avgCur  = cur4.reduce((s, x) => s + x.e1rm, 0) / cur4.length;
        const avgPrev = prev4.reduce((s, x) => s + x.e1rm, 0) / prev4.length;
        trend_4w = {
          current_avg_e1rm:  Math.round(avgCur  * 10) / 10,
          previous_avg_e1rm: Math.round(avgPrev * 10) / 10,
          delta_pct: Math.round((avgCur - avgPrev) / avgPrev * 1000) / 10,
        };
      }

      if (!cancelled) { setData({ sessions, pr: allTimePr, trend_4w }); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [exerciseId, weeks]);

  return { data, loading };
}

// ── Activity ──────────────────────────────────────────────────────────────────

export interface ActivityStats {
  days: { date: string; tonnage: number }[];
  month_summary: {
    sessions: number;
    total_sets: number;
    total_working_sets: number;
    rpe_distribution: Record<string, number>;
    most_trained_muscle: string | null;
    least_trained_muscle: string | null;
  } | null;
}

export function useActivityStats(months: number) {
  const [data, setData] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const today = getToday();
      const [y, m, d] = today.split('-').map(Number);
      const fromDate = new Date(y, m - months, d);
      const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;

      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('date, exercise_id, weight, reps, rpe')
        .eq('user_id', USER_ID)
        .gte('date', from)
        .lte('date', today)
        .order('date', { ascending: true });

      if (!setsData || setsData.length === 0) {
        if (!cancelled) { setData({ days: [], month_summary: null }); setLoading(false); }
        return;
      }

      const dayMap: Record<string, number> = {};
      for (const row of setsData) {
        const date = row.date as string;
        dayMap[date] = (dayMap[date] ?? 0) + Number(row.weight) * (row.reps as number);
      }
      const days = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, tonnage]) => ({ date, tonnage: Math.round(tonnage) }));

      const month30Start = shiftDays(today, -29);
      const monthSets = setsData.filter(s => (s.date as string) >= month30Start);

      const rpeDistribution: Record<string, number> = {};
      for (const s of monthSets) {
        const key = String(Number(s.rpe ?? 0));
        rpeDistribution[key] = (rpeDistribution[key] ?? 0) + 1;
      }

      const exerciseIds = [...new Set(monthSets.map(s => s.exercise_id as string))];
      const { data: exData } = await supabase
        .from('exercises')
        .select('id, primary_muscle')
        .in('id', exerciseIds)
        .eq('user_id', USER_ID);
      const exMap = new Map((exData ?? []).map(r => [r.id as string, r.primary_muscle as string]));

      const muscleCounts: Record<string, number> = {};
      for (const s of monthSets) {
        const muscle = exMap.get(s.exercise_id as string);
        if (muscle) muscleCounts[muscle] = (muscleCounts[muscle] ?? 0) + 1;
      }

      const sessions = new Set(monthSets.map(s => s.date as string)).size;
      const totalWorkingSets = monthSets.filter(s => {
        const rpe = Number(s.rpe ?? 0);
        return rpe === 0 || rpe >= 7;
      }).length;

      const sortedMuscles = Object.entries(muscleCounts).sort(([, a], [, b]) => b - a);

      if (!cancelled) {
        setData({
          days,
          month_summary: {
            sessions,
            total_sets: monthSets.length,
            total_working_sets: totalWorkingSets,
            rpe_distribution: rpeDistribution,
            most_trained_muscle: sortedMuscles[0]?.[0] ?? null,
            least_trained_muscle: sortedMuscles[sortedMuscles.length - 1]?.[0] ?? null,
          },
        });
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [months]);

  return { data, loading };
}
