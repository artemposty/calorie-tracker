import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

// Returns the last logged sets for a given exercise_id, grouped by date.
// Used to show "last time you did X kg × Y reps" hint in AddSetModal.
export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get('exercise_id');
  if (!exerciseId) return Response.json({ error: 'exercise_id required' }, { status: 400 });

  // Get the most recent session date for this exercise
  const { data: dateRow, error: dateErr } = await sb()
    .from('workout_sets')
    .select('date')
    .eq('user_id', USER_ID())
    .eq('exercise_id', exerciseId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (dateErr || !dateRow) return Response.json({ session: null });

  const { data, error } = await sb()
    .from('workout_sets')
    .select('id, weight, reps, rpe, notes')
    .eq('user_id', USER_ID())
    .eq('exercise_id', exerciseId)
    .eq('date', dateRow.date)
    .order('created_at', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    session: {
      date: dateRow.date,
      sets: (data ?? []).map(r => ({
        id: r.id,
        weight: Number(r.weight),
        reps: r.reps,
        rpe: r.rpe,
      })),
    },
  });
}
