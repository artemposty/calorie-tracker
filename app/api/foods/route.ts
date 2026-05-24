import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized } from '@/lib/api-auth';

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { data, error } = await supabaseClient()
    .from('user_foods')
    .select('id, name, kcal, p, f, c, default_grams')
    .eq('user_id', USER_ID())
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ foods: data ?? [] });
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, kcal, p, f, c, default_grams } = body as Record<string, unknown>;
  if (!name || typeof name !== 'string') {
    return Response.json({ error: 'name is required' }, { status: 400 });
  }

  const id = newId();
  const row = {
    id, user_id: USER_ID(),
    name: name.trim(),
    kcal: Number(kcal ?? 0),
    p: Number(p ?? 0),
    f: Number(f ?? 0),
    c: Number(c ?? 0),
    ...(default_grams !== undefined && default_grams !== null
      ? { default_grams: Number(default_grams) }
      : {}),
  };

  const { error } = await supabaseClient().from('user_foods').insert(row);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true, id });
}
