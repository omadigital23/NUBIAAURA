/**
 * PayTech Webhook Handler
 * Receives Instant Payment Notifications (IPN) from PayTech
 * 
 * Supports:
 * - Wave, Orange Money, Free Money (Senegal)
 * - International cards Visa/MC/Amex
 * 
 * Security: HMAC-SHA256 verification (recommended) + SHA256 fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { paytechProvider, PaytechWebhookPayload } from '@/lib/payments';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.formData();

        // Convert FormData to PaytechWebhookPayload
        const payload: PaytechWebhookPayload = {
            type_event: body.get('type_event') as 'sale_complete' | 'sale_canceled',
            ref_command: body.get('ref_command') as string,
            item_name: body.get('item_name') as string,
            item_price: body.get('item_price') as string,
            payment_method: body.get('payment_method') as string,
            client_phone: body.get('client_phone') as string,
            client_email: body.get('client_email') as string || undefined,
            env: body.get('env') as 'test' | 'prod',
            token: body.get('token') as string,
            api_key_sha256: body.get('api_key_sha256') as string,
            api_secret_sha256: body.get('api_secret_sha256') as string,
            hmac_compute: body.get('hmac_compute') as string || undefined,
            custom_field: body.get('custom_field') as string || undefined,
        };

        console.log('[PayTech Webhook] Received:', {
            ref: payload.ref_command,
            event: payload.type_event,
            amount: payload.item_price,
            method: payload.payment_method,
            env: payload.env,
        });

        // Verify webhook signature (HMAC-SHA256 or SHA256 fallback)
        if (!paytechProvider.verifyWebhook(payload)) {
            console.error('[PayTech Webhook] Invalid signature');
            Sentry.captureMessage('PayTech webhook: Invalid signature', {
                level: 'warning',
                extra: { orderId: payload.ref_command },
            });
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const orderId = payload.ref_command;

        // Get the order to verify it exists and check amount
        const { data: order, error: orderFetchError } = await supabase
            .from('orders')
            .select('id, total, status, payment_status')
            .eq('id', orderId)
            .single();

        if (orderFetchError || !order) {
            console.error('[PayTech Webhook] Order not found:', orderId);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Anti-fraud: Verify amount matches (with 1 unit tolerance for rounding)
        const receivedAmount = parseFloat(payload.item_price);
        if (Math.abs(receivedAmount - order.total) > 1) {
            console.error('[PayTech Webhook] Amount mismatch:', {
                expected: order.total,
                received: receivedAmount,
            });
            Sentry.captureMessage('PayTech webhook: Amount mismatch', {
                level: 'error',
                extra: { orderId, expected: order.total, received: receivedAmount },
            });
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        }

        // Process the callback
        const result = await paytechProvider.handleCallback(payload);

        if (result.success) {
            // Payment successful
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    payment_method: 'paytech',
                    payment_details: {
                        gateway: 'paytech',
                        method: payload.payment_method,
                        token: payload.token,
                        phone: payload.client_phone,
                        email: payload.client_email,
                        amount: receivedAmount,
                        env: payload.env,
                        processedAt: result.processedAt,
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (updateError) {
                console.error('[PayTech Webhook] Database update error:', updateError);
                return NextResponse.json({ error: 'Database error' }, { status: 500 });
            }

            // Finalize stock reservations
            const { error: stockError } = await supabase
                .from('stock_reservations')
                .update({ finalized_at: new Date().toISOString() })
                .eq('order_id', orderId)
                .is('finalized_at', null);

            if (stockError) {
                console.warn('[PayTech Webhook] Stock finalization warning:', stockError);
            }

            console.log('[PayTech Webhook] Order updated successfully:', orderId);

            // TODO: Send confirmation email/WhatsApp

        } else {
            // Payment canceled or failed
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    status: 'cancelled',
                    payment_details: {
                        gateway: 'paytech',
                        event: payload.type_event,
                        failedAt: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (updateError) {
                console.error('[PayTech Webhook] Database update error:', updateError);
            }

            // Release stock reservations
            const { error: releaseError } = await supabase
                .from('stock_reservations')
                .update({ released_at: new Date().toISOString() })
                .eq('order_id', orderId)
                .is('released_at', null);

            if (releaseError) {
                console.warn('[PayTech Webhook] Stock release warning:', releaseError);
            }

            console.log('[PayTech Webhook] Payment failed/canceled:', orderId);
        }

        return NextResponse.json({ success: true, orderId });

    } catch (error) {
        console.error('[PayTech Webhook] Error:', error);
        Sentry.captureException(error, {
            tags: { route: 'webhooks/paytech' },
        });
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

// OPTIONS for CORS preflight (if needed)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
