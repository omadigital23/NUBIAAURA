/**
 * PayDunya Webhook Handler
 * Receives Instant Payment Notifications (IPN) from PayDunya
 * 
 * PayDunya sends a POST request with payment data when a transaction is completed or cancelled.
 * The hash is verified using SHA-512 of the Master Key.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';
import { paydunyaProvider } from '@/lib/payments';
import { sendOrderConfirmationEmail } from '@/lib/smtp-email';
import { notifyManagerNewOrder } from '@/lib/whatsapp-notifications';

// PayDunya webhook payload interface
interface PaydunyaWebhookData {
    hash: string;
    status: 'pending' | 'completed' | 'cancelled';
    response_code: string;
    response_text: string;
    invoice: {
        token: string;
        total_amount: string | number;
        description: string;
    };
    customer?: {
        name: string;
        phone: string;
        email: string;
    };
    custom_data?: Record<string, string>;
    mode: 'test' | 'live';
    receipt_url?: string;
    fail_reason?: string;
}

export async function POST(request: NextRequest) {
    try {
        // PayDunya sends data as application/x-www-form-urlencoded or JSON
        const contentType = request.headers.get('content-type') || '';
        let webhookData: PaydunyaWebhookData;

        // Read body as text first (can only read once)
        const bodyText = await request.text();
        console.log('[PayDunya Webhook] Raw body received:', bodyText.substring(0, 200));

        if (contentType.includes('application/json')) {
            const body = JSON.parse(bodyText);
            // PayDunya wraps data in a 'data' key
            webhookData = body.data || body;
        } else {
            // Handle form-urlencoded - PayDunya sends data=JSON_STRING
            const params = new URLSearchParams(bodyText);
            const dataStr = params.get('data');
            if (dataStr) {
                webhookData = JSON.parse(dataStr);
            } else {
                // Fallback: try parsing the whole body as JSON
                try {
                    const parsed = JSON.parse(bodyText);
                    webhookData = parsed.data || parsed;
                } catch {
                    console.error('[PayDunya Webhook] Failed to parse body:', bodyText.substring(0, 500));
                    return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
                }
            }
        }

        console.log('[PayDunya Webhook] Received:', {
            status: webhookData.status,
            token: webhookData.invoice?.token,
            mode: webhookData.mode,
            hasHash: !!webhookData.hash,
        });

        // Verify the hash (SHA-512 of Master Key)
        const masterKey = process.env.PAYDUNYA_MASTER_KEY;
        if (!masterKey) {
            console.error('[PayDunya Webhook] Master key not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const expectedHash = crypto
            .createHash('sha512')
            .update(masterKey)
            .digest('hex');

        if (webhookData.hash !== expectedHash) {
            console.error('[PayDunya Webhook] Invalid hash');
            Sentry.captureMessage('PayDunya webhook: Invalid hash', {
                level: 'warning',
                extra: { receivedHash: webhookData.hash?.substring(0, 20) + '...' },
            });
            return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
        }

        // Get order ID from custom data
        const orderId = webhookData.custom_data?.order_id;
        if (!orderId) {
            console.error('[PayDunya Webhook] Missing order_id in custom_data');
            return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
        }

        // Initialize Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('[PayDunya Webhook] Order not found:', orderId);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify amount matches
        const receivedAmount = typeof webhookData.invoice.total_amount === 'string'
            ? parseFloat(webhookData.invoice.total_amount)
            : webhookData.invoice.total_amount;

        if (Math.abs(receivedAmount - order.total) > 1) { // Allow 1 XOF tolerance
            console.error('[PayDunya Webhook] Amount mismatch:', {
                received: receivedAmount,
                expected: order.total,
            });
            Sentry.captureMessage('PayDunya webhook: Amount mismatch', {
                level: 'warning',
                extra: { received: receivedAmount, expected: order.total, orderId },
            });
        }

        // Handle payment result
        const result = await paydunyaProvider.handleCallback({ data: webhookData });

        if (result.success) {
            // Payment successful
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    payment_status: 'paid',
                    payment_method: 'paydunya',
                    payment_details: {
                        gateway: 'paydunya',
                        token: webhookData.invoice.token,
                        mode: webhookData.mode,
                        receipt_url: webhookData.receipt_url,
                        processed_at: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (updateError) {
                console.error('[PayDunya Webhook] Database update error:', updateError);
                throw updateError;
            }

            // Finalize stock reservations
            try {
                await supabase
                    .from('stock_reservations')
                    .update({ finalized_at: new Date().toISOString() })
                    .eq('order_id', orderId)
                    .is('finalized_at', null);
            } catch (stockError) {
                console.warn('[PayDunya Webhook] Stock finalization warning:', stockError);
            }

            console.log('[PayDunya Webhook] Order updated successfully:', orderId);

            // Send confirmation email
            try {
                const shippingAddress = order.shipping_address as {
                    email?: string;
                    firstName?: string;
                    lastName?: string;
                    phone?: string;
                    address?: string;
                    city?: string;
                    country?: string;
                };

                const customerEmail = shippingAddress?.email || webhookData.customer?.email;
                const customerName = webhookData.customer?.name ||
                    `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim();

                if (customerEmail) {
                    // Fetch order items
                    const { data: orderItems } = await supabase
                        .from('order_items')
                        .select('*, products(*)')
                        .eq('order_id', orderId);

                    const emailResult = await sendOrderConfirmationEmail(
                        customerEmail,
                        {
                            orderId: orderId,
                            customerName: customerName || 'Client',
                            total: order.total,
                            items: (orderItems || []).map((item: { products?: { name?: string }; quantity: number; price: number }) => ({
                                name: item.products?.name || 'Produit',
                                quantity: item.quantity,
                                price: item.price,
                            })),
                            shippingAddress: `${shippingAddress?.address || ''}, ${shippingAddress?.city || ''}, ${shippingAddress?.country || ''}`.trim(),
                            estimatedDelivery: '3-5 jours ouvrables',
                        }
                    );

                    console.log('[PayDunya Webhook] Confirmation email sent:', emailResult);
                }

                // Send WhatsApp notification to manager with complete details
                try {
                    await notifyManagerNewOrder({
                        orderId: order.order_number,
                        customerName: customerName || 'Client',
                        customerEmail: customerEmail,
                        customerPhone: shippingAddress?.phone || webhookData.customer?.phone,
                        total: order.total,
                        itemCount: (orderItems || []).length,
                        items: (orderItems || []).map((item: { products?: { name?: string }; quantity: number; price: number }) => ({
                            name: item.products?.name || 'Produit',
                            quantity: item.quantity,
                            price: item.price,
                        })),
                        address: shippingAddress?.address,
                        city: shippingAddress?.city,
                        country: shippingAddress?.country,
                        paymentMethod: 'paydunya',
                    });
                    console.log('[PayDunya Webhook] WhatsApp notification sent to manager');
                } catch (whatsappError) {
                    console.error('[PayDunya Webhook] WhatsApp notification error:', whatsappError);
                }
            } catch (emailError) {
                console.error('[PayDunya Webhook] Email/WhatsApp error:', emailError);
            }

            return NextResponse.json({
                success: true,
                message: 'Payment processed successfully',
                orderId,
            });

        } else {
            // Payment failed or cancelled
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: webhookData.status === 'cancelled' ? 'cancelled' : 'payment_failed',
                    payment_status: webhookData.status === 'cancelled' ? 'cancelled' : 'failed',
                    payment_details: {
                        gateway: 'paydunya',
                        token: webhookData.invoice.token,
                        mode: webhookData.mode,
                        fail_reason: webhookData.fail_reason,
                        processed_at: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (updateError) {
                console.error('[PayDunya Webhook] Database update error:', updateError);
                throw updateError;
            }

            // Release stock reservations
            try {
                await supabase
                    .from('stock_reservations')
                    .update({ released_at: new Date().toISOString() })
                    .eq('order_id', orderId)
                    .is('released_at', null);
            } catch (releaseError) {
                console.warn('[PayDunya Webhook] Stock release warning:', releaseError);
            }

            console.log('[PayDunya Webhook] Payment failed/cancelled:', orderId);

            return NextResponse.json({
                success: false,
                message: 'Payment failed or cancelled',
                orderId,
                reason: webhookData.fail_reason,
            });
        }

    } catch (error) {
        console.error('[PayDunya Webhook] Error:', error);
        Sentry.captureException(error, {
            tags: { route: 'webhooks/paydunya' },
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Handle GET for webhook verification (some providers do this)
export async function GET() {
    return NextResponse.json({ status: 'PayDunya webhook endpoint active' });
}
