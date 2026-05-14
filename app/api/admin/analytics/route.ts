import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/analytics
 * Returns chart-ready data for the admin dashboard:
 * - 30-day revenue time series
 * - Top 5 products by revenue
 * - Order status distribution
 * - KPI deltas (current vs previous month)
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

    // ── Fetch all orders with items ─────────────────────────────────
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status, payment_status, created_at, order_items(product_id, quantity, price, products(name_fr, name_en))');

    if (ordersError) throw ordersError;

    const allOrders = orders || [];
    const now = new Date();

    // ── 1. Revenue Time Series (last 30 days) ──────────────────────
    const revenueByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      revenueByDay[key] = 0;
    }

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const order of allOrders) {
      const orderDate = new Date(order.created_at);
      if (orderDate >= thirtyDaysAgo && (order.payment_status === 'paid' || order.status === 'delivered')) {
        const key = orderDate.toISOString().slice(0, 10);
        if (key in revenueByDay) {
          revenueByDay[key] += Number(order.total) || 0;
        }
      }
    }

    const revenueTimeSeries = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      label: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      revenue: Math.round(revenue),
    }));

    // ── 2. Top 5 Products by Revenue ────────────────────────────────
    const productRevenue: Record<string, { name: string; revenue: number; quantity: number }> = {};

    for (const order of allOrders) {
      if (order.payment_status !== 'paid' && order.status !== 'delivered') continue;
      const items = (order as any).order_items || [];
      for (const item of items) {
        const productId = item.product_id;
        const name = item.products?.name_fr || item.products?.name_en || 'Produit inconnu';
        const itemRevenue = (Number(item.price) || 0) * (item.quantity || 1);
        if (!productRevenue[productId]) {
          productRevenue[productId] = { name, revenue: 0, quantity: 0 };
        }
        productRevenue[productId].revenue += itemRevenue;
        productRevenue[productId].quantity += item.quantity || 1;
      }
    }

    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
        revenue: Math.round(p.revenue),
        quantity: p.quantity,
      }));

    // ── 3. Order Status Distribution ────────────────────────────────
    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of allOrders) {
      const st = order.status || 'pending';
      if (st in statusCounts) {
        statusCounts[st]++;
      }
    }

    const statusDistribution = Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        label: statusLabel(status),
        count,
        color: statusColor(status),
      }));

    // ── 4. KPI Deltas (current month vs previous month) ─────────────
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthOrders = allOrders.filter((o) => new Date(o.created_at) >= currentMonthStart);
    const previousMonthOrders = allOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= previousMonthStart && d < currentMonthStart;
    });

    const currentRevenue = currentMonthOrders
      .filter((o) => o.payment_status === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const previousRevenue = previousMonthOrders
      .filter((o) => o.payment_status === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const revenueDelta = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    const ordersDelta = previousMonthOrders.length > 0
      ? Math.round(((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100)
      : currentMonthOrders.length > 0 ? 100 : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        revenueTimeSeries,
        topProducts,
        statusDistribution,
        kpiDeltas: {
          revenue: { current: Math.round(currentRevenue), previous: Math.round(previousRevenue), delta: revenueDelta },
          orders: { current: currentMonthOrders.length, previous: previousMonthOrders.length, delta: ordersDelta },
        },
      },
    });
  } catch (error: any) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function statusLabel(s: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };
  return labels[s] || s;
}

function statusColor(s: string): string {
  const colors: Record<string, string> = {
    pending: '#EAB308',
    processing: '#3B82F6',
    shipped: '#8B5CF6',
    delivered: '#22C55E',
    cancelled: '#EF4444',
  };
  return colors[s] || '#6B7280';
}
