import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized } from '@/lib/api-auth';
import { ENERGY_CONFIG } from '@/lib/energy';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const value = Number((body as Record<string, unknown>)?.base_tdee);
  if (isNaN(value) || value < 1000 || value > 6000) {
    return Response.json({ error: 'base_tdee must be between 1000 and 6000 kcal' }, { status: 400 });
  }

  const { error } = await sb()
    .from('user_goals')
    .update({ base_tdee: value, updated_at: new Date().toISOString() })
    .eq('user_id', USER_ID());

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    success: true,
    base_tdee: value,
    note: `Base TDEE updated to ${value} kcal/day (default was ${ENERGY_CONFIG.DEFAULT_BASE_TDEE})`,
  });
}
