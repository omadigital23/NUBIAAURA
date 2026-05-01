import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type LoginSupabaseOptions = {
  signIn?: () => Promise<{
    data: {
      user: { id: string; email: string };
      session: { access_token: string };
    } | null;
    error: { message: string } | null;
  }>;
};

const successRateLimit: RateLimitResult = {
  success: true,
  limit: 5,
  remaining: 4,
  reset: Date.now() + 60_000,
};

const user = { id: 'user-123', email: 'valid@example.com' };

function request(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createLoginSupabase(options: LoginSupabaseOptions = {}) {
  return {
    auth: {
      signInWithPassword: jest.fn(
        options.signIn ||
          (async () => ({
            data: {
              user,
              session: { access_token: 'session-token-123' },
            },
            error: null,
          }))
      ),
    },
  };
}

async function loadLoginRoute({
  supabase = createLoginSupabase(),
  rateLimit = successRateLimit,
}: {
  supabase?: ReturnType<typeof createLoginSupabase>;
  rateLimit?: RateLimitResult | null;
} = {}) {
  jest.resetModules();

  const limit = jest.fn(async (_identifier: string) => rateLimit);
  const createClient = jest.fn(() => supabase);
  const addRateLimitHeaders = jest.fn();

  jest.doMock('@supabase/supabase-js', () => ({ createClient }));
  jest.doMock('@/lib/rate-limit-upstash', () => ({
    authRateLimit: rateLimit ? { limit } : null,
    adminRateLimit: null,
    getClientIdentifier: jest.fn(() => '127.0.0.1'),
    addRateLimitHeaders,
  }));
  jest.doMock('@/lib/sanitize', () => ({
    sanitizeEmail: jest.fn((email: string) => email.toLowerCase().trim()),
    sanitizeText: jest.fn((text: string) => text.trim()),
  }));
  jest.doMock('@sentry/nextjs', () => ({ captureException: jest.fn() }));

  return {
    ...(await import('@/app/api/auth/login/route')),
    createClient,
    limit,
    addRateLimitHeaders,
  };
}

async function loadSignupRoute({
  createUser = async () => ({ data: { user }, error: null }),
  profileInsert = async () => ({ error: null }),
}: {
  createUser?: () => Promise<{ data: { user: typeof user } | null; error: { message: string } | null }>;
  profileInsert?: () => Promise<{ error: { message: string } | null }>;
} = {}) {
  jest.resetModules();

  const deleteUser = jest.fn(async (_userId: string) => ({ error: null }));
  const insert = jest.fn(async (_profile: unknown) => profileInsert());
  const createClient = jest.fn(() => ({
    auth: {
      admin: {
        createUser: jest.fn(async (_credentials: unknown) => createUser()),
        deleteUser,
      },
    },
    from: jest.fn(() => ({ insert })),
  }));
  const trackSignUp = jest.fn((_method: string) => undefined);

  jest.doMock('@supabase/supabase-js', () => ({ createClient }));
  jest.doMock('@/lib/rate-limit-upstash', () => ({
    authRateLimit: null,
    adminRateLimit: null,
    getClientIdentifier: jest.fn(() => '127.0.0.1'),
    addRateLimitHeaders: jest.fn(),
  }));
  jest.doMock('@/lib/sanitize', () => ({
    sanitizeEmail: jest.fn((email: string) => email.toLowerCase().trim()),
    sanitizeText: jest.fn((text: string) => text.trim()),
  }));
  jest.doMock('@sentry/nextjs', () => ({ captureException: jest.fn() }));
  jest.doMock('@/lib/analytics-config', () => ({ trackSignUp }));

  return {
    ...(await import('@/app/api/auth/signup/route')),
    createClient,
    insert,
    trackSignUp,
    deleteUser,
  };
}

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in, sets an HttpOnly cookie, and does not expose the token in JSON', async () => {
    const { POST, limit, addRateLimitHeaders } = await loadLoginRoute();
    const response = await POST(
      request('http://localhost:3000/api/auth/login', {
        email: '  VALID@EXAMPLE.COM  ',
        password: 'correct-password',
      })
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ success: true, user });
    expect(data).not.toHaveProperty('token');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(limit).toHaveBeenCalledWith('127.0.0.1');
    expect(addRateLimitHeaders).toHaveBeenCalled();
  });

  it('returns 429 when login rate limit is exceeded', async () => {
    const { POST } = await loadLoginRoute({
      rateLimit: {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60_000,
      },
    });

    const response = await POST(
      request('http://localhost:3000/api/auth/login', {
        email: 'valid@example.com',
        password: 'correct-password',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.retryAfter).toBeGreaterThan(0);
  });

  it('returns 401 for invalid credentials', async () => {
    const supabase = createLoginSupabase({
      signIn: async () => ({ data: null, error: { message: 'Invalid credentials' } }),
    });
    const { POST } = await loadLoginRoute({ supabase });

    const response = await POST(
      request('http://localhost:3000/api/auth/login', {
        email: 'wrong@example.com',
        password: 'wrong-password',
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid login input', async () => {
    const { POST } = await loadLoginRoute();

    const response = await POST(
      request('http://localhost:3000/api/auth/login', {
        email: 'invalid-email',
        password: '',
      })
    );

    expect(response.status).toBe(400);
  });

  it('creates a user profile on signup', async () => {
    const { POST, insert, trackSignUp } = await loadSignupRoute();

    const response = await POST(
      request('http://localhost:3000/api/auth/signup', {
        email: '  NEW@EXAMPLE.COM ',
        password: 'password123',
        firstName: ' Ada ',
        lastName: ' Lovelace ',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        email: 'new@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
      })
    );
    expect(trackSignUp).toHaveBeenCalledWith('email');
  });

  it('rolls back the auth user when profile creation fails', async () => {
    const { POST, deleteUser } = await loadSignupRoute({
      profileInsert: async () => ({ error: { message: 'profile insert failed' } }),
    });

    const response = await POST(
      request('http://localhost:3000/api/auth/signup', {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Ada',
        lastName: 'Lovelace',
      })
    );

    expect(response.status).toBe(400);
    expect(deleteUser).toHaveBeenCalledWith(user.id);
  });
});
