/**
 * Tests for Email Service
 */

import {
    sendOrderConfirmationEmail,
    sendWelcomeEmail,
    sendNewsletterConfirmEmail,
    sendContactResponseEmail,
    sendCustomOrderEmail,
} from '@/lib/email-service';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe('Email Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });
    });

    describe('sendOrderConfirmationEmail', () => {
        it('should send order confirmation email with correct payload', async () => {
            const result = await sendOrderConfirmationEmail('test@example.com', {
                orderNumber: 'ORD-123456',
                orderId: 'uuid-123',
                customerName: 'John Doe',
                total: 75000,
                items: [
                    { name: 'Robe Africaine', quantity: 1, price: 75000 },
                ],
            });

            expect(result.success).toBe(true);
            expect(mockFetch).toHaveBeenCalledTimes(1);

            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toContain('/functions/v1/custom-email-sender');

            const body = JSON.parse(options.body);
            expect(body.to).toBe('test@example.com');
            expect(body.template).toBe('order-confirmation');
            expect(body.data.orderNumber).toBe('ORD-123456');
        });

        it('should handle API errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Internal Server Error',
            });

            const result = await sendOrderConfirmationEmail('test@example.com', {
                orderNumber: 'ORD-123',
                orderId: 'uuid',
                customerName: 'Test',
                total: 50000,
                items: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('sendWelcomeEmail', () => {
        it('should send welcome email', async () => {
            const result = await sendWelcomeEmail('new@user.com', { name: 'Marie' });

            expect(result.success).toBe(true);

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.template).toBe('signup-confirmation');
            expect(body.data.name).toBe('Marie');
        });
    });

    describe('sendNewsletterConfirmEmail', () => {
        it('should send newsletter confirmation', async () => {
            const result = await sendNewsletterConfirmEmail('subscriber@test.com', 'Subscriber');

            expect(result.success).toBe(true);

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.template).toBe('newsletter');
        });
    });

    describe('sendContactResponseEmail', () => {
        it('should send contact response', async () => {
            const result = await sendContactResponseEmail('contact@test.com', {
                name: 'User',
                subject: 'Question',
            });

            expect(result.success).toBe(true);

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.template).toBe('contact-response');
        });
    });

    describe('sendCustomOrderEmail', () => {
        it('should send custom order confirmation', async () => {
            const result = await sendCustomOrderEmail('custom@test.com', {
                name: 'Client',
                reference: 'CUSTOM-001',
            });

            expect(result.success).toBe(true);

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.template).toBe('custom-order');
            expect(body.data.reference).toBe('CUSTOM-001');
        });
    });

    describe('Error handling', () => {
        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await sendOrderConfirmationEmail('test@test.com', {
                orderNumber: 'ORD-123',
                orderId: 'uuid',
                customerName: 'Test',
                total: 50000,
                items: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Network error');
        });
    });
});
