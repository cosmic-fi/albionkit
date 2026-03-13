import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files, API routes, and SEO files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  // ONLY redirect www to non-www
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.hostname = 'albionkit.com';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  // Force HTTPS
  if (request.nextUrl.protocol === 'http:' && !host.includes('localhost')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  // NO automatic locale detection - just continue
  // Users can manually change language via language switcher
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)',
  ],
};
