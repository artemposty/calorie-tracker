import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate, shiftDateBy } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

// Epley formula: e1RM = weight × (1 + reps/30)
function epley(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// Returns best e1RM per session date for a given exercise over last N days.
export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get('exercise_id');
  if (!exerciseId) return Response.json({ error: 'exercise_id required' }, { status: 400 });

  const days = Math.min(Math.max(Number(searchParams.get('days') ?? 90), 1), 365);
  const today = getTodayDate();
  const from = shiftDateBy(today, -(days - 1));

  const { data, error } = await sb()
    .from('workout_sets')
    .select('date, weight, reps')
    .eq('user_id', USER_ID())
    .eq('exercise_id', exerciseId)
    .gte('date', from)
    .lte('date', today)
    .order('date', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Best e1RM per date
  const byDate: Record<string, { e1rm: number; bestWeight: number; bestReps: number }> = {};

  for (const row of data ?? []) {
    const e1rm = epley(Number(row.weight), row.reps);
    if (!byDate[row.date] || e1rm > byDate[row.date].e1rm) {
      byDate[row.date] = { e1rm, bestWeight: Number(row.weight), bestReps: row.reps };
    }
  }

  const points = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const allTime = points.length > 0 ? Math.max(...points.map(p => p.e1rm)) : 0;

  return Response.json({ exerciseId, days, points, allTimePr: allTime });
}
