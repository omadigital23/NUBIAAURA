export type ShippingMethod = 'standard' | 'express';

// Centralized pricing configuration (no UI text here)
export const TAX_RATE = 0.18; // 18%
export const FREE_SHIPPING_THRESHOLD = 100_000; // FCFA
export const SHIPPING_COSTS: Record<ShippingMethod, number> = {
  standard: 5_000,
  express: 15_000,
};

export type QuoteItem = {
  product_id: string;
  price: number; // unit price
  quantity: number;
};

export type QuoteInput = {
  items: QuoteItem[];
  shippingMethod: ShippingMethod;
  country?: string;
};

export type QuoteResult = {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

export function computeQuote(input: QuoteInput): QuoteResult {
  const subtotal = input.items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
  const baseShipping = SHIPPING_COSTS[input.shippingMethod] ?? 0;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : baseShipping;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, tax, total };
}
