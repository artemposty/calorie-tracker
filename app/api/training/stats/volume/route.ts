import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

const TARGETS: Record<string, { min: number; max: number }> = {
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

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const weeks = Math.min(Math.max(Number(searchParams.get('weeks') ?? 12), 1), 52);

  const today = getTodayDate();
  const from = getMondayOf(shiftDays(today, -(weeks * 7)));

  const { data: setsData, error } = await sb()
    .from('workout_sets')
    .select('date, exercise_id, weight, reps, rpe')
    .eq('user_id', USER_ID())
    .gte('date', from)
    .lte('date', today)
    .order('date', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!setsData || setsData.length === 0) {
    return Response.json({ weeks: [], targets: TARGETS });
  }

  const exerciseIds = [...new Set(setsData.map(s => s.exercise_id as string))];
  const { data: exData } = await sb()
    .from('exercises')
    .select('id, primary_muscle, secondary_muscles')
    .in('id', exerciseIds)
    .eq('user_id', USER_ID());

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

  const weeksList = Array.from(weekMap.values())
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

  return Response.json({ weeks: weeksList, targets: TARGETS });
}
