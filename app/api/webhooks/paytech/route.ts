/**
 * PayTech Webhook Handler
 * Receives Instant Payment Notifications (IPN) from PayTech
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPaytechWebhook, isPaytechPaymentSuccessful, PaytechWebhookPayload } from '@/lib/paytech';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.formData();

        // Convert FormData to object
        const payload: PaytechWebhookPayload = {
            ref_command: body.get('ref_command') as string,
            item_name: body.get('item_name') as string,
            amount: body.get('item_price') as string,
            payment_method: body.get('payment_method') as string,
            client_phone: body.get('client_phone') as string,
            client_email: body.get('client_email') as string,
            env: body.get('env') as 'test' | 'prod',
            type_event: body.get('type_event') as 'sale_complete' | 'sale_canceled',
            custom_field: body.get('custom_field') as string,
            api_key_sha256: body.get('api_key_sha256') as string,
            api_secret_sha256: body.get('api_secret_sha256') as string,
        };

        console.log('[PayTech Webhook] Received:', {
            ref: payload.ref_command,
            event: payload.type_event,
            amount: payload.amount,
        });

        // Verify webhook signature
        if (!verifyPaytechWebhook(payload)) {
            console.error('[PayTech Webhook] Invalid signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const orderId = payload.ref_command;

        // Check if payment was successful
        if (isPaytechPaymentSuccessful(payload)) {
            // Update order status
            const { error } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    payment_method: 'paytech',
                    payment_details: {
                        method: payload.payment_method,
                        phone: payload.client_phone,
                        amount: payload.amount,
                        processed_at: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (error) {
                console.error('[PayTech Webhook] Database update error:', error);
                return NextResponse.json({ error: 'Database error' }, { status: 500 });
            }

            console.log('[PayTech Webhook] Order updated successfully:', orderId);

            // TODO: Send confirmation email/WhatsApp

        } else {
            // Payment canceled or failed
            const { error } = await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    status: 'cancelled',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (error) {
                console.error('[PayTech Webhook] Database update error:', error);
            }

            console.log('[PayTech Webhook] Payment failed/canceled:', orderId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PayTech Webhook] Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
