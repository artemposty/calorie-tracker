import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized } from '@/lib/api-auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkAuth(request)) return unauthorized();

  const { id } = await params;
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error, count } = await supabase
    .from('nutrition_entries')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', process.env.NEXT_PUBLIC_USER_ID!);

  if (error) {
    console.error('[DELETE /api/entries/:id]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (count === 0) return Response.json({ error: 'Not found' }, { status: 404 });

  console.log(`[DELETE /api/entries/:id] deleted ${id}`);
  return Response.json({ success: true });
}
