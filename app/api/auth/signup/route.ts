import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignUpSchema } from '@/lib/validation';
import { authRateLimit, getClientIdentifier, addRateLimitHeaders } from '@/lib/rate-limit-upstash';
import { sanitizeEmail, sanitizeText } from '@/lib/sanitize';
import * as Sentry from '@sentry/nextjs';
import { trackSignUp } from '@/lib/analytics-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    if (authRateLimit) {
      const identifier = getClientIdentifier(request);
      const { success, limit, remaining, reset } = await authRateLimit.limit(identifier);

      if (!success) {
        console.warn(`[Signup] Rate limit exceeded for ${identifier}`);

        const response = NextResponse.json(
          {
            error: 'Trop de tentatives d\'inscription. Veuillez réessayer dans quelques instants.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          { status: 429 }
        );

        addRateLimitHeaders(response.headers, { limit, remaining, reset });
        return response;
      }

      const response = await handleSignup(request);
      addRateLimitHeaders(response.headers, { limit, remaining, reset });
      return response;
    }

    return await handleSignup(request);
  } catch (error: any) {
    console.error('Signup error:', error);
    Sentry.captureException(error, {
      tags: { route: 'auth/signup' },
    });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}

async function handleSignup(request: NextRequest) {
  const body = await request.json();

  // Sanitize inputs
  const sanitizedBody = {
    ...body,
    email: sanitizeEmail(body.email),
    firstName: sanitizeText(body.firstName || ''),
    lastName: sanitizeText(body.lastName || ''),
    phone: sanitizeText(body.phone || ''),
  };

  // Validate input
  const validated = SignUpSchema.parse({
    email: sanitizedBody.email,
    password: body.password, // Don't sanitize password
    confirmPassword: body.password,
  });

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: validated.email,
    password: validated.password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: 400 }
    );
  }

  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: validated.email,
      first_name: sanitizedBody.firstName,
      last_name: sanitizedBody.lastName,
      full_name: `${sanitizedBody.firstName} ${sanitizedBody.lastName}`.trim(),
      phone: sanitizedBody.phone || null,
      role: 'customer',
    });

  if (profileError) {
    // Delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: 'Erreur lors de la création du profil' },
      { status: 400 }
    );
  }

  // Track signup event
  try {
    trackSignUp('email');
  } catch (e) {
    console.error('Analytics tracking error:', e);
  }

  console.log(`[Signup] New user registered: ${validated.email}`);

  return NextResponse.json(
    {
      success: true,
      message: 'Inscription réussie',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    },
    { status: 201 }
  );
}

