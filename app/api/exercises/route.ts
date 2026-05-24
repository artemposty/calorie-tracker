import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate } from '@/lib/api-auth';

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

  const { data, error } = await sb()
    .from('exercises')
    .select('id, name, primary_muscle, secondary_muscles, equipment, is_custom, is_system, notes, display_order')
    .eq('user_id', USER_ID())
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const exercises = (data ?? []).map(r => ({
    id: r.id,
    name: r.name,
    primaryMuscle: r.primary_muscle,
    secondaryMuscles: r.secondary_muscles ?? [],
    equipment: r.equipment,
    isCustom: r.is_custom,
    isSystem: r.is_system,
    notes: r.notes,
    displayOrder: r.display_order,
  }));

  return Response.json({ exercises });
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (!b.name || !b.primaryMuscle) {
    return Response.json({ error: 'name and primaryMuscle are required' }, { status: 400 });
  }

  const row = {
    id: newId(),
    user_id: USER_ID(),
    name: String(b.name),
    primary_muscle: String(b.primaryMuscle),
    secondary_muscles: Array.isArray(b.secondaryMuscles) ? b.secondaryMuscles : [],
    equipment: b.equipment ? String(b.equipment) : 'other',
    is_custom: true,
    is_system: false,
    notes: b.notes ? String(b.notes) : null,
    display_order: typeof b.displayOrder === 'number' ? b.displayOrder : 999,
    created_at: getTodayDate(),
  };

  const { error } = await sb().from('exercises').insert(row);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    id: row.id,
    name: row.name,
    primaryMuscle: row.primary_muscle,
    secondaryMuscles: row.secondary_muscles,
    equipment: row.equipment,
    isCustom: row.is_custom,
    isSystem: row.is_system,
    notes: row.notes,
    displayOrder: row.display_order,
  });
}
