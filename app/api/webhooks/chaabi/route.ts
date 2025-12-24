/**
 * Chaabi Payment Webhook Handler
 * Receives payment notifications from M2T/Payzone (Banque Populaire Maroc)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chaabiProvider, ChaabiWebhookPayload } from '@/lib/payments';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Parse the webhook payload
        const contentType = request.headers.get('content-type') || '';
        let payload: ChaabiWebhookPayload;

        if (contentType.includes('application/json')) {
            payload = await request.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData();
            payload = {
                order_id: formData.get('order_id') as string,
                transaction_id: formData.get('transaction_id') as string,
                status: formData.get('status') as 'approved' | 'declined' | 'pending',
                auth_code: formData.get('auth_code') as string,
                amount: formData.get('amount') as string,
                currency: formData.get('currency') as string,
                hash: formData.get('hash') as string,
                timestamp: formData.get('timestamp') as string,
            };
        } else {
            console.error('[Chaabi Webhook] Unsupported content type:', contentType);
            return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
        }

        console.log('[Chaabi Webhook] Received:', {
            orderId: payload.order_id,
            status: payload.status,
            transactionId: payload.transaction_id,
        });

        // Verify webhook signature
        if (!chaabiProvider.verifyWebhook(payload)) {
            console.error('[Chaabi Webhook] Invalid signature');
            Sentry.captureMessage('Chaabi webhook: Invalid signature', {
                level: 'warning',
                extra: { orderId: payload.order_id },
            });
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Process the callback
        const result = await chaabiProvider.handleCallback(payload);

        // Get the order to verify it exists
        const { data: order, error: orderFetchError } = await supabase
            .from('orders')
            .select('id, total, status, payment_status')
            .eq('id', result.orderId)
            .single();

        if (orderFetchError || !order) {
            console.error('[Chaabi Webhook] Order not found:', result.orderId);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify amount matches (anti-fraud)
        const receivedAmount = parseFloat(payload.amount) / 100; // Convert from centimes
        if (Math.abs(receivedAmount - order.total) > 1) {
            console.error('[Chaabi Webhook] Amount mismatch:', {
                expected: order.total,
                received: receivedAmount,
            });
            Sentry.captureMessage('Chaabi webhook: Amount mismatch', {
                level: 'error',
                extra: { orderId: result.orderId, expected: order.total, received: receivedAmount },
            });
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        }

        // Update order status
        if (result.success) {
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    payment_method: 'chaabi',
                    payment_details: {
                        gateway: 'chaabi',
                        transactionId: result.transactionId,
                        authCode: payload.auth_code,
                        amount: receivedAmount,
                        currency: 'MAD',
                        processedAt: result.processedAt,
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', result.orderId);

            if (updateError) {
                console.error('[Chaabi Webhook] Database update error:', updateError);
                return NextResponse.json({ error: 'Database error' }, { status: 500 });
            }

            // Finalize stock reservations
            const { error: stockError } = await supabase
                .from('stock_reservations')
                .update({ finalized_at: new Date().toISOString() })
                .eq('order_id', result.orderId)
                .is('finalized_at', null);

            if (stockError) {
                console.warn('[Chaabi Webhook] Stock finalization warning:', stockError);
            }

            console.log('[Chaabi Webhook] Order updated successfully:', result.orderId);

            // TODO: Send confirmation email/WhatsApp

        } else {
            // Payment failed
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    status: 'cancelled',
                    payment_details: {
                        gateway: 'chaabi',
                        status: payload.status,
                        failedAt: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', result.orderId);

            if (updateError) {
                console.error('[Chaabi Webhook] Database update error:', updateError);
            }

            // Release stock reservations
            const { error: releaseError } = await supabase
                .from('stock_reservations')
                .update({ released_at: new Date().toISOString() })
                .eq('order_id', result.orderId)
                .is('released_at', null);

            if (releaseError) {
                console.warn('[Chaabi Webhook] Stock release warning:', releaseError);
            }

            console.log('[Chaabi Webhook] Payment failed:', result.orderId);
        }

        // Return success to M2T/Payzone
        return NextResponse.json({ success: true, orderId: result.orderId });

    } catch (error) {
        console.error('[Chaabi Webhook] Error:', error);
        Sentry.captureException(error, {
            tags: { route: 'webhooks/chaabi' },
        });
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

// OPTIONS for CORS preflight
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
