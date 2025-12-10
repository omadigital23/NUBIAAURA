import { z } from 'zod';

export const AddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
});

export const CartItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
});

export const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, 'Cart cannot be empty'),
  shippingMethod: z.enum(['standard', 'express'], {
    errorMap: () => ({ message: 'Invalid shipping method' }),
  }),
  address: AddressSchema,
});

export const PaymentInitializeSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  shippingMethod: z.enum(['standard', 'express']),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  cartItems: z.array(CartItemSchema),
});

export const CODOrderSchema = z.object({
  shippingMethod: z.enum(['standard', 'express']),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  items: z.array(CartItemSchema).min(1, 'Cart cannot be empty'),
});

export type Address = z.infer<typeof AddressSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type CheckoutData = z.infer<typeof CheckoutSchema>;
export type PaymentInitialize = z.infer<typeof PaymentInitializeSchema>;
export type CODOrder = z.infer<typeof CODOrderSchema>;
