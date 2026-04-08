import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authRateLimit, getClientIdentifier, addRateLimitHeaders } from '@/lib/rate-limit-upstash';
import { sanitizeEmail } from '@/lib/sanitize';
import * as Sentry from '@sentry/nextjs';

// Simple validation
function validateLoginInput(email: string, password: string): { valid: boolean; error?: string } {
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Email invalide' };
  }
  if (!password || password.length < 1) {
    return { valid: false, error: 'Mot de passe requis' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (Upstash Redis - distributed)
    let rateLimitHeaders: { limit: number; remaining: number; reset: number } | null = null;

    if (authRateLimit) {
      const identifier = getClientIdentifier(request);
      const { success, limit, remaining, reset } = await authRateLimit.limit(identifier);

      if (!success) {
        console.warn(`[Auth] Rate limit exceeded for ${identifier}`);
        const response = NextResponse.json(
          {
            error: 'Trop de tentatives. Veuillez réessayer dans quelques instants.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          { status: 429 }
        );
        addRateLimitHeaders(response.headers, { limit, remaining, reset });
        return response;
      }

      rateLimitHeaders = { limit, remaining, reset };
    }

    // Parse request body
    const body = await request.json();

    // Sanitize and validate input
    const email = sanitizeEmail(body.email || '');
    const password = body.password || '';

    const validation = validateLoginInput(email, password);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Auth] Supabase configuration missing');
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn('[Auth] Failed login attempt for:', email);
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Connexion réussie',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        token: data.session?.access_token,
      },
      { status: 200 }
    );

    // Add rate limit headers
    if (rateLimitHeaders) {
      addRateLimitHeaders(response.headers, rateLimitHeaders);
    }

    // Set cookie
    if (data.session) {
      response.cookies.set('sb-auth-token', data.session.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return response;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auth] Error:', errorMessage);
    Sentry.captureException(error, { tags: { route: 'auth/login' } });

    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
