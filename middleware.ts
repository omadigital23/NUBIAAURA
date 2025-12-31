import { NextRequest, NextResponse } from 'next/server';

const locales = ['fr', 'en'];
const defaultLocale = 'fr';

// Payment gateway configuration by country - PayDunya for UEMOA
const COUNTRY_GATEWAY_CONFIG: Record<string, { gateway: string; currency: string }> = {
  MA: { gateway: 'airwallex', currency: 'MAD' },   // Morocco
  SN: { gateway: 'paydunya', currency: 'XOF' },   // Senegal
};
const DEFAULT_GATEWAY_CONFIG = { gateway: 'paydunya', currency: 'USD' }; // International (PayDunya Card)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname starts with a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale, redirect to default locale
  if (!pathnameHasLocale) {
    // Redirect to /fr by default
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
  }

  // Redirect old category URLs to new ones
  if (pathname.includes('/catalogue/robes-soiree')) {
    const newPathname = pathname.replace('/catalogue/robes-soiree', '/catalogue/robes-ceremonie');
    return NextResponse.redirect(new URL(newPathname, request.url));
  }

  // Protected routes (client only - checkout now allows guests)
  const protectedRoutes = ['/client', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.includes(route)
  );

  if (isProtectedRoute) {
    // Admin routes - check for admin token in header (will be checked client-side)
    if (pathname.includes('/admin')) {
      // Admin protection is handled client-side in the component
      // Middleware allows access, component redirects if not authenticated
      return NextResponse.next();
    }

    // Client routes - check for Supabase auth token
    if (pathname.includes('/client')) {
      const token = request.cookies.get('sb-auth-token')?.value;

      if (!token) {
        // Redirect to login
        const loginUrl = new URL(`/${defaultLocale}/auth/login`, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // Payment gateway auto-detection based on Geo-IP
  // Vercel provides request.geo automatically
  const response = NextResponse.next();

  // Only set cookies if not already set (don't override user preference)
  if (!request.cookies.get('preferred_gateway')) {
    // Get country from Vercel Geo headers (available on Vercel Edge)
    // Fallback to x-vercel-ip-country or default to 'OTHER'
    const geoHeader = request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') || // Cloudflare
      'OTHER';
    const countryCode = geoHeader.toUpperCase();
    const config = COUNTRY_GATEWAY_CONFIG[countryCode] || DEFAULT_GATEWAY_CONFIG;

    response.cookies.set('preferred_gateway', config.gateway, {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax',
    });
    response.cookies.set('currency', config.currency, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    });
    response.cookies.set('detected_country', countryCode, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files, API routes, and verification files
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|google[a-z0-9]*.html|images/).*)',
  ],
};
