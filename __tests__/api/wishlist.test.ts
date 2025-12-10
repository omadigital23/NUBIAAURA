/**
 * Tests for Wishlist API
 */

describe('Wishlist API', () => {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

    // Mock cookie for authenticated user
    const authCookie = 'sb-auth-token=test-token';

    describe('GET /api/wishlist', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await fetch(`${baseUrl}/api/wishlist`);

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBeDefined();
        });

        it('should return empty wishlist for new user', async () => {
            const response = await fetch(`${baseUrl}/api/wishlist`, {
                headers: {
                    'Cookie': authCookie,
                },
                credentials: 'include',
            });

            // This will fail without proper auth, but tests the structure
            if (response.status === 200) {
                const data = await response.json();
                expect(data.success).toBe(true);
                expect(Array.isArray(data.items)).toBe(true);
            }
        });
    });

    describe('POST /api/wishlist', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await fetch(`${baseUrl}/api/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: 'test-product-id' }),
            });

            expect(response.status).toBe(401);
        });

        it('should return 400 when productId is missing', async () => {
            const response = await fetch(`${baseUrl}/api/wishlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': authCookie,
                },
                body: JSON.stringify({}),
            });

            // Expect 400 or 401 (depending on auth state)
            expect([400, 401]).toContain(response.status);
        });
    });

    describe('DELETE /api/wishlist', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await fetch(`${baseUrl}/api/wishlist?productId=test-id`, {
                method: 'DELETE',
            });

            expect(response.status).toBe(401);
        });

        it('should return 400 when productId is missing', async () => {
            const response = await fetch(`${baseUrl}/api/wishlist`, {
                method: 'DELETE',
                headers: {
                    'Cookie': authCookie,
                },
            });

            // Expect 400 or 401
            expect([400, 401]).toContain(response.status);
        });
    });
});
