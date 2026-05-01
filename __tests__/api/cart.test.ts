import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

type QueryResult = {
  data?: unknown;
  error?: { message?: string; code?: string } | null;
};

type QueryOptions = {
  singleResult?: QueryResult;
  awaitResult?: QueryResult;
};

const userId = '22222222-2222-2222-2222-222222222222';
const variantId = '11111111-1111-1111-1111-111111111111';
const cartId = 'cart-123';

function createQuery(options: QueryOptions = {}) {
  const query = {
    select: jest.fn((_columns?: string) => query),
    insert: jest.fn((_payload?: unknown) => query),
    update: jest.fn((_payload?: unknown) => query),
    delete: jest.fn(() => query),
    eq: jest.fn((_column: string, _value: unknown) => query),
    is: jest.fn((_column: string, _value: unknown) => query),
    single: jest.fn(async () => options.singleResult || { data: null, error: null }),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise.resolve(options.awaitResult || { data: null, error: null }).then(resolve, reject),
  };

  return query;
}

function cartRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function emptyCartPostRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/cart', {
    method: 'POST',
    headers,
  });
}

function cartGetRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/cart', {
    method: 'GET',
    headers,
  });
}

function createSupabaseMock({
  product = {
    id: 'prod-1',
    inStock: true,
    name: 'Dress',
    name_fr: 'Robe',
    price: 10000,
    image_url: '/dress.jpg',
    stock: 5,
    product_variants: [
      {
        id: variantId,
        size: 'M',
        color: 'Noir',
        price: 12000,
        stock: 3,
        image: '/variant.jpg',
      },
    ],
  },
  cart = { id: cartId },
  existingItem = null,
}: {
  product?: unknown;
  cart?: unknown;
  existingItem?: unknown;
} = {}) {
  const productsQuery = createQuery({ singleResult: { data: product, error: null } });
  const cartsQuery = createQuery({ singleResult: { data: cart, error: null } });
  const cartItemsQuery = createQuery({
    singleResult: existingItem
      ? { data: existingItem, error: null }
      : { data: null, error: { code: 'PGRST116' } },
    awaitResult: { data: null, error: null },
  });

  const from = jest.fn((table: string) => {
    if (table === 'products') return productsQuery;
    if (table === 'carts') return cartsQuery;
    if (table === 'cart_items') return cartItemsQuery;
    return createQuery();
  });

  return {
    client: {
      auth: {
        getUser: jest.fn(async (_token: string) => ({
          data: { user: { id: userId, email: 'customer@example.com' } },
          error: null,
        })),
      },
      from,
    },
    productsQuery,
    cartsQuery,
    cartItemsQuery,
  };
}

async function loadCartRoute({
  supabase = createSupabaseMock(),
  rateLimitExceeded = false,
}: {
  supabase?: ReturnType<typeof createSupabaseMock>;
  rateLimitExceeded?: boolean;
} = {}) {
  jest.resetModules();

  const limit = jest.fn(async (_identifier: string) => ({
    success: !rateLimitExceeded,
    limit: 10,
    remaining: rateLimitExceeded ? 0 : 9,
    reset: Date.now() + 60_000,
  }));
  const addRateLimitHeaders = jest.fn();
  const createClient = jest.fn(() => supabase.client);

  jest.doMock('@supabase/supabase-js', () => ({ createClient }));
  jest.doMock('@/lib/rate-limit-upstash', () => ({
    cartRateLimit: { limit },
    getClientIdentifier: jest.fn(() => '127.0.0.1'),
    addRateLimitHeaders,
  }));
  jest.doMock('@sentry/nextjs', () => ({ captureException: jest.fn() }));

  return {
    ...(await import('@/app/api/cart/route')),
    createClient,
    limit,
    addRateLimitHeaders,
    supabase,
  };
}

describe('Cart API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty cart for anonymous cart reads', async () => {
    const { POST } = await loadCartRoute();

    const response = await POST(cartRequest({ action: 'get' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
  });

  it('returns an empty cart for anonymous GET cart retrieval', async () => {
    const { GET } = await loadCartRoute();

    const response = await GET(cartGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toEqual([]);
  });

  it('returns 400 for an empty POST body instead of throwing', async () => {
    const { POST } = await loadCartRoute();

    const response = await POST(emptyCartPostRequest({ Authorization: 'Bearer valid-token' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it('returns 429 when the cart rate limit is exceeded', async () => {
    const { POST, limit, addRateLimitHeaders } = await loadCartRoute({ rateLimitExceeded: true });

    const response = await POST(
      cartRequest({ action: 'get' }, { Authorization: 'Bearer valid-token' })
    );
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.retryAfter).toBeGreaterThan(0);
    expect(limit).toHaveBeenCalledWith('127.0.0.1');
    expect(addRateLimitHeaders).toHaveBeenCalled();
  });

  it('adds a variant-specific item and persists the variant id', async () => {
    const route = await loadCartRoute();

    const response = await route.POST(
      cartRequest(
        {
          action: 'add',
          item: {
            id: 'prod-1',
            variantId,
            name: 'Dress',
            price: 12000,
            quantity: 2,
            image: '/dress.jpg',
          },
        },
        { Cookie: 'sb-auth-token=valid-token' }
      )
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.item).toMatchObject({
      id: 'prod-1',
      variantId,
      price: 12000,
      quantity: 2,
      size: 'M',
      color: 'Noir',
    });
    expect(route.supabase.cartItemsQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cart_id: cartId,
        product_id: 'prod-1',
        variant_id: variantId,
        quantity: 2,
        price: 12000,
      })
    );
  });

  it('rejects a product with variants when no variant can be resolved', async () => {
    const product = {
      id: 'prod-1',
      inStock: true,
      name: 'Dress',
      name_fr: 'Robe',
      price: 10000,
      image_url: '/dress.jpg',
      stock: 5,
      product_variants: [
        { id: variantId, size: 'M', color: 'Noir', price: 12000, stock: 3, image: '/variant.jpg' },
        {
          id: '33333333-3333-3333-3333-333333333333',
          size: 'L',
          color: 'Noir',
          price: 12000,
          stock: 2,
          image: '/variant-l.jpg',
        },
      ],
    };
    const { POST } = await loadCartRoute({ supabase: createSupabaseMock({ product }) });

    const response = await POST(
      cartRequest(
        {
          action: 'add',
          item: {
            id: 'prod-1',
            name: 'Dress',
            price: 10000,
            quantity: 1,
            image: '/dress.jpg',
          },
        },
        { Authorization: 'Bearer valid-token' }
      )
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Variant selection required');
  });

  it('rejects additions above the selected variant stock', async () => {
    const { POST } = await loadCartRoute();

    const response = await POST(
      cartRequest(
        {
          action: 'add',
          item: {
            id: 'prod-1',
            variantId,
            name: 'Dress',
            price: 12000,
            quantity: 4,
            image: '/dress.jpg',
          },
        },
        { Authorization: 'Bearer valid-token' }
      )
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Insufficient stock');
  });

  it('validates cart action payloads', async () => {
    const { POST } = await loadCartRoute();

    const response = await POST(
      cartRequest(
        {
          action: 'add',
          item: {
            id: 'prod-1',
            name: 'Dress',
            price: 12000,
            quantity: -1,
            image: '/dress.jpg',
          },
        },
        { Authorization: 'Bearer valid-token' }
      )
    );

    expect(response.status).toBe(400);
  });
});
