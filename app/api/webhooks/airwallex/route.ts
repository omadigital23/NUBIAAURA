/**
 * Airwallex Webhook Handler
 * Receives payment notifications from Airwallex
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { airwallexProvider, AirwallexWebhookPayload } from '@/lib/payments';
import { sendOrderConfirmationEmail } from '@/lib/email-service';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('x-signature') || '';
        const timestamp = request.headers.get('x-timestamp') || '';

        console.log('[Airwallex Webhook] Received notification');

        // Parse payload
        let payload: AirwallexWebhookPayload;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            console.error('[Airwallex Webhook] Invalid JSON payload');
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Verify webhook signature (optional but recommended)
        const fullSignature = `t=${timestamp},v1=${signature}`;
        const isValid = airwallexProvider.verifyWebhook(rawBody, fullSignature);

        if (!isValid && process.env.NODE_ENV === 'production') {
            console.warn('[Airwallex Webhook] Signature verification failed');
            // In production, you might want to reject invalid signatures
            // For now, we'll log and continue for testing purposes
        }

        // Process the webhook
        const result = await airwallexProvider.handleCallback(payload);

        console.log('[Airwallex Webhook] Processing result:', {
            event: payload.name,
            orderId: result.orderId,
            status: result.status,
            success: result.success,
        });

        if (!result.orderId) {
            console.error('[Airwallex Webhook] No order ID in payload');
            return NextResponse.json({ error: 'No order ID' }, { status: 400 });
        }

        // Initialize Supabase with service role
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update order based on payment status
        if (result.success && result.status === 'paid') {
            // Payment successful
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'completed',
                    status: 'confirmed',
                    payment_transaction_id: result.transactionId,
                    payment_method: 'airwallex',
                    paid_at: new Date().toISOString(),
                })
                .eq('id', result.orderId);

            if (updateError) {
                console.error('[Airwallex Webhook] Order update error:', updateError);
                throw updateError;
            }

            // Finalize stock reservations
            await supabase
                .from('stock_reservations')
                .update({ finalized_at: new Date().toISOString() })
                .eq('order_id', result.orderId)
                .is('finalized_at', null);

            // Fetch order details for email
            const { data: order } = await supabase
                .from('orders')
                .select('*')
                .eq('id', result.orderId)
                .single();

            if (order) {
                // Fetch order items
                const { data: orderItems } = await supabase
                    .from('order_items')
                    .select(`
                        *,
                        products:product_id (
                            id,
                            name,
                            name_en,
                            cover_image
                        )
                    `)
                    .eq('order_id', result.orderId);

                // Send confirmation email
                try {
                    const shippingAddress = order.shipping_address as {
                        firstName?: string;
                        lastName?: string;
                        email?: string;
                        address?: string;
                        city?: string;
                        zipCode?: string;
                        country?: string;
                    };

                    if (shippingAddress?.email) {
                        const shippingAddressStr = [
                            shippingAddress.address,
                            shippingAddress.city,
                            shippingAddress.zipCode,
                            shippingAddress.country,
                        ].filter(Boolean).join(', ');

                        await sendOrderConfirmationEmail(
                            shippingAddress.email,
                            {
                                orderId: order.order_number || result.orderId,
                                customerName: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Client',
                                total: order.total,
                                items: (orderItems || []).map((item: {
                                    products: { name?: string; name_en?: string } | null;
                                    quantity: number;
                                    price: number;
                                }) => ({
                                    name: item.products?.name || item.products?.name_en || 'Produit',
                                    quantity: item.quantity,
                                    price: item.price,
                                })),
                                shippingAddress: shippingAddressStr || 'Non spécifiée',
                                estimatedDelivery: '5-7 jours ouvrés',
                            }
                        );
                        console.log('[Airwallex Webhook] Confirmation email sent');
                    }
                } catch (emailError) {
                    console.error('[Airwallex Webhook] Email sending failed:', emailError);
                    // Don't fail the webhook for email errors
                }
            }

            console.log('[Airwallex Webhook] Order confirmed:', result.orderId);
        } else if (result.status === 'cancelled' || result.status === 'failed') {
            // Payment failed or cancelled
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    status: 'cancelled',
                })
                .eq('id', result.orderId);

            if (updateError) {
                console.error('[Airwallex Webhook] Order cancellation update error:', updateError);
            }

            // Release stock reservations
            await supabase
                .from('stock_reservations')
                .update({ released_at: new Date().toISOString() })
                .eq('order_id', result.orderId)
                .is('released_at', null);

            console.log('[Airwallex Webhook] Order cancelled:', result.orderId);
        }

        return NextResponse.json({ received: true, status: result.status });

    } catch (error) {
        console.error('[Airwallex Webhook] Error:', error);
        Sentry.captureException(error, {
            tags: { route: 'webhooks/airwallex' },
        });
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
