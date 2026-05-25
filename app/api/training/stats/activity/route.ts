import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

function shiftDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const months = Math.min(Math.max(Number(searchParams.get('months') ?? 6), 1), 12);

  const today = getTodayDate();
  const [y, m, d] = today.split('-').map(Number);
  const fromDate = new Date(y, m - months, d);
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;

  const { data: setsData, error } = await sb()
    .from('workout_sets')
    .select('date, exercise_id, weight, reps, rpe')
    .eq('user_id', USER_ID())
    .gte('date', from)
    .lte('date', today)
    .order('date', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!setsData || setsData.length === 0) {
    return Response.json({ days: [], month_summary: null });
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
  const { data: exData } = await sb()
    .from('exercises')
    .select('id, primary_muscle')
    .in('id', exerciseIds)
    .eq('user_id', USER_ID());
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

  return Response.json({
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
}
