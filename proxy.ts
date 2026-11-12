import { NextRequest, NextResponse } from 'next/server';

const locales = ['fr', 'en'];
const defaultLocale = 'fr';

// Payment gateway configuration by country - PayDunya for all
const COUNTRY_GATEWAY_CONFIG: Record<string, { gateway: string; currency: string }> = {
  MA: { gateway: 'paydunya', currency: 'MAD' },   // Morocco
  SN: { gateway: 'paydunya', currency: 'XOF' },   // Senegal
};
const DEFAULT_GATEWAY_CONFIG = { gateway: 'paydunya', currency: 'USD' }; // International (PayDunya Card)


const ORDER_CREATION_PATHS = new Set([
  '/api/checkout/create',
  '/api/custom-orders',
  '/api/orders',
  '/api/orders/cod',
  '/api/payments/initialize',
]);

function maintenanceResponse(request: NextRequest) {
  const language = request.nextUrl.pathname.split('/')[1] === 'en' ? 'en' : 'fr';
  const title = language === 'en' ? 'Temporarily unavailable' : 'Boutique temporairement indisponible';
  const message = language === 'en'
    ? 'Orders are temporarily paused. Please visit us again later.'
    : 'Les commandes sont temporairement suspendues. Merci de revenir plus tard.';
  const brand = 'NUBIA AURA';
  const html = '<!doctype html><html lang="' + language + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + title + ' | ' + brand + '</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#faf8f3;color:#211e18;font-family:Arial,Helvetica,sans-serif;text-align:center}.card{max-width:560px;padding:56px 36px;border:1px solid #e8dfcc;background:#fff;border-radius:8px}.brand{margin:0 0 34px;color:#9b7b31;font-size:14px;font-weight:700;letter-spacing:.24em}h1{margin:0 0 18px;font-family:Georgia,serif;font-size:clamp(28px,6vw,42px);font-weight:400}p{margin:0;color:#625d53;font-size:17px;line-height:1.7}</style></head><body><main class="card"><p class="brand">' + brand + '</p><h1>' + title + '</h1><p>' + message + '</p></main></body></html>';

  return new NextResponse(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Retry-After': '3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const maintenanceEnabled = process.env.MAINTENANCE_MODE === 'true';

  if (pathname.startsWith('/api/')) {
    if (
      maintenanceEnabled &&
      request.method === 'POST' &&
      ORDER_CREATION_PATHS.has(pathname)
    ) {
      return NextResponse.json(
        { error: 'Orders are temporarily paused.' },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Retry-After': '3600',
          },
        }
      );
    }

    return NextResponse.next();
  }

  const isAdminArea = /(^|\/)admin(?:\/|$)/.test(pathname);
  if (maintenanceEnabled && !isAdminArea) {
    return maintenanceResponse(request);
  }
  // Check if pathname starts with a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale, redirect to default locale with PERMANENT redirect for SEO
  if (!pathnameHasLocale) {
    // Skip redirect for root - handled by next.config.js redirects
    if (pathname === '/') {
      return NextResponse.next();
    }
    // 308 Permanent Redirect for SEO (tells Google this is permanent)
    const url = new URL(`/${defaultLocale}${pathname}`, request.url);
    return NextResponse.redirect(url, { status: 308 });
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
    // Match all paths except static files and verification files
    '/((?!_next/static|_next/image|favicon.ico|favicon-48x48.png|apple-touch-icon.png|manifest.json|sw.js|offline.html|robots.txt|sitemap.xml|google[a-z0-9]*.html|images/|icons/).*)',
  ],
};
