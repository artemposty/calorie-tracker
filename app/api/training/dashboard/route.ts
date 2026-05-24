import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate, shiftDateBy } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

function epley(weight: number, reps: number) {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const today = getTodayDate();
  const weekStart = shiftDateBy(today, -6);

  const [todayRes, weekRes] = await Promise.all([
    sb()
      .from('workout_sets')
      .select('id, exercise_id, weight, reps, rpe, notes, created_at')
      .eq('user_id', USER_ID())
      .eq('date', today)
      .order('created_at', { ascending: true }),

    sb()
      .from('workout_sets')
      .select('exercise_id, weight, reps')
      .eq('user_id', USER_ID())
      .gte('date', weekStart)
      .lte('date', today),
  ]);

  if (todayRes.error) return Response.json({ error: todayRes.error.message }, { status: 500 });
  if (weekRes.error) return Response.json({ error: weekRes.error.message }, { status: 500 });

  // Fetch exercises for all referenced IDs
  const allIds = [...new Set([
    ...(todayRes.data ?? []).map(s => s.exercise_id as string),
    ...(weekRes.data ?? []).map(s => s.exercise_id as string),
  ])];

  const exMap = new Map<string, Record<string, unknown>>();
  if (allIds.length > 0) {
    const { data: exData } = await sb()
      .from('exercises')
      .select('id, name, primary_muscle, secondary_muscles, equipment, is_custom, is_system, display_order')
      .in('id', allIds)
      .eq('user_id', USER_ID());
    for (const r of exData ?? []) exMap.set(r.id as string, r as Record<string, unknown>);
  }

  // Group today's sets by exercise
  const byExercise: Record<string, { exercise: unknown; sets: unknown[] }> = {};
  for (const row of todayRes.data ?? []) {
    const ex = exMap.get(row.exercise_id as string);
    if (!ex) continue;
    const exId = row.exercise_id as string;
    if (!byExercise[exId]) {
      byExercise[exId] = {
        exercise: {
          id: ex.id, name: ex.name, primaryMuscle: ex.primary_muscle,
          secondaryMuscles: ex.secondary_muscles ?? [], equipment: ex.equipment,
          isCustom: ex.is_custom, isSystem: ex.is_system, displayOrder: ex.display_order,
        },
        sets: [],
      };
    }
    (byExercise[exId].sets as unknown[]).push({
      id: row.id, weight: Number(row.weight), reps: row.reps, rpe: row.rpe, notes: row.notes,
      e1rm: epley(Number(row.weight), row.reps),
    });
  }

  // Weekly volume per muscle
  const volume: Record<string, number> = {};
  for (const row of weekRes.data ?? []) {
    const ex = exMap.get(row.exercise_id as string);
    if (!ex) continue;
    const add = (m: string, frac: number) => { volume[m as string] = (volume[m as string] ?? 0) + frac; };
    add(ex.primary_muscle as string, 1.0);
    for (const m of (ex.secondary_muscles as string[]) ?? []) add(m, 0.5);
  }
  for (const m of Object.keys(volume)) volume[m] = Math.round(volume[m] * 10) / 10;

  const totalSetsToday = (todayRes.data ?? []).length;
  const totalTonnageToday = Math.round((todayRes.data ?? []).reduce((sum, r) => sum + Number(r.weight) * (r.reps as number), 0));

  return Response.json({
    date: today,
    totalSetsToday,
    totalTonnageToday,
    exercises: Object.values(byExercise),
    weeklyVolume: volume,
  });
}
