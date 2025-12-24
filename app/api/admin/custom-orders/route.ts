import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyAdminHeader(req: NextRequest) {
    const header = req.headers.get('authorization') || '';
    const expected = process.env.ADMIN_TOKEN || '';
    if (header.startsWith('Bearer ')) {
        const token = header.slice(7);
        if (expected && token === expected) return true;
    }
    if (header.startsWith('Basic ')) {
        const b64 = header.slice(6);
        try {
            const decoded = Buffer.from(b64, 'base64').toString('utf8');
            const [u, p] = decoded.split(':');
            const adminUser = process.env.ADMIN_USER || 'nubiaaura';
            const adminPass = process.env.ADMIN_PASS || 'Paty2025!';
            if (u === adminUser && p === adminPass) return true;
        } catch { }
    }
    return false;
}

async function verifyAdminSession(req: NextRequest) {
    const supabase = getSupabaseServerClient();
    const token = req.cookies.get('sb-auth-token')?.value;
    if (!token) return false;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return false;

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'admin';
}

/**
 * GET /api/admin/custom-orders
 * Récupère toutes les commandes sur mesure pour l'admin
 */
export async function GET(req: NextRequest) {
    // Vérifier l'authentification admin
    const isAdminHeader = verifyAdminHeader(req);
    const isAdminSession = await verifyAdminSession(req);

    if (!isAdminHeader && !isAdminSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: customOrders, error } = await supabaseAdmin
            .from('custom_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching custom orders:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ customOrders }, { status: 200 });
    } catch (error: any) {
        console.error('Custom orders fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/custom-orders
 * Met à jour le statut d'une commande sur mesure
 */
export async function PATCH(req: NextRequest) {
    // Vérifier l'authentification admin
    const isAdminHeader = verifyAdminHeader(req);
    const isAdminSession = await verifyAdminSession(req);

    if (!isAdminHeader && !isAdminSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, status, notes } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
        }

        const updateData: Record<string, any> = { status };
        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const { data, error } = await supabaseAdmin
            .from('custom_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating custom order:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ customOrder: data }, { status: 200 });
    } catch (error: any) {
        console.error('Custom order update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
