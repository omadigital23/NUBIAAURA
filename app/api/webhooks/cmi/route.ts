/**
 * CMI Webhook Handler
 * Receives payment notifications from CMI (Morocco)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCMIWebhook, isCMIPaymentSuccessful, CMIWebhookPayload } from '@/lib/cmi';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.formData();

        // Convert FormData to CMI payload
        const payload: CMIWebhookPayload = {
            oid: body.get('oid') as string,
            AuthCode: body.get('AuthCode') as string,
            Response: body.get('Response') as string,
            ProcReturnCode: body.get('ProcReturnCode') as string,
            TransId: body.get('TransId') as string,
            mdStatus: body.get('mdStatus') as string,
            amount: body.get('amount') as string,
            currency: body.get('currency') as string,
            HASH: body.get('HASH') as string,
            HASHPARAMS: body.get('HASHPARAMS') as string,
            HASHPARAMSVAL: body.get('HASHPARAMSVAL') as string,
        };

        console.log('[CMI Webhook] Received:', {
            oid: payload.oid,
            response: payload.Response,
            procReturnCode: payload.ProcReturnCode,
        });

        // Verify webhook signature
        if (!verifyCMIWebhook(payload)) {
            console.error('[CMI Webhook] Invalid signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const orderId = payload.oid;

        // Check if payment was successful
        if (isCMIPaymentSuccessful(payload)) {
            // Update order status
            const { error } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    payment_method: 'cmi',
                    payment_details: {
                        authCode: payload.AuthCode,
                        transId: payload.TransId,
                        amount: payload.amount,
                        processed_at: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (error) {
                console.error('[CMI Webhook] Database update error:', error);
                return NextResponse.json({ error: 'Database error' }, { status: 500 });
            }

            console.log('[CMI Webhook] Order updated successfully:', orderId);

            // TODO: Send confirmation email/WhatsApp

        } else {
            // Payment declined
            const { error } = await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    status: 'cancelled',
                    payment_details: {
                        response: payload.Response,
                        procReturnCode: payload.ProcReturnCode,
                        failed_at: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (error) {
                console.error('[CMI Webhook] Database update error:', error);
            }

            console.log('[CMI Webhook] Payment failed:', orderId);
        }

        // CMI expects an 'ACTION=POSTAUTH' response for auto-capture
        return new NextResponse('ACTION=POSTAUTH', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    } catch (error) {
        console.error('[CMI Webhook] Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
