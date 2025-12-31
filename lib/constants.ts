/**
 * Constantes de l'application
 */

// Site
export const SITE_NAME = 'Nubia Aura';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nubiaaura.com';
export const SITE_DESCRIPTION = 'Plateforme de mode africaine alliant créativité, authenticité et élégance';

// Devise
export const CURRENCY = 'FCFA';
export const CURRENCY_SYMBOL = 'FCFA';

// Locales
export const DEFAULT_LOCALE = 'fr';
export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Images
export const IMAGE_FORMATS = {
  thumbnail: { width: 400, height: 600, quality: 75 },
  card: { width: 600, height: 800, quality: 80 },
  detail: { width: 1200, height: 1600, quality: 85 },
  hero: { width: 1920, height: 1080, quality: 90 },
} as const;

// Shipping
export const SHIPPING_METHODS = {
  standard: {
    id: 'standard',
    name_fr: 'Livraison Standard',
    name_en: 'Standard Delivery',
    price: 2500,
    duration_fr: '3-5 jours ouvrables',
    duration_en: '3-5 business days',
  },
  express: {
    id: 'express',
    name_fr: 'Livraison Express',
    name_en: 'Express Delivery',
    price: 5000,
    duration_fr: '1-2 jours ouvrables',
    duration_en: '1-2 business days',
  },
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  cod: {
    id: 'cod',
    name_fr: 'Paiement à la livraison',
    name_en: 'Cash on Delivery',
    icon: '💵',
    countries: ['SN', 'MA'],
  },
  paydunya: {
    id: 'paydunya',
    name_fr: 'Mobile Money / Carte',
    name_en: 'Mobile Money / Card',
    icon: '📱',
    countries: ['SN', 'CI', 'ML', 'BJ', 'MA'],
    description_fr: 'Wave, Orange Money, Carte bancaire',
    description_en: 'Wave, Orange Money, Credit Card',
  },
} as const;

// Order Status
export const ORDER_STATUS = {
  pending: {
    label_fr: 'En attente',
    label_en: 'Pending',
    color: 'yellow',
  },
  confirmed: {
    label_fr: 'Confirmée',
    label_en: 'Confirmed',
    color: 'blue',
  },
  processing: {
    label_fr: 'En préparation',
    label_en: 'Processing',
    color: 'purple',
  },
  shipped: {
    label_fr: 'Expédiée',
    label_en: 'Shipped',
    color: 'indigo',
  },
  delivered: {
    label_fr: 'Livrée',
    label_en: 'Delivered',
    color: 'green',
  },
  cancelled: {
    label_fr: 'Annulée',
    label_en: 'Cancelled',
    color: 'red',
  },
} as const;

// Contact
export const CONTACT = {
  email: 'contact@nubiaaura.com',
  phone: '+221 77 123 45 67',
  whatsapp: '+221771234567',
  address: 'Dakar, Sénégal',
  social: {
    instagram: 'https://instagram.com/nubiaaura',
    facebook: 'https://facebook.com/nubiaaura',
    tiktok: 'https://tiktok.com/@nubiaaura',
  },
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  api: {
    requests: 100,
    window: '1m',
  },
  auth: {
    requests: 5,
    window: '15m',
  },
  payment: {
    requests: 10,
    window: '1h',
  },
} as const;

// Cache TTL (en secondes)
export const CACHE_TTL = {
  products: 300, // 5 minutes
  categories: 600, // 10 minutes
  user: 60, // 1 minute
  cart: 0, // Pas de cache
} as const;
