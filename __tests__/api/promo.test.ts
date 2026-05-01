import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const activePromo = {
  code: 'BIENVENUE10',
  discount_type: 'percentage',
  discount_value: 10,
  description: 'Welcome discount',
  min_order_amount: 50_000,
  max_discount: null,
  max_uses: 100,
  current_uses: 1,
  valid_from: '2020-01-01T00:00:00.000Z',
  valid_until: '2099-01-01T00:00:00.000Z',
};

function promoRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/promo/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createPromoQuery(result: { data: unknown; error: unknown }) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn((_column: string, _value: unknown) => query),
    single: jest.fn(async () => result),
  };

  return query;
}

async function loadPromoRoute(result: { data: unknown; error: unknown } = { data: activePromo, error: null }) {
  jest.resetModules();

  const query = createPromoQuery(result);
  const createClient = jest.fn(() => ({
    from: jest.fn(() => query),
  }));

  jest.doMock('@supabase/supabase-js', () => ({ createClient }));

  return {
    ...(await import('@/app/api/promo/validate/route')),
    query,
    createClient,
  };
}

describe('Promo Code Validation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates a percentage promo code and normalizes casing', async () => {
    const { POST, query } = await loadPromoRoute();

    const response = await POST(
      promoRequest({
        code: ' bienvenue10 ',
        orderAmount: 100_000,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      valid: true,
      discountType: 'percentage',
      discountAmount: 10_000,
      newTotal: 90_000,
    });
    expect(query.eq).toHaveBeenCalledWith('code', 'BIENVENUE10');
  });

  it('rejects a non-existent promo code', async () => {
    const { POST } = await loadPromoRoute({
      data: null,
      error: { message: 'not found' },
    });

    const response = await POST(
      promoRequest({
        code: 'FAKECODE123',
        orderAmount: 50_000,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.valid).toBe(false);
  });

  it('rejects orders below the minimum amount', async () => {
    const { POST } = await loadPromoRoute();

    const response = await POST(
      promoRequest({
        code: 'BIENVENUE10',
        orderAmount: 30_000,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toContain('minimum');
  });

  it('caps fixed discounts to the order amount', async () => {
    const { POST } = await loadPromoRoute({
      data: {
        ...activePromo,
        code: 'FIXE',
        discount_type: 'fixed',
        discount_value: 80_000,
        min_order_amount: null,
      },
      error: null,
    });

    const response = await POST(
      promoRequest({
        code: 'FIXE',
        orderAmount: 50_000,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.discountAmount).toBe(50_000);
    expect(data.newTotal).toBe(0);
  });

  it('rejects invalid request bodies', async () => {
    const { POST } = await loadPromoRoute();

    const response = await POST(promoRequest({}));

    expect(response.status).toBe(400);
  });
});
