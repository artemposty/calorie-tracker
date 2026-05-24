import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate, shiftDateBy } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const today = getTodayDate();
  const from = searchParams.get('from') ?? shiftDateBy(today, -6);
  const to = searchParams.get('to') ?? today;
  const exerciseId = searchParams.get('exercise_id');

  let query = sb()
    .from('workout_sets')
    .select('id, exercise_id, date, weight, reps, rpe, notes, created_at')
    .eq('user_id', USER_ID())
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (exerciseId) query = query.eq('exercise_id', exerciseId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) return Response.json({ sets: [] });

  // Fetch exercises separately (no FK constraint required)
  const exerciseIds = [...new Set(data.map(s => s.exercise_id as string))];
  const { data: exData } = await sb()
    .from('exercises')
    .select('id, name, primary_muscle, secondary_muscles, equipment, is_custom, is_system, display_order')
    .in('id', exerciseIds)
    .eq('user_id', USER_ID());

  const exMap = new Map((exData ?? []).map(r => [r.id as string, r]));

  const sets = data.map(r => {
    const ex = exMap.get(r.exercise_id as string);
    return {
      id: r.id,
      exerciseId: r.exercise_id,
      date: r.date,
      weight: Number(r.weight),
      reps: r.reps,
      rpe: r.rpe,
      notes: r.notes,
      createdAt: r.created_at,
      exercise: ex ? {
        id: ex.id,
        name: ex.name,
        primaryMuscle: ex.primary_muscle,
        secondaryMuscles: ex.secondary_muscles ?? [],
        equipment: ex.equipment,
        isCustom: ex.is_custom,
        isSystem: ex.is_system,
        displayOrder: ex.display_order,
      } : undefined,
    };
  });

  return Response.json({ sets });
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (!b.exerciseId || b.weight === undefined || !b.reps) {
    return Response.json({ error: 'exerciseId, weight, reps are required' }, { status: 400 });
  }

  const today = getTodayDate();
  const date =
    typeof b.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : today;

  const row = {
    id: newId(),
    user_id: USER_ID(),
    exercise_id: String(b.exerciseId),
    date,
    weight: Number(b.weight),
    reps: Math.round(Number(b.reps)),
    rpe: b.rpe !== undefined ? Math.round(Number(b.rpe)) : null,
    notes: b.notes ? String(b.notes) : null,
  };

  const { error } = await sb().from('workout_sets').insert(row);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ id: row.id, success: true });
}
