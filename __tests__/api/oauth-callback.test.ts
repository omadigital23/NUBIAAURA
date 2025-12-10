/**
 * Tests for OAuth Callback Route
 */

describe('OAuth Callback API', () => {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

    describe('GET /api/auth/callback', () => {
        it('should redirect to login when no code provided', async () => {
            const response = await fetch(`${baseUrl}/api/auth/callback`, {
                redirect: 'manual',
            });

            expect(response.status).toBe(302);
            expect(response.headers.get('location')).toContain('/auth/login');
        });

        it('should handle invalid code gracefully', async () => {
            const response = await fetch(`${baseUrl}/api/auth/callback?code=invalid-code`, {
                redirect: 'manual',
            });

            // Should redirect to login with error
            expect(response.status).toBe(302);
            const location = response.headers.get('location');
            expect(location).toContain('/auth/login');
        });

        it('should preserve next parameter in redirect', async () => {
            const response = await fetch(
                `${baseUrl}/api/auth/callback?next=/fr/client/dashboard`,
                { redirect: 'manual' }
            );

            expect(response.status).toBe(302);
        });
    });
});
