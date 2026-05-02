import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Explicitly exempt these public routes from any authentication
  if (
    path === '/api/next-game' || 
    path === '/api/player-statistics' ||
    path === '/cms/nextgameplayeravailability'
  ) {
    return NextResponse.next();
  }

  const isCmsRoute = path.startsWith('/cms');
  const isLoginRoute = path === '/cms/login';

  // Check for the admin session cookie
  const session = request.cookies.get('admin_session');

  if (isCmsRoute && !isLoginRoute && !session) {
    return NextResponse.redirect(new URL('/cms/login', request.url));
  }
  
  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL('/cms', request.url));
  }
}

export const config = {
  matcher: ['/cms/:path*'],
};