import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

function epley(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
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
  const exerciseId = searchParams.get('exercise_id');
  if (!exerciseId) return Response.json({ error: 'exercise_id required' }, { status: 400 });

  const weeks = Math.min(Math.max(Number(searchParams.get('weeks') ?? 12), 1), 52);
  const today = getTodayDate();
  const from = shiftDays(today, -(weeks * 7) + 1);

  const { data: allHistory, error } = await sb()
    .from('workout_sets')
    .select('date, weight, reps, rpe')
    .eq('user_id', USER_ID())
    .eq('exercise_id', exerciseId)
    .order('date', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!allHistory || allHistory.length === 0) {
    return Response.json({ exercise_id: exerciseId, sessions: [], pr: null, trend_4w: null });
  }

  const byDate: Record<string, { weight: number; reps: number; rpe: number }[]> = {};
  for (const s of allHistory) {
    const date = s.date as string;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push({ weight: Number(s.weight), reps: s.reps as number, rpe: Number(s.rpe ?? 0) });
  }

  let runningPrE1rm = 0;
  let allTimePr: { weight: number; reps: number; date: string; e1rm: number } | null = null;
  const sessions: {
    date: string; top_set: { weight: number; reps: number; rpe: number };
    e1rm: number; total_volume: number; is_pr: boolean;
  }[] = [];

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
        date, top_set: topSet, e1rm,
        total_volume: Math.round(sets.reduce((acc, s) => acc + s.weight * s.reps, 0)),
        is_pr,
      });
    }
  }

  const b4 = shiftDays(today, -28);
  const b8 = shiftDays(today, -56);
  const cur4  = sessions.filter(s => s.date >= b4);
  const prev4 = sessions.filter(s => s.date >= b8 && s.date < b4);
  let trend_4w = null;
  if (cur4.length >= 1 && prev4.length >= 1) {
    const avgCur  = cur4.reduce((s, x) => s + x.e1rm, 0) / cur4.length;
    const avgPrev = prev4.reduce((s, x) => s + x.e1rm, 0) / prev4.length;
    trend_4w = {
      current_avg_e1rm:  Math.round(avgCur  * 10) / 10,
      previous_avg_e1rm: Math.round(avgPrev * 10) / 10,
      delta_pct: Math.round((avgCur - avgPrev) / avgPrev * 1000) / 10,
    };
  }

  return Response.json({ exercise_id: exerciseId, sessions, pr: allTimePr, trend_4w });
}
