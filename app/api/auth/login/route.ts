import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { password } = await request.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || password !== sitePassword) {
    return Response.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('auth', sitePassword, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });

  return Response.json({ ok: true });
}
