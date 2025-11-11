import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nubiaaura.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/catalogue',
    '/sur-mesure',
    '/a-propos',
    '/contact',
    '/produit',
    '/checkout',
    '/merci',
  ];

  const now = new Date();

  return routes.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
