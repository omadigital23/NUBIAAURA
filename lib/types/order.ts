/**
 * Types centralisés pour les commandes
 */

export interface CartItem {
  product_id: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  shipping_address: ShippingAddress;
  shipping_method: string;
  tracking_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentMethod =
  | 'cod'
  | 'paytech'
  | 'cmi'
  | 'card'
  | 'mobile_money';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  variant_id?: string | null;
  product?: {
    name: string;
    image_url?: string;
  };
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode?: string;
  country: string;
}

export interface CreateOrderData {
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    variant_id?: string;
  }>;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}
