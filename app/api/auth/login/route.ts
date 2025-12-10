import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple email sanitization
function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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

// Simple in-memory rate limiting (5 attempts per minute per IP)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  // Clean up old entries
  if (attempt && now > attempt.resetTime) {
    loginAttempts.delete(identifier);
  }

  const current = loginAttempts.get(identifier);

  if (!current) {
    // First attempt
    loginAttempts.set(identifier, { count: 1, resetTime: now + 60000 }); // 1 minute
    return { allowed: true };
  }

  if (current.count >= 5) {
    // Too many attempts
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  current.count++;
  return { allowed: true };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Auth] Login request received');

    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      console.warn('[Auth] Rate limit exceeded for IP:', clientIP);
      return NextResponse.json(
        {
          error: 'Trop de tentatives. Veuillez réessayer dans quelques instants.',
          retryAfter: rateLimit.retryAfter
        },
        { status: 429 }
      );
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

    console.log('[Auth] Input validated:', { email });

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
      email: email,
      password: password,
    });

    if (error) {
      console.warn('[Auth] Failed login attempt for:', email);
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Success - reset rate limit for this IP
    loginAttempts.delete(clientIP);

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

    // Set cookie
    if (data.session) {
      response.cookies.set('sb-auth-token', data.session.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      console.log('[Auth] Login successful for:', data.user.email);
    }

    return response;

  } catch (error: any) {
    console.error('[Auth] Error:', error.message);

    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
