import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname.startsWith('/admin');
  const isApiAuth = pathname.startsWith('/api/auth/');
  const isApiV1 = pathname.startsWith('/api/v1/');

  const token = request.cookies.get('vaurel-token')?.value;

  // Admin pages: redirect to login if no token
  if (isAdminPage) {
    if (!token && !isLoginPage) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (token && isLoginPage) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // API v1 routes: reject if no token (auth routes are excluded)
  if (isApiV1 && !isApiAuth && !token) {
    console.error('[middleware] No vaurel-token cookie for:', pathname);
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No auth token. Please log in.' } },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/v1/:path*'],
};
