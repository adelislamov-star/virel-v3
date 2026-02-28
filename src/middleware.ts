import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  if (!isAdminPage) return NextResponse.next();

  const token = request.cookies.get('virel-token')?.value;

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
