import { createClient } from '@supabase/supabase-js';

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface EntryInput {
  name?: unknown;
  grams?: unknown;
  p?: unknown;
  f?: unknown;
  c?: unknown;
  date?: unknown;
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token !== process.env.API_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
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
        ? item.date
        : today;
    return {
      id: newId(),
      user_id: process.env.NEXT_PUBLIC_USER_ID!,
      date,
      name: String(item.name ?? 'Продукт'),
      grams: Number(item.grams ?? 0),
      kcal,
      p,
      f,
      c,
    };
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.from('nutrition_entries').insert(rows);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, inserted: rows.length });
}
