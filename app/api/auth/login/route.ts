import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignInSchema } from '@/lib/validation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = SignInSchema.parse(body);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Create response with session token
    const response = NextResponse.json(
      {
        success: true,
        message: 'Connexion réussie',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        token: data.session?.access_token, // Return token for client-side storage
      },
      { status: 200 }
    );

    // Also set session cookie for server-side requests
    if (data.session) {
      response.cookies.set('sb-auth-token', data.session.access_token, {
        httpOnly: false, // Allow JavaScript access
        secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https'),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      console.log('[Auth] Cookie set for user:', data.user.email);
    }

    return response;
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
