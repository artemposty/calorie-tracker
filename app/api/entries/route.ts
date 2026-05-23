import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized, getTodayDate, shiftDateBy } from '@/lib/api-auth';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

interface EntryInput {
  name?: unknown;
  grams?: unknown;
  p?: unknown;
  f?: unknown;
  c?: unknown;
  date?: unknown;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const today = getTodayDate();
  const from = searchParams.get('from') ?? shiftDateBy(today, -6);
  const to = searchParams.get('to') ?? today;

  const { data, error } = await supabaseClient()
    .from('nutrition_entries')
    .select('id, date, name, grams, kcal, p, f, c')
    .eq('user_id', USER_ID())
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });

  if (error) {
    console.error('[GET /api/entries]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ entries: data ?? [] });
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body) || body.length === 0) {
    return Response.json({ error: 'Expected non-empty array' }, { status: 400 });
  }

  const today = getTodayDate();
  const rows = (body as EntryInput[]).map(item => {
    const p = Number(item.p ?? 0);
    const f = Number(item.f ?? 0);
    const c = Number(item.c ?? 0);
    const kcal = Math.round(p * 4 + f * 9 + c * 4);
    const date =
      typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
        ? item.date : today;
    return {
      id: newId(),
      user_id: USER_ID(),
      date,
      name: String(item.name ?? 'Продукт'),
      grams: Number(item.grams ?? 0),
      kcal, p, f, c,
    };
  });

  const { error } = await supabaseClient().from('nutrition_entries').insert(rows);
  if (error) {
    console.error('[POST /api/entries]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.log(`[POST /api/entries] inserted ${rows.length} rows`);
  return Response.json({ success: true, inserted: rows.length });
}
