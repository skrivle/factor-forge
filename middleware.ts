import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/auth/signin'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Redirect to signin if not authenticated and trying to access protected route
  if (!session && !isPublicPath && pathname !== '/auth/signin') {
    const signInUrl = new URL('/auth/signin', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to home if authenticated and trying to access signin
  if (session && pathname === '/auth/signin') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
};
