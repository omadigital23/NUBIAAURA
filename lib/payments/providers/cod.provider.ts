/**
 * Cash on Delivery (COD) Provider
 * Available for all countries
 * 
 * No external API call - just order management
 */

import {
    IPaymentProvider,
    PaymentGateway,
    Currency,
    OrderPayload,
    PaymentSession,
    CallbackResult,
    PaymentStatus,
} from '../types';

/**
 * COD Payment Provider Implementation
 */
export class CODProvider implements IPaymentProvider {
    readonly gateway: PaymentGateway = 'cod';
    readonly supportedCurrencies: Currency[] = ['MAD', 'XOF', 'USD', 'EUR'];

    /**
     * COD is always available
     */
    isConfigured(): boolean {
        return true;
    }

    /**
     * Create a COD payment session
     * Simply returns success - the order will be marked as awaiting_payment
     */
    async createSession(order: OrderPayload): Promise<PaymentSession> {
        console.log('[COD] Creating COD order:', {
            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency,
            customer: order.customer.phone,
        });

        return {
            success: true,
            gateway: this.gateway,
            transactionId: `COD-${order.orderId}`,
            orderConfirmed: true,
        };
    }

    /**
     * COD doesn't have webhooks
     */
    verifyWebhook(): boolean {
        return true;
    }

    /**
     * Handle manual confirmation (e.g., from admin panel after delivery)
     */
    async handleCallback(payload: unknown): Promise<CallbackResult> {
        const data = payload as { orderId: string; status: 'delivered' | 'cancelled' };

        return {
            success: data.status === 'delivered',
            orderId: data.orderId,
            transactionId: `COD-${data.orderId}`,
            status: data.status === 'delivered' ? 'paid' : 'cancelled',
            paymentMethod: 'cod',
            processedAt: new Date().toISOString(),
            rawPayload: data,
        };
    }

    /**
     * Get COD order status
     */
    async getStatus(_transactionId: string): Promise<PaymentStatus> {
        // COD orders start as awaiting_payment
        // Status is managed through admin panel
        return 'awaiting_payment';
    }
}

// Export singleton instance
export const codProvider = new CODProvider();
