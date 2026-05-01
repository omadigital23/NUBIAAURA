import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

function callbackRequest(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

async function loadCallbackRoute({
  exchangeCodeForSession = async () => ({
    data: {
      session: { access_token: 'oauth-token-123' },
    },
    error: null,
  }),
}: {
  exchangeCodeForSession?: () => Promise<{
    data: { session: { access_token: string } | null };
    error: { message: string } | null;
  }>;
} = {}) {
  jest.resetModules();

  const exchange = jest.fn(async (_code: string) => exchangeCodeForSession());
  const createClient = jest.fn(() => ({
    auth: {
      exchangeCodeForSession: exchange,
    },
  }));

  jest.doMock('@supabase/supabase-js', () => ({ createClient }));

  return {
    ...(await import('@/app/api/auth/callback/route')),
    createClient,
    exchange,
  };
}

describe('OAuth Callback API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to login when no code is provided', async () => {
    const { GET, createClient } = await loadCallbackRoute();

    const response = await GET(callbackRequest('/api/auth/callback'));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('http://localhost:3000/fr/auth/login');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('sets an HttpOnly cookie and redirects to the next URL after a valid code', async () => {
    const { GET, exchange } = await loadCallbackRoute();

    const response = await GET(
      callbackRequest('/api/auth/callback?code=valid-code&next=/fr/client/dashboard')
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('http://localhost:3000/fr/client/dashboard');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(exchange).toHaveBeenCalledWith('valid-code');
  });

  it('redirects to login when Supabase rejects the OAuth code', async () => {
    const { GET } = await loadCallbackRoute({
      exchangeCodeForSession: async () => ({
        data: { session: null },
        error: { message: 'Invalid code' },
      }),
    });

    const response = await GET(callbackRequest('/api/auth/callback?code=invalid-code'));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('/fr/auth/login?error=Invalid%20code');
  });
});
