/**
 * Enhanced order notification service
 * Integrates with Redis to prevent duplicate notifications
 */

import { notifyManagerNewOrder } from '@/lib/whatsapp-notifications';
import { hasNotificationBeenSent, markNotificationAsSent } from '@/lib/services/redis';

export interface NewOrderNotificationData {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    total: number;
    itemCount: number;
    shippingMethod: string;
}

/**
 * Send notification for a new order (with duplicate prevention)
 * @param data - Order notification data
 * @returns true if notification was sent, false if skipped (duplicate)
 */
export async function sendNewOrderNotification(
    data: NewOrderNotificationData
): Promise<boolean> {
    try {
        // Check if notification was already sent
        const alreadySent = await hasNotificationBeenSent(data.orderId);

        if (alreadySent) {
            console.log(`[OrderNotification] ⏭️ Skipping duplicate notification for order: ${data.orderNumber}`);
            return false;
        }

        // Send WhatsApp notification to manager
        const success = await notifyManagerNewOrder({
            orderId: data.orderNumber,
            customerName: data.customerName,
            total: data.total,
            itemCount: data.itemCount,
        });

        if (success) {
            // Mark notification as sent in Redis
            await markNotificationAsSent(data.orderId);
            console.log(`[OrderNotification] ✅ Sent notification for order: ${data.orderNumber}`);
            return true;
        } else {
            console.warn(`[OrderNotification] ⚠️ Failed to send notification for order: ${data.orderNumber}`);
            return false;
        }
    } catch (error) {
        console.error('[OrderNotification] Error sending notification:', error);
        return false;
    }
}

/**
 * Format customer name from shipping address
 */
export function formatCustomerName(shippingAddress: any): string {
    if (typeof shippingAddress === 'object' && shippingAddress !== null) {
        const firstName = shippingAddress.firstName || '';
        const lastName = shippingAddress.lastName || '';
        return `${firstName} ${lastName}`.trim() || 'Client';
    }
    return 'Client';
}

/**
 * Extract customer contact info from shipping address
 */
export function extractCustomerContact(shippingAddress: any): {
    email: string;
    phone: string;
} {
    if (typeof shippingAddress === 'object' && shippingAddress !== null) {
        return {
            email: shippingAddress.email || '',
            phone: shippingAddress.phone || '',
        };
    }
    return { email: '', phone: '' };
}
