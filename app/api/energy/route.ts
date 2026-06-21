import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate, shiftDateBy } from '@/lib/api-auth';
import { calcWorkoutKcal, calcExpenditure, calcDeficit, ENERGY_CONFIG } from '@/lib/energy';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get('days') ?? 30), 1), 365);

  const today = getTodayDate();
  const from  = shiftDateBy(today, -(days - 1));

  const [entriesRes, setsRes, weightsRes, goalsRes] = await Promise.all([
    sb().from('nutrition_entries').select('date, kcal').eq('user_id', USER_ID()).gte('date', from).lte('date', today),
    sb().from('workout_sets').select('date, weight, reps').eq('user_id', USER_ID()).gte('date', from).lte('date', today),
    sb().from('weight_entries').select('date, weight').eq('user_id', USER_ID()).gte('date', from).lte('date', today).order('date', { ascending: true }),
    sb().from('user_goals').select('base_tdee').eq('user_id', USER_ID()).single(),
  ]);

  const baseTdee: number = (goalsRes.data as Record<string, unknown> | null)?.base_tdee as number ?? ENERGY_CONFIG.DEFAULT_BASE_TDEE;

  const kcalByDate: Record<string, number> = {};
  for (const r of entriesRes.data ?? []) kcalByDate[r.date] = (kcalByDate[r.date] ?? 0) + Number(r.kcal);

  const tonnageByDate: Record<string, number> = {};
  for (const r of setsRes.data ?? []) {
    const d = r.date as string;
    tonnageByDate[d] = (tonnageByDate[d] ?? 0) + Number(r.weight) * (r.reps as number);
  }

  const weightByDate: Record<string, number> = {};
  for (const r of weightsRes.data ?? []) weightByDate[r.date] = Number(r.weight);

  const daysList = [];
  for (let i = 0; i < days; i++) {
    const date = shiftDateBy(from, i);
    const eaten = Math.round(kcalByDate[date] ?? 0);
    const tonnage = Math.round(tonnageByDate[date] ?? 0);
    const workoutKcal = calcWorkoutKcal(tonnage);
    const dayExpenditure = calcExpenditure(baseTdee, workoutKcal);
    daysList.push({
      date,
      eaten,
      had_workout: tonnage > 0,
      workout_kcal: workoutKcal,
      day_expenditure: dayExpenditure,
      deficit: eaten > 0 ? calcDeficit(dayExpenditure, eaten) : null,
      weight: weightByDate[date] ?? null,
    });
  }

  const daysWithData = daysList.filter(d => d.eaten > 0);
  const deficitDays  = daysWithData.filter(d => d.deficit !== null).map(d => d.deficit as number);
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  // Reverse TDEE calibration (if we have weight data covering the period)
  const weights = (weightsRes.data ?? []).map(r => ({ date: r.date, w: Number(r.weight) }));
  let calibration = null;
  if (weights.length >= 2 && daysWithData.length >= 14) {
    const weightChange = weights[weights.length - 1].w - weights[0].w;
    const avgEaten = avg(daysWithData.map(d => d.eaten)) ?? 0;
    const realTdee = Math.round(avgEaten + (weightChange * 7700) / daysWithData.length);
    calibration = {
      days_with_data: daysWithData.length,
      avg_eaten: avgEaten,
      weight_change_kg: Math.round(weightChange * 100) / 100,
      real_tdee: realTdee,
      current_base_tdee: baseTdee,
      note: `Обратный расчёт за ${daysWithData.length} дн. трекинга и ${weights.length} взвешиваний`,
    };
  }

  return Response.json({
    base_tdee: baseTdee,
    days: daysList,
    averages: {
      eaten: avg(daysWithData.map(d => d.eaten)),
      workout_kcal: avg(daysWithData.map(d => d.workout_kcal)),
      day_expenditure: avg(daysWithData.map(d => d.day_expenditure)),
      avg_deficit: avg(deficitDays),
      est_fat_loss_kg: deficitDays.length
        ? Math.round(deficitDays.reduce((a, b) => a + b, 0) / 7700 * 100) / 100
        : null,
    },
    calibration,
  });
}
