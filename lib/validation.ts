import { z } from 'zod';

// Auth schemas
export const SignUpSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const SignInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

// Order schemas
export const OrderSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères').max(50),
  lastName: z.string().min(2, 'Minimum 2 caractères').max(50),
  email: z.string().email('Email invalide'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Numéro invalide'),
  address: z.string().min(5, 'Adresse trop courte').max(200),
  city: z.string().min(2, 'Ville requise').max(50),
  zipCode: z.string().optional(),
  country: z.string().length(2, 'Code pays invalide'),
  shippingMethod: z.enum(['standard', 'express']),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().min(1).max(100),
    price: z.number().positive(),
  })).min(1, 'Panier vide'),
});

// Custom order schema
export const CustomOrderSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Numéro invalide').max(20),
  type: z.enum(['dress', 'suit', 'shirt', 'pants', 'skirt', 'other', 'robe', 'costume', 'chemise', 'pantalon', 'jupe', 'autre']),
  measurements: z.string().min(1, 'Mesures requises').max(500),
  preferences: z.string().min(1, 'Préférences requises').max(1000),
  budget: z.number().positive('Budget invalide'),
});

// Return schema
export const ReturnSchema = z.object({
  order_id: z.string().uuid(),
  reason: z.string().min(10, 'Raison requise').max(500),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().min(1),
  })).min(1),
});

// Address schema
export const AddressSchema = z.object({
  street: z.string().min(5).max(200),
  city: z.string().min(2).max(50),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().length(2),
  is_default: z.boolean().default(false),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type OrderInput = z.infer<typeof OrderSchema>;
export type CustomOrderInput = z.infer<typeof CustomOrderSchema>;
export type ReturnInput = z.infer<typeof ReturnSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
