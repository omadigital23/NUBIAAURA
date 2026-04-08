import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sanitizeText, sanitizePhone } from '@/lib/sanitize';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UpdateAddressSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().min(8).max(20).optional(),
  address_line1: z.string().min(1).max(255).optional(),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().min(2).max(3).optional(),
  is_default: z.boolean().optional(),
});

function getUserToken(request: NextRequest): string | null {
  const token = request.cookies.get('sb-auth-token')?.value;
  if (token) return token;
  const authHeader = request.headers.get('Authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT — Update an address
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const token = getUserToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Adresse non trouvée' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = UpdateAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Sanitize text fields
    const sanitized: Record<string, unknown> = {};
    if (data.first_name) sanitized.first_name = sanitizeText(data.first_name);
    if (data.last_name) sanitized.last_name = sanitizeText(data.last_name);
    if (data.phone) sanitized.phone = sanitizePhone(data.phone);
    if (data.address_line1) sanitized.address_line1 = sanitizeText(data.address_line1);
    if (data.address_line2 !== undefined) sanitized.address_line2 = data.address_line2 ? sanitizeText(data.address_line2) : null;
    if (data.city) sanitized.city = sanitizeText(data.city);
    if (data.state !== undefined) sanitized.state = data.state ? sanitizeText(data.state) : null;
    if (data.postal_code !== undefined) sanitized.postal_code = data.postal_code;
    if (data.country) sanitized.country = data.country;
    if (data.label) sanitized.label = sanitizeText(data.label);
    if (data.is_default !== undefined) sanitized.is_default = data.is_default;

    // If setting as default, unset others
    if (data.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    sanitized.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('addresses')
      .update(sanitized)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Address update error:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    console.error('Address PUT error:', error);
    Sentry.captureException(error, { tags: { route: 'addresses/[id]/PUT' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — Remove an address
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const token = getUserToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Address delete error:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address DELETE error:', error);
    Sentry.captureException(error, { tags: { route: 'addresses/[id]/DELETE' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH — Set as default address
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const token = getUserToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Unset all defaults
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set this one as default
    const { data: updated, error } = await supabase
      .from('addresses')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Address set default error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Adresse non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    console.error('Address PATCH error:', error);
    Sentry.captureException(error, { tags: { route: 'addresses/[id]/PATCH' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
