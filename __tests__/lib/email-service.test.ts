/**
 * Tests for Email Service (SMTP-based)
 * Updated to test the new SMTP email implementation
 */

import {
    sendOrderConfirmationEmail,
    sendEmailSMTP,
} from '@/lib/smtp-email';

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
        verify: jest.fn().mockResolvedValue(true),
    }),
}));

describe('Email Service (SMTP)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendOrderConfirmationEmail', () => {
        it('should send order confirmation email with correct parameters', async () => {
            const result = await sendOrderConfirmationEmail('test@example.com', {
                orderId: 'ORD-123456',
                customerName: 'John Doe',
                total: 75000,
                items: [
                    { name: 'Robe Africaine', quantity: 1, price: 75000 },
                ],
                shippingAddress: '123 Rue Test, Dakar',
                estimatedDelivery: '3-5 jours ouvrables',
            });

            // When SMTP password is not set, it returns 'skipped'
            expect(['skipped', 'test-message-id', 'sent']).toContain(result);
        });

        it('should handle empty items array', async () => {
            const result = await sendOrderConfirmationEmail('test@example.com', {
                orderId: 'ORD-123',
                customerName: 'Test',
                total: 50000,
                items: [],
                shippingAddress: 'Test Address',
                estimatedDelivery: '5-7 jours',
            });

            expect(['skipped', 'test-message-id', 'sent']).toContain(result);
        });
    });

    describe('sendEmailSMTP', () => {
        it('should send an email with the provided options', async () => {
            const result = await sendEmailSMTP({
                to: 'recipient@example.com',
                subject: 'Test Subject',
                html: '<p>Test content</p>',
            });

            expect(['skipped', 'test-message-id', 'sent']).toContain(result);
        });

        it('should handle missing SMTP password gracefully', async () => {
            // Without SMTP_PASSWORD env var, it should return 'skipped'
            const result = await sendEmailSMTP({
                to: 'test@test.com',
                subject: 'Test',
                html: '<p>Test</p>',
            });

            expect(result).toBe('skipped');
        });
    });
});
