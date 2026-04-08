import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sanitizeText, sanitizePhone } from '@/lib/sanitize';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AddressSchema = z.object({
  label: z.string().min(1).max(50).default('Domicile'),
  first_name: z.string().min(1, 'Prénom requis').max(100),
  last_name: z.string().min(1, 'Nom requis').max(100),
  phone: z.string().min(8, 'Téléphone invalide').max(20),
  address_line1: z.string().min(1, 'Adresse requise').max(255),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().min(1, 'Ville requise').max(100),
  state: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().min(2).max(3).default('SN'),
  is_default: z.boolean().default(false),
});

function getUserFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get('sb-auth-token')?.value;
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  }
  return token;
}

// GET — List user's addresses
export async function GET(request: NextRequest) {
  try {
    const token = getUserFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Addresses fetch error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ success: true, addresses: addresses || [] });
  } catch (error) {
    console.error('Addresses GET error:', error);
    Sentry.captureException(error, { tags: { route: 'addresses/GET' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — Create a new address
export async function POST(request: NextRequest) {
  try {
    const token = getUserFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Sanitize text inputs
    const sanitized = {
      ...data,
      first_name: sanitizeText(data.first_name),
      last_name: sanitizeText(data.last_name),
      phone: sanitizePhone(data.phone),
      address_line1: sanitizeText(data.address_line1),
      address_line2: data.address_line2 ? sanitizeText(data.address_line2) : null,
      city: sanitizeText(data.city),
      state: data.state ? sanitizeText(data.state) : null,
      label: sanitizeText(data.label),
    };

    // If this is the default address, unset other defaults
    if (sanitized.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Check address count limit (max 10)
    const { count } = await supabase
      .from('addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count !== null && count >= 10) {
      return NextResponse.json(
        { error: 'Vous avez atteint le nombre maximum d\'adresses (10)' },
        { status: 400 }
      );
    }

    const { data: address, error } = await supabase
      .from('addresses')
      .insert({ ...sanitized, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Address insert error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 });
    }

    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (error) {
    console.error('Addresses POST error:', error);
    Sentry.captureException(error, { tags: { route: 'addresses/POST' } });

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
