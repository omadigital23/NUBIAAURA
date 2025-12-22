import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/users
 * Récupère la liste de tous les utilisateurs avec leurs statistiques
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

        // Récupérer tous les utilisateurs
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, full_name, phone, created_at')
            .order('created_at', { ascending: false });

        if (usersError) {
            throw usersError;
        }

        // Récupérer toutes les commandes pour calculer les stats par utilisateur
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, user_id, total, created_at, status, payment_status');

        if (ordersError) {
            throw ordersError;
        }

        // Calculer les statistiques pour chaque utilisateur
        const usersWithStats = (users || []).map((user) => {
            const userOrders = (orders || []).filter(o => o.user_id === user.id);
            const paidOrDeliveredOrders = userOrders.filter(
                o => o.payment_status === 'paid' || o.status === 'delivered'
            );
            const totalSpent = paidOrDeliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const lastOrder = userOrders[0]; // Orders are already sorted by date

            return {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                created_at: user.created_at,
                orders_count: userOrders.length,
                total_spent: totalSpent,
                last_order_at: lastOrder?.created_at || null,
            };
        });

        return NextResponse.json(
            {
                success: true,
                users: usersWithStats,
                total: usersWithStats.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Admin users error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
