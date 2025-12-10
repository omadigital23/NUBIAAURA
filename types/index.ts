// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'ready-to-wear' | 'custom' | 'accessories';
  images: string[];
  sizes?: string[];
  colors?: string[];
  stock: number;
  rating?: number;
  reviews?: number;
  created_at: string;
  updated_at: string;
}

// Cart Types
export interface CartItem {
  product_id: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  currency: string;
}

// Order Types
export interface Order {
  id: string;
  user_id: string;
  items: CartItem[];
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  shipping_address: Address;
  created_at: string;
  updated_at: string;
}

// Custom Order Types
export interface CustomOrder {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  measurements: string;
  preferences: string;
  budget: number;
  reference_image?: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

// Address Types
export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

// Payment Types
export interface PaymentDetails {
  amount: number;
  currency: string;
  method: 'card' | 'mobile_money' | 'bank_transfer';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
