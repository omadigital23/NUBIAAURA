// Utilities to build public Supabase Storage URLs for media files
// Keep only relative paths (e.g., "images/banners/hero/hero1.png") in code or DB
// and construct absolute public URLs at runtime.

const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET || 'media';

if (!PROJECT_URL) {
  // This throws only during build/server if misconfigured; it won't leak secrets.
  throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL for media URLs');
}

/**
 * Build a public URL for a file stored under the public bucket.
 * @param relativePath - e.g., "images/banners/hero/hero1.png"
 * @param bucket - defaults to `media`
 */
export function getPublicMediaUrl(relativePath: string, bucket: string = DEFAULT_BUCKET): string {
  if (!relativePath) return '';
  const clean = relativePath.replace(/^\/+/, '');
  return `${PROJECT_URL}/storage/v1/object/public/${bucket}/${clean}`;
}

/**
 * Convenience helper for images.
 */
export function img(path: string): string {
  return getPublicMediaUrl(path);
}

/**
 * Build a public URL for product images (from 'products' bucket)
 * @param relativePath - e.g., "images/visa.png"
 */
export function getProductImageUrl(relativePath: string): string {
  return getPublicMediaUrl(relativePath, 'products');
}
