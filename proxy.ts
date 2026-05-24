import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes have their own Bearer token auth — skip cookie check
  if (pathname.startsWith('/api/') || pathname.startsWith('/login')) {
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
