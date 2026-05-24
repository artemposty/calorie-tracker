import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let login and auth API routes through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const auth = req.cookies.get('auth')?.value;
  if (auth !== process.env.SITE_PASSWORD) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|icons|manifest\\.json|sw\\.js|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
};
