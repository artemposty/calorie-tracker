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

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const today = getTodayDate();
  const from = searchParams.get('from') ?? shiftDateBy(today, -29);
  const to = searchParams.get('to') ?? today;

  const { data, error } = await supabaseClient()
    .from('weight_entries')
    .select('date, weight')
    .eq('user_id', USER_ID())
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });

  if (error) {
    console.error('[GET /api/weight]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ entries: data ?? [] });
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  let body: { weight?: unknown; date?: unknown };
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const weight = Number(body.weight);
  if (!weight || weight < 20 || weight > 300) {
    return Response.json({ error: 'Invalid weight (expected kg, 20–300)' }, { status: 400 });
  }

  const date =
    typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : getTodayDate();

  const supabase = supabaseClient();

  // Check if entry for this date exists (upsert by date)
  const { data: existing } = await supabase
    .from('weight_entries')
    .select('id')
    .eq('user_id', USER_ID())
    .eq('date', date)
    .single();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from('weight_entries')
      .update({ weight })
      .eq('id', existing.id));
  } else {
    ({ error } = await supabase
      .from('weight_entries')
      .insert({ id: newId(), user_id: USER_ID(), date, weight }));
  }

  if (error) {
    console.error('[POST /api/weight]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.log(`[POST /api/weight] saved ${weight}kg for ${date}`);
  return Response.json({ success: true, date, weight });
}
