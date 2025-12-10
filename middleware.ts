import { NextRequest, NextResponse } from 'next/server';

const locales = ['fr', 'en'];
const defaultLocale = 'fr';

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files, API routes, and verification files
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|google[a-z0-9]*.html|images/).*)',
  ],
};
