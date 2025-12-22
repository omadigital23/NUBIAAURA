import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/stats
 * Récupère les statistiques avancées pour le dashboard admin
 * - Stock total
 * - Commandes par statut
 * - Taux de conversion
 * - Produits en rupture
 * - Revenus par statut de paiement
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Récupérer toutes les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status, payment_status, created_at, user_id');

    if (ordersError) {
      throw ordersError;
    }

    // Récupérer tous les produits avec stock ET leurs variantes
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name_fr, name_en, stock, price, product_variants(stock)');

    if (productsError) {
      throw productsError;
    }

    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at');

    if (usersError) {
      throw usersError;
    }

    // Calculer les statistiques
    const ordersList = orders || [];
    const productsList = products || [];
    const usersList = users || [];

    // Stock total - utiliser product_variants si disponible, sinon products.stock
    const totalStock = productsList.reduce((sum, p: any) => {
      const hasVariants = Array.isArray(p.product_variants) && p.product_variants.length > 0;
      const variantStock = hasVariants
        ? p.product_variants.reduce((vs: number, v: any) => vs + (v?.stock || 0), 0)
        : 0;
      const productStock = p.stock || 0;
      return sum + (hasVariants ? variantStock : productStock);
    }, 0);

    // Valeur du stock
    const stockValue = productsList.reduce((sum, p: any) => {
      const hasVariants = Array.isArray(p.product_variants) && p.product_variants.length > 0;
      const variantStock = hasVariants
        ? p.product_variants.reduce((vs: number, v: any) => vs + (v?.stock || 0), 0)
        : 0;
      const productStock = p.stock || 0;
      const stock = hasVariants ? variantStock : productStock;
      return sum + (stock * (p.price || 0));
    }, 0);

    // Commandes par statut
    const ordersByStatus = {
      pending: ordersList.filter(o => o.status === 'pending').length,
      processing: ordersList.filter(o => o.status === 'processing').length,
      shipped: ordersList.filter(o => o.status === 'shipped').length,
      delivered: ordersList.filter(o => o.status === 'delivered').length,
      cancelled: ordersList.filter(o => o.status === 'cancelled').length,
    };

    // Revenus par statut de paiement
    const revenueByPaymentStatus = {
      pending: ordersList
        .filter(o => o.payment_status === 'pending')
        .reduce((sum, o) => sum + (o.total || 0), 0),
      paid: ordersList
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0),
      failed: ordersList
        .filter(o => o.payment_status === 'failed')
        .reduce((sum, o) => sum + (o.total || 0), 0),
    };

    // Produits en rupture et faible stock (en tenant compte des variantes)
    const getProductStock = (p: any) => {
      const hasVariants = Array.isArray(p.product_variants) && p.product_variants.length > 0;
      if (hasVariants) {
        return p.product_variants.reduce((vs: number, v: any) => vs + (v?.stock || 0), 0);
      }
      return p.stock || 0;
    };

    const outOfStockProducts = productsList.filter((p: any) => getProductStock(p) === 0).length;
    const lowStockProducts = productsList.filter((p: any) => {
      const stock = getProductStock(p);
      return stock > 0 && stock <= 5;
    }).length;

    // Taux de conversion (utilisateurs qui ont commandé / total utilisateurs)
    const usersWithOrders = new Set(ordersList.map(o => o.user_id)).size;
    const conversionRate = usersList.length > 0
      ? ((usersWithOrders / usersList.length) * 100).toFixed(2)
      : '0.00';

    // Commandes livrées à temps (estimation basée sur delivered_at)
    const deliveredOrders = ordersList.filter(o => o.status === 'delivered').length;
    const onTimeDeliveries = deliveredOrders; // Simplifié pour cette version

    // Revenu total = uniquement les commandes payées ou livrées
    // (ne pas compter les commandes pending, cancelled, ou failed)
    const paidOrDeliveredOrders = ordersList.filter(
      o => o.payment_status === 'paid' || o.status === 'delivered'
    );
    const totalRevenue = paidOrDeliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Revenu moyen par commande (basé sur les commandes payées/livrées)
    const averageOrderValue = paidOrDeliveredOrders.length > 0
      ? (totalRevenue / paidOrDeliveredOrders.length).toFixed(2)
      : '0.00';

    // Clients actifs (avec commandes dans les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeCustomers = new Set(
      ordersList
        .filter(o => new Date(o.created_at) > thirtyDaysAgo)
        .map(o => o.user_id)
    ).size;

    return NextResponse.json(
      {
        success: true,
        stats: {
          stock: {
            total: totalStock,
            value: stockValue,
            outOfStock: outOfStockProducts,
            lowStock: lowStockProducts,
          },
          orders: {
            byStatus: ordersByStatus,
            total: ordersList.length,
            delivered: deliveredOrders,
            onTimeDeliveries,
          },
          revenue: {
            total: totalRevenue,
            byPaymentStatus: revenueByPaymentStatus,
            averageOrderValue: parseFloat(averageOrderValue),
          },
          customers: {
            total: usersList.length,
            withOrders: usersWithOrders,
            active: activeCustomers,
            conversionRate: parseFloat(conversionRate),
          },
          products: {
            total: productsList.length,
            outOfStock: outOfStockProducts,
            lowStock: lowStockProducts,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
