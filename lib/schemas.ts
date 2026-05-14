/**
 * Schemas Zod partagés — Nubia Aura
 * Validation des inputs sur les endpoints critiques.
 */

import { z } from 'zod';

// ── Auth ────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email invalide');

export const otpSchema = z
  .string()
  .length(6, 'Code à 6 chiffres requis')
  .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres');

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
  locale: z.enum(['fr', 'en']).optional().default('fr'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: otpSchema,
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

// ── Checkout ────────────────────────────────────────────────────

export const checkoutItemSchema = z.object({
  product_id: z.string().uuid('ID produit invalide'),
  quantity: z.number().int().min(1, 'Quantité minimale : 1'),
  size: z.string().optional(),
  color: z.string().optional(),
  price: z.number().min(0).optional(),
});

export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: emailSchema,
  phone: z.string().min(5, 'Téléphone requis'),
  address: z.string().min(1, 'Adresse requise'),
  city: z.string().min(1, 'Ville requise'),
  zipCode: z.string().optional(),
  country: z.string().min(1, 'Pays requis'),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Au moins un article requis'),
  shipping_address: shippingAddressSchema,
  shipping_method: z.enum(['standard', 'express']).optional().default('standard'),
  payment_method: z.string().optional(),
});

// ── Contact ─────────────────────────────────────────────────────

export const contactSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  email: emailSchema,
  subject: z.string().min(1, 'Sujet requis').max(200),
  message: z.string().min(10, 'Message trop court').max(5000),
});

// ── Newsletter ──────────────────────────────────────────────────

export const newsletterSchema = z.object({
  email: emailSchema,
});
