import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate, shiftDateBy } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const weeks = Math.min(Math.max(Number(searchParams.get('weeks') ?? 1), 1), 12);

  const today = getTodayDate();
  const from = shiftDateBy(today, -(weeks * 7 - 1));

  const { data: setsData, error } = await sb()
    .from('workout_sets')
    .select('exercise_id, weight, reps')
    .eq('user_id', USER_ID())
    .gte('date', from)
    .lte('date', today);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!setsData || setsData.length === 0) return Response.json({ from, to: today, weeks, volume: {} });

  const exerciseIds = [...new Set(setsData.map(s => s.exercise_id as string))];
  const { data: exData } = await sb()
    .from('exercises')
    .select('id, primary_muscle, secondary_muscles')
    .in('id', exerciseIds)
    .eq('user_id', USER_ID());

  const exMap = new Map((exData ?? []).map(r => [
    r.id as string,
    { primaryMuscle: r.primary_muscle as string, secondaryMuscles: (r.secondary_muscles as string[]) ?? [] },
  ]));

  const volume: Record<string, { sets: number; tonnage: number }> = {};
  for (const row of setsData) {
    const ex = exMap.get(row.exercise_id as string);
    if (!ex) continue;
    const tonnage = Number(row.weight) * (row.reps as number);
    const add = (m: string, frac: number) => {
      if (!volume[m]) volume[m] = { sets: 0, tonnage: 0 };
      volume[m].sets += frac;
      volume[m].tonnage += tonnage * frac;
    };
    add(ex.primaryMuscle, 1.0);
    for (const m of ex.secondaryMuscles) add(m, 0.5);
  }
  for (const m of Object.keys(volume)) {
    volume[m].sets = Math.round(volume[m].sets * 10) / 10;
    volume[m].tonnage = Math.round(volume[m].tonnage);
  }

  return Response.json({ from, to: today, weeks, volume });
}
