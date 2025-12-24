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
 * GET /api/admin/reviews
 * Liste tous les avis produits avec détails
 */
export async function GET(req: NextRequest) {
    if (!verifyAdminAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: reviews, error } = await supabaseAdmin
            .from('product_reviews')
            .select(`
                *,
                products:product_id (
                    id,
                    name_fr,
                    name_en,
                    slug,
                    image_url
                ),
                users:user_id (
                    id,
                    email,
                    full_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ reviews }, { status: 200 });
    } catch (error: any) {
        console.error('Reviews fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/reviews
 * Supprimer un avis
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
            .from('product_reviews')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting review:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Review deletion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
