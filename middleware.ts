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

  // Protected routes
  const protectedRoutes = ['/client', '/admin', '/checkout'];
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

    // Checkout routes - check for Supabase auth token (MUST be authenticated)
    if (pathname.includes('/checkout')) {
      const token = request.cookies.get('sb-auth-token')?.value;

      if (!token) {
        // Redirect to login with callback URL
        const loginUrl = new URL(`/${defaultLocale}/auth/login`, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
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
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
