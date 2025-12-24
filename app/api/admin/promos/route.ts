import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyAdminAuth(req: NextRequest): boolean {
    const header = req.headers.get('authorization') || '';

    // Bearer token
    if (header.startsWith('Bearer ')) {
        const token = header.slice(7);
        const expected = process.env.ADMIN_TOKEN || '';
        if (expected && token === expected) return true;
    }

    // Basic auth
    if (header.startsWith('Basic ')) {
        try {
            const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
            const [u, p] = decoded.split(':');
            const adminUser = process.env.ADMIN_USER || 'nubiaaura';
            const adminPass = process.env.ADMIN_PASS || 'Paty2025!';
            if (u === adminUser && p === adminPass) return true;
        } catch { }
    }

    return false;
}

/**
 * GET /api/admin/promos
 * Liste tous les codes promo
 */
export async function GET(req: NextRequest) {
    if (!verifyAdminAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: promoCodes, error } = await supabaseAdmin
            .from('promo_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching promo codes:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ promoCodes }, { status: 200 });
    } catch (error: any) {
        console.error('Promo codes fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/promos
 * Créer un nouveau code promo
 */
export async function POST(req: NextRequest) {
    if (!verifyAdminAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            code,
            discount_type,
            discount_value,
            min_order_amount = 0,
            max_discount,
            max_uses,
            valid_from,
            valid_until,
            description,
            is_active = true
        } = body;

        if (!code || !discount_type || !discount_value) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('promo_codes')
            .insert({
                code: code.toUpperCase(),
                discount_type,
                discount_value,
                min_order_amount,
                max_discount,
                max_uses,
                valid_from: valid_from || new Date().toISOString(),
                valid_until,
                description,
                is_active,
                current_uses: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating promo code:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ promoCode: data }, { status: 201 });
    } catch (error: any) {
        console.error('Promo code creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/promos
 * Mettre à jour un code promo (toggle actif, modifier)
 */
export async function PATCH(req: NextRequest) {
    if (!verifyAdminAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Clean undefined values
        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        const { data, error } = await supabaseAdmin
            .from('promo_codes')
            .update({ ...cleanData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating promo code:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ promoCode: data }, { status: 200 });
    } catch (error: any) {
        console.error('Promo code update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/promos
 * Supprimer un code promo
 */
export async function DELETE(req: NextRequest) {
    if (!verifyAdminAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('promo_codes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting promo code:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Promo code deletion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
