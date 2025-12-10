import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .email('Email invalide')
  .toLowerCase()
  .trim();

// Phone validation (international format)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide')
  .trim();

// Password validation (min 8 chars, 1 uppercase, 1 number, 1 special char)
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*]/, 'Le mot de passe doit contenir au moins un caractère spécial');

// Name validation
export const nameSchema = z
  .string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(50, 'Le nom ne peut pas dépasser 50 caractères')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides')
  .trim();

// URL validation
export const urlSchema = z
  .string()
  .url('URL invalide')
  .trim();

// Amount validation (positive number with max 2 decimals)
export const amountSchema = z
  .number()
  .positive('Le montant doit être positif')
  .multipleOf(0.01, 'Le montant ne peut avoir plus de 2 décimales');

// Date validation
export const dateSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), 'Date invalide');

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
});

// Signup schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Contact form schema
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères').max(100),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères').max(5000),
});

// Custom order schema
export const customOrderSchema = z.object({
  customerName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères').max(2000),
  budget: amountSchema.optional(),
  deadline: dateSchema.optional(),
  reference: z.string().optional(),
});

// Order schema
export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: amountSchema,
  })).min(1, 'Au moins un article est requis'),
  shippingAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    zipCode: z.string().min(3),
    country: z.string().min(2),
  }),
  totalAmount: amountSchema,
});

// Payment schema
export const paymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: amountSchema,
  currency: z.enum(['XOF', 'USD', 'EUR']),
  paymentMethod: z.enum(['card', 'mobile_money', 'bank_transfer']),
});

// Return request schema
export const returnSchema = z.object({
  orderId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1, 'Au moins un article est requis'),
  reason: z.enum([
    'defective',
    'wrong_size',
    'wrong_color',
    'not_as_described',
    'changed_mind',
    'other',
  ]),
  comments: z.string().max(1000).optional(),
});

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Validate and sanitize
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const validated = schema.parse(data);
  
  // Recursively sanitize strings
  const sanitized = JSON.parse(
    JSON.stringify(validated),
    (_key, value) => {
      if (typeof value === 'string') {
        return sanitizeInput(value);
      }
      return value;
    }
  );
  
  return sanitized;
}
