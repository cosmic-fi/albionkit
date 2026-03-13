import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

// List of supported locales
const locales = ['en', 'de', 'es', 'fr', 'ko', 'pl', 'pt', 'ru', 'tr', 'zh'];
const defaultLocale = 'en';

// Get locale from Accept-Language header
function getLocaleFromHeader(request: NextRequest): string | null {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return null;

  // Parse accept-language header (e.g., "en-US,en;q=0.9,tr;q=0.8")
  const languages = acceptLanguage.split(',').map(lang => {
    const [locale, quality = 'q=1'] = lang.trim().split(';');
    return {
      locale: locale.split('-')[0], // Get base locale (en from en-US)
      quality: parseFloat(quality.split('=')[1]) || 1
    };
  });

  // Find best match
  const matched = languages
    .filter(({ locale }) => locales.includes(locale))
    .sort((a, b) => b.quality - a.quality)[0];

  return matched?.locale || null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public files
  if (PUBLIC_FILE.test(pathname)) return;

  // Skip API routes
  if (pathname.startsWith('/api')) return;

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

  if (pathnameHasLocale) {
    // Locale already in URL - update cookie for client-side usage
    const locale = locales.find(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) || defaultLocale;
    const response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', locale);
    return response;
  }

  // Redirect to locale-prefixed URL
  let locale = defaultLocale;

  // Try to get locale from cookie first
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    // Try Accept-Language header
    const headerLocale = getLocaleFromHeader(request);
    if (headerLocale) {
      locale = headerLocale;
    }
  }

  // Redirect to locale-prefixed URL
  const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('NEXT_LOCALE', locale);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.webmanifest (PWA manifest)
     * - sw.js (service worker)
     * - sitemap.xml, robots.txt (SEO files)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|sitemap.xml|robots.txt).*)',
  ],
};
