import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('auth', '', { maxAge: 0, path: '/' });
  return Response.json({ ok: true });
}
