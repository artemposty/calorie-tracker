import { createClient } from '@supabase/supabase-js';
import { checkAuth, unauthorized } from '@/lib/api-auth';

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
const USER_ID = () => process.env.NEXT_PUBLIC_USER_ID!;

// GET  — dry-run: show what would change
// POST — apply the migration (multiply stored per-100g values by grams/100)
async function getRows() {
  return supabaseClient()
    .from('nutrition_entries')
    .select('id, name, date, grams, p, f, c, kcal')
    .eq('user_id', USER_ID())
    .gt('grams', 0)
    .order('date', { ascending: true });
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();
  const { data, error } = await getRows();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const preview = (data ?? []).map(row => {
    const g = Number(row.grams);
    return {
      id: row.id,
      name: row.name,
      date: row.date,
      grams: g,
      before: { p: row.p, f: row.f, c: row.c, kcal: row.kcal },
      after: {
        p:    Math.round(Number(row.p)    * g / 100 * 10) / 10,
        f:    Math.round(Number(row.f)    * g / 100 * 10) / 10,
        c:    Math.round(Number(row.c)    * g / 100 * 10) / 10,
        kcal: Math.round(Number(row.kcal) * g / 100),
      },
    };
  });
  return Response.json({ total: preview.length, preview });
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorized();
  const { data, error } = await getRows();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return Response.json({ updated: 0, failed: 0 });

  const sb = supabaseClient();
  let updated = 0;
  let failed = 0;

  for (const row of data) {
    const g = Number(row.grams);
    const { error: upErr } = await sb
      .from('nutrition_entries')
      .update({
        p:    Math.round(Number(row.p)    * g / 100 * 10) / 10,
        f:    Math.round(Number(row.f)    * g / 100 * 10) / 10,
        c:    Math.round(Number(row.c)    * g / 100 * 10) / 10,
        kcal: Math.round(Number(row.kcal) * g / 100),
      })
      .eq('id', row.id)
      .eq('user_id', USER_ID());

    if (upErr) { failed++; console.error('[fix-macros]', row.id, upErr.message); }
    else updated++;
  }

  return Response.json({ total: data.length, updated, failed });
}
