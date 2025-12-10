/**
 * Tests for Promo Code Validation API
 */

describe('Promo Code Validation API', () => {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

    describe('POST /api/promo/validate', () => {
        it('should validate a valid percentage promo code', async () => {
            const response = await fetch(`${baseUrl}/api/promo/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: 'BIENVENUE10',
                    orderAmount: 100000,
                }),
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.valid).toBe(true);
            expect(data.discountType).toBe('percentage');
            expect(data.discountAmount).toBe(10000); // 10% of 100000
            expect(data.newTotal).toBe(90000);
        });

        it('should reject a non-existent promo code', async () => {
            const response = await fetch(`${baseUrl}/api/promo/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: 'FAKECODE123',
                    orderAmount: 50000,
                }),
            });

            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.valid).toBe(false);
            expect(data.error).toBeDefined();
        });

        it('should reject when minimum order amount not met', async () => {
            const response = await fetch(`${baseUrl}/api/promo/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: 'BIENVENUE10',
                    orderAmount: 30000, // Less than 50000 minimum
                }),
            });

            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.valid).toBe(false);
            expect(data.error).toContain('minimum');
        });

        it('should handle case-insensitive codes', async () => {
            const response = await fetch(`${baseUrl}/api/promo/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: 'bienvenue10', // lowercase
                    orderAmount: 100000,
                }),
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.valid).toBe(true);
        });

        it('should reject invalid request body', async () => {
            const response = await fetch(`${baseUrl}/api/promo/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Missing code and orderAmount
                }),
            });

            expect(response.status).toBe(400);
        });
    });
});
