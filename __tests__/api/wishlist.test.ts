import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

type QueryResult = {
  data?: unknown;
  error?: { message?: string; code?: string } | null;
};

const userId = 'user-123';
const wishlistId = 'wishlist-123';

function createQuery({
  singleResult = { data: null, error: null },
  awaitResult = { data: null, error: null },
  orderResult = { data: [], error: null },
}: {
  singleResult?: QueryResult;
  awaitResult?: QueryResult;
  orderResult?: QueryResult;
} = {}) {
  const query = {
    select: jest.fn((_columns?: string) => query),
    insert: jest.fn((_payload?: unknown) => query),
    delete: jest.fn(() => query),
    eq: jest.fn((_column: string, _value: unknown) => query),
    order: jest.fn(async (_column: string, _options?: unknown) => orderResult),
    single: jest.fn(async () => singleResult),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise.resolve(awaitResult).then(resolve, reject),
  };

  return query;
}

function request(
  url: string,
  init: { method?: string; headers?: HeadersInit; body?: BodyInit | null } = {}
) {
  return new NextRequest(url, init);
}

function createSupabaseMock({
  wishlist = { id: wishlistId },
  items = [],
  existingItem = null,
}: {
  wishlist?: unknown;
  items?: unknown[];
  existingItem?: unknown;
} = {}) {
  const wishlistsQuery = createQuery({ singleResult: { data: wishlist, error: null } });
  const wishlistItemsQuery = createQuery({
    singleResult: existingItem
      ? { data: existingItem, error: null }
      : { data: null, error: { code: 'PGRST116' } },
    orderResult: { data: items, error: null },
    awaitResult: { data: null, error: null },
  });
  const from = jest.fn((table: string) => {
    if (table === 'wishlists') return wishlistsQuery;
    if (table === 'wishlist_items') return wishlistItemsQuery;
    return createQuery();
  });

  return {
    auth: {
      getUser: jest.fn(async (_token: string) => ({
        data: { user: { id: userId, email: 'customer@example.com' } },
        error: null,
      })),
    },
    from,
    wishlistsQuery,
    wishlistItemsQuery,
  };
}

async function loadWishlistRoute(supabase = createSupabaseMock()) {
  jest.resetModules();

  const createClient = jest.fn(() => supabase);
  jest.doMock('@supabase/supabase-js', () => ({ createClient }));

  return {
    ...(await import('@/app/api/wishlist/route')),
    createClient,
    supabase,
  };
}

describe('Wishlist API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without an auth cookie and does not initialize Supabase', async () => {
    const { GET, createClient } = await loadWishlistRoute();

    const response = await GET(request('http://localhost:3000/api/wishlist'));

    expect(response.status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns wishlist items for an authenticated user', async () => {
    const item = {
      id: 'item-1',
      product_id: 'prod-1',
      products: { id: 'prod-1', name: 'Dress', price: 10000 },
    };
    const { GET, supabase } = await loadWishlistRoute(createSupabaseMock({ items: [item] }));

    const response = await GET(
      request('http://localhost:3000/api/wishlist', {
        headers: { Cookie: 'sb-auth-token=valid-token' },
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ success: true, count: 1 });
    expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token');
    expect(supabase.wishlistItemsQuery.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
  });

  it('adds a product to the wishlist', async () => {
    const { POST, supabase } = await loadWishlistRoute();

    const response = await POST(
      request('http://localhost:3000/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'sb-auth-token=valid-token',
        },
        body: JSON.stringify({ productId: 'prod-1' }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(supabase.wishlistItemsQuery.insert).toHaveBeenCalledWith({
      wishlist_id: wishlistId,
      product_id: 'prod-1',
    });
  });

  it('returns 400 when productId is missing on add', async () => {
    const { POST } = await loadWishlistRoute();

    const response = await POST(
      request('http://localhost:3000/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'sb-auth-token=valid-token',
        },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
  });

  it('removes a product from the wishlist', async () => {
    const { DELETE, supabase } = await loadWishlistRoute();

    const response = await DELETE(
      request('http://localhost:3000/api/wishlist?productId=prod-1', {
        method: 'DELETE',
        headers: { Cookie: 'sb-auth-token=valid-token' },
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(supabase.wishlistItemsQuery.delete).toHaveBeenCalled();
    expect(supabase.wishlistItemsQuery.eq).toHaveBeenCalledWith('product_id', 'prod-1');
  });
});
