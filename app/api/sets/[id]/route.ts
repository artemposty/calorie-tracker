import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized } from '@/lib/api-auth';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(request)) return unauthorized();
  const { id } = await params;

  const { error } = await sb()
    .from('workout_sets')
    .delete()
    .eq('id', id)
    .eq('user_id', USER_ID());

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
