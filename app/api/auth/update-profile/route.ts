import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateProfile(request: NextRequest) {
  try {
    const token = request.cookies.get('sb-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a client with the token to get the user
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get user from token
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    // Update user profile using service role
    const { error } = await supabase
      .from('users')
      .update({
        name: name || '',
        phone: phone || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: 'Profil mis à jour avec succès',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return updateProfile(request);
}

export async function POST(request: NextRequest) {
  return updateProfile(request);
}
