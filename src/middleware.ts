import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname.startsWith('/admin');
  const isApiAuth = pathname.startsWith('/api/auth/');
  const isApiV1 = pathname.startsWith('/api/v1/');
  const isApiAdmin = pathname.startsWith('/api/admin/');

  const token = request.cookies.get('vaurel-token')?.value;

  // Forward pathname to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Admin pages: redirect to login if no token
  if (isAdminPage) {
    if (!token && !isLoginPage) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (token && isLoginPage) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // API v1 + API admin routes: reject if no token (auth routes are excluded)
  if ((isApiV1 || isApiAdmin) && !isApiAuth && !token) {
    console.error('[middleware] No vaurel-token cookie for:', pathname);
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No auth token. Please log in.' } },
      { status: 401 },
    );
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',],
};
