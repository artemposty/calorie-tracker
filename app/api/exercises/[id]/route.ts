import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(request)) return unauthorized();
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (b.name !== undefined) update.name = String(b.name);
  if (b.primaryMuscle !== undefined) update.primary_muscle = String(b.primaryMuscle);
  if (b.secondaryMuscles !== undefined) update.secondary_muscles = b.secondaryMuscles;
  if (b.equipment !== undefined) update.equipment = String(b.equipment);
  if (b.notes !== undefined) update.notes = b.notes;
  if (b.displayOrder !== undefined) update.display_order = Number(b.displayOrder);

  const { error } = await sb()
    .from('exercises')
    .update(update)
    .eq('id', id)
    .eq('user_id', USER_ID());

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(request)) return unauthorized();
  const { id } = await params;

  const { error } = await sb()
    .from('exercises')
    .delete()
    .eq('id', id)
    .eq('user_id', USER_ID())
    .eq('is_system', false);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
