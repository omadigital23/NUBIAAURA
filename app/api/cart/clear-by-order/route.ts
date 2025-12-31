import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Clear cart by order ID
 * This endpoint is used when the user session might be expired after payment redirect.
 * It finds the user_id from the order and clears their cart.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get the order to find the user_id
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('user_id, payment_status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.log('[Clear Cart By Order] Order not found:', orderId);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Only clear cart if payment was successful
        if (order.payment_status !== 'completed') {
            console.log('[Clear Cart By Order] Payment not completed, skipping cart clear');
            return NextResponse.json({ success: false, message: 'Payment not completed' });
        }

        // If no user_id (guest checkout), nothing to clear
        if (!order.user_id) {
            console.log('[Clear Cart By Order] Guest order, no cart to clear');
            return NextResponse.json({ success: true, message: 'Guest order, no cart' });
        }

        // Get the user's cart
        const { data: cart, error: cartError } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', order.user_id)
            .single();

        if (cartError && cartError.code !== 'PGRST116') {
            console.error('[Clear Cart By Order] Cart error:', cartError);
            return NextResponse.json({ error: cartError.message }, { status: 500 });
        }

        if (!cart) {
            console.log('[Clear Cart By Order] No cart found for user');
            return NextResponse.json({ success: true, message: 'Cart already empty' });
        }

        // Delete all cart items
        const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cart.id);

        if (deleteError) {
            console.error('[Clear Cart By Order] Delete error:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        console.log('[Clear Cart By Order] Cart cleared for user:', order.user_id);
        return NextResponse.json({ success: true, message: 'Cart cleared successfully' });

    } catch (error) {
        console.error('[Clear Cart By Order] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
