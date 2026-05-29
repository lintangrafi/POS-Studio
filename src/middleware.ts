import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const PUBLIC_PATHS = ['/login'];
const ADMIN_PATHS = ['/dashboard', '/inventory', '/reports', '/invoices', '/settings'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('session')?.value;
  const session = token ? await decrypt(token) : null;

  // Redirect unauthenticated users to login
  if (!session?.userId && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect authenticated users away from login
  if (session?.userId && PUBLIC_PATHS.includes(pathname)) {
    const target = session.role === 'CASHIER' ? '/pos' : '/dashboard';
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Block cashiers from admin-only pages
  if (session?.role === 'CASHIER' && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/pos', req.url));
  }

  // Block inactive users (check isActive flag would require DB call, handled in auth actions)

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)'],
};
