import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  getDefaultHomeForSession,
  canAccessAdminPath,
} from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Lewati static assets, API, dan file publik
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // Halaman login publik
  if (pathname === '/login') {
    if (session && request.nextUrl.searchParams.get('switch') !== '1') {
      return NextResponse.redirect(
        new URL(getDefaultHomeForSession(session), request.url)
      );
    }
    return NextResponse.next();
  }

  // Root '/' -> arahkan ke dashboard sesuai session, atau ke /login jika belum login
  if (pathname === '/') {
    const dest = session ? getDefaultHomeForSession(session) : '/login';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Proteksi seluruh rute /admin/* dan /warga/*
  if (pathname.startsWith('/admin') || pathname.startsWith('/warga')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/admin') && !canAccessAdminPath(session, pathname)) {
      const fallbackUrl = new URL(getDefaultHomeForSession(session), request.url);
      return NextResponse.redirect(fallbackUrl);
    }

    if (pathname.startsWith('/warga') && !session.permissions?.portal_warga) {
      const fallbackUrl = new URL(getDefaultHomeForSession(session), request.url);
      return NextResponse.redirect(fallbackUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
