import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nubiaaura.com';
const LOCALES = ['fr', 'en'] as const;

// Categories for the catalogue
const CATEGORIES = [
  'chemises',
  'chemises-wax',
  'costumes-africains',
  'costumes-classiques',
  'robes-mariage',
  'robes-ceremonie',
  'robes-ville',
  'robes-wax',
  'super100',
];

// Static pages
const STATIC_PAGES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/catalogue', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/sur-mesure', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/a-propos', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/mentions-legales', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/politique-de-confidentialite', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/conditions-generales', priority: 0.3, changeFrequency: 'yearly' as const },
];

async function getProducts() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true);

    return products || [];
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();
  const entries: MetadataRoute.Sitemap = [];

  // Add static pages for each locale
  for (const locale of LOCALES) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    // Add category pages
    for (const category of CATEGORIES) {
      entries.push({
        url: `${BASE_URL}/${locale}/catalogue/${category}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  }

  // Add product pages dynamically
  const products = await getProducts();
  for (const product of products) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}/produit/${product.slug}`,
        lastModified: product.updated_at || now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  // Add main homepage (redirect)
  entries.push({
    url: BASE_URL,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1.0,
  });

  return entries;
}

// Enable dynamic generation
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
