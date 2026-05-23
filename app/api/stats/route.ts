import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate, shiftDateBy } from '@/lib/api-auth';

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get('days') ?? 7), 1), 365);

  const today = getTodayDate();
  const from = shiftDateBy(today, -(days - 1));

  const supabase = supabaseClient();

  const [entriesRes, weightsRes, goalsRes] = await Promise.all([
    supabase
      .from('nutrition_entries')
      .select('date, kcal, p, f, c')
      .eq('user_id', USER_ID())
      .gte('date', from)
      .lte('date', today),
    supabase
      .from('weight_entries')
      .select('date, weight')
      .eq('user_id', USER_ID())
      .gte('date', shiftDateBy(today, -60))   // wider range for trend
      .lte('date', today)
      .order('date', { ascending: true }),
    supabase
      .from('user_goals')
      .select('kcal, protein, fat, carbs')
      .eq('user_id', USER_ID())
      .single(),
  ]);

  if (entriesRes.error) {
    console.error('[GET /api/stats] entries error', entriesRes.error);
    return Response.json({ error: entriesRes.error.message }, { status: 500 });
  }

  const goals = goalsRes.data
    ? { kcal: goalsRes.data.kcal, p: goalsRes.data.protein, f: goalsRes.data.fat, c: goalsRes.data.carbs }
    : { kcal: 2250, p: 175, f: 65, c: 235 };

  // Build per-day map of nutrition
  const nutritionByDate: Record<string, { kcal: number; p: number; f: number; c: number }> = {};
  for (const row of entriesRes.data ?? []) {
    const d = nutritionByDate[row.date] ?? { kcal: 0, p: 0, f: 0, c: 0 };
    d.kcal += Number(row.kcal);
    d.p += Number(row.p);
    d.f += Number(row.f);
    d.c += Number(row.c);
    nutritionByDate[row.date] = d;
  }

  // Weight by date
  const weightByDate: Record<string, number> = {};
  for (const row of weightsRes.data ?? []) {
    weightByDate[row.date] = Number(row.weight);
  }

  // Build day-by-day array
  const daysList = [];
  for (let i = 0; i < days; i++) {
    const date = shiftDateBy(from, i);
    const n = nutritionByDate[date];
    const kcal = n ? Math.round(n.kcal) : 0;
    daysList.push({
      date,
      kcal,
      p: n ? Math.round(n.p * 10) / 10 : 0,
      f: n ? Math.round(n.f * 10) / 10 : 0,
      c: n ? Math.round(n.c * 10) / 10 : 0,
      kcal_pct: goals.kcal > 0 ? Math.round((kcal / goals.kcal) * 100) : 0,
      p_pct: goals.p > 0 && n ? Math.round((n.p / goals.p) * 100) : 0,
      weight: weightByDate[date] ?? null,
    });
  }

  // Averages (only days with data)
  const daysWithData = daysList.filter(d => d.kcal > 0);
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;
  const averages = {
    kcal: avg(daysWithData.map(d => d.kcal)),
    p: avg(daysWithData.map(d => d.p)),
    f: avg(daysWithData.map(d => d.f)),
    c: avg(daysWithData.map(d => d.c)),
  };

  // Weight trend
  const allWeights = (weightsRes.data ?? []).map(r => ({ date: r.date, weight: Number(r.weight) }));
  let weightTrend = null;
  if (allWeights.length >= 2) {
    const start = allWeights[0].weight;
    const current = allWeights[allWeights.length - 1].weight;
    let weeklyAvgDelta = null;
    if (allWeights.length >= 14) {
      const last7 = allWeights.slice(-7).map(e => e.weight);
      const prev7 = allWeights.slice(-14, -7).map(e => e.weight);
      const avgArr = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
      weeklyAvgDelta = Math.round((avgArr(last7) - avgArr(prev7)) * 100) / 100;
    }
    weightTrend = {
      start: Math.round(start * 10) / 10,
      current: Math.round(current * 10) / 10,
      delta: Math.round((current - start) * 10) / 10,
      weekly_avg_delta: weeklyAvgDelta,
    };
  }

  return Response.json({
    goals: { kcal: goals.kcal, p: goals.p, f: goals.f, c: goals.c },
    days: daysList,
    averages,
    weight_trend: weightTrend,
  });
}
