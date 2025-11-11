import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignUpSchema } from '@/lib/validation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = SignUpSchema.parse({
      email: body.email,
      password: body.password,
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

    // Create user profile with firstName and lastName
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: validated.email,
        first_name: body.firstName || '',
        last_name: body.lastName || '',
        full_name: `${body.firstName || ''} ${body.lastName || ''}`.trim(),
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
  } catch (error: any) {
    console.error('Signup error:', error);

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
