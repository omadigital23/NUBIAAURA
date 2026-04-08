import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders/export
 * Export orders as CSV (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Get filters from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        total,
        status,
        payment_status,
        payment_method,
        shipping_method,
        shipping_address,
        tracking_number,
        carrier,
        created_at,
        delivered_at,
        shipped_at
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Export error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate CSV
    const headers = [
      'Numéro',
      'Date',
      'Statut',
      'Paiement',
      'Méthode paiement',
      'Total (XOF)',
      'Client',
      'Email',
      'Téléphone',
      'Adresse',
      'Ville',
      'Pays',
      'Livraison',
      'Numéro suivi',
      'Transporteur',
      'Date expédition',
      'Date livraison',
    ];

    interface ShippingAddress {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
    }

    const rows = (orders || []).map((o) => {
      const addr: ShippingAddress = (typeof o.shipping_address === 'object' && o.shipping_address !== null
        ? o.shipping_address
        : {}) as ShippingAddress;

      return [
        o.order_number || '',
        o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : '',
        o.status || '',
        o.payment_status || '',
        o.payment_method || '',
        o.total || 0,
        `${addr.firstName || ''} ${addr.lastName || ''}`.trim(),
        addr.email || '',
        addr.phone || '',
        addr.address || '',
        addr.city || '',
        addr.country || '',
        o.shipping_method || '',
        o.tracking_number || '',
        o.carrier || '',
        o.shipped_at ? new Date(o.shipped_at).toLocaleDateString('fr-FR') : '',
        o.delivered_at ? new Date(o.delivered_at).toLocaleDateString('fr-FR') : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="commandes-nubiaaura-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('Export error:', message);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
