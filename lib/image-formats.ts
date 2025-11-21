export type ImageUsage =
  | 'hero'
  | 'catalog'
  | 'cover'
  | 'gallery'
  | 'variant'
  | 'category'
  | 'og'
  | 'thumbnail'
  | 'icon'
  | 'avatar';

const presets: Record<ImageUsage, { w?: number; h?: number; fit?: string; sizes?: string }> = {
  hero: { w: 1200, h: 675, fit: 'crop', sizes: '(max-width: 768px) 100vw, 50vw' },
  catalog: { w: 500, h: 600, fit: 'crop', sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw' },
  cover: { w: 1200, h: 1500, fit: 'crop', sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw' },
  gallery: { w: 800, h: 1000, fit: 'crop', sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw' },
  variant: { w: 1000, h: 1200, fit: 'crop', sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw' },
  category: { w: 800, h: 600, fit: 'crop', sizes: '(max-width: 1024px) 50vw, 25vw' },
  og: { w: 1200, h: 630, fit: 'crop', sizes: '100vw' },
  thumbnail: { w: 300, h: 360, fit: 'crop', sizes: '(max-width: 768px) 80px, 100px' },
  icon: { sizes: '48px' },
  avatar: { w: 256, h: 256, fit: 'crop', sizes: '128px' },
};

const isExternal = (src: string) => /^https?:\/\//i.test(src);

function adjustLocalPathForUsage(usage: ImageUsage, src: string) {
  // Only rewrite if path looks like our public schema and contains a size folder
  // Expected folders: petite / moyenne / grande
  const hasSizeSegment = /\/(petite|moyenne|grande)\//.test(src);
  if (!hasSizeSegment) return src;

  // Always keep /grande/ if it exists - this is where the main image is
  // Never downsize from grande to petite/moyenne for landing page
  if (src.includes('/grande/')) {
    return src;
  }

  const desired = (() => {
    switch (usage) {
      case 'catalog':
      case 'thumbnail':
        return 'petite';
      case 'cover':
      case 'gallery':
      case 'variant':
        return 'moyenne';
      case 'og':
        return 'grande';
      default:
        return null;
    }
  })();

  if (!desired) return src;
  return src.replace(/\/(petite|moyenne|grande)\//, `/${desired}/`);
}

export function withImageParams(usage: ImageUsage, src: string) {
  if (!src) return src;

  // Fix protocol-relative URLs (// -> https://)
  if (src.startsWith('//')) {
    src = 'https:' + src;
  }

  const base = process.env.NEXT_PUBLIC_IMAGE_BASE || 'https://exjtjbciznzyyqrfctsc.supabase.co/storage/v1/object/public';
  const bucket = process.env.NEXT_PUBLIC_IMAGE_BUCKET || 'products';

  // Supabase Storage URLs: return as-is (don't add params)
  if (src.includes('supabase.co')) {
    return src;
  }

  // Local public/ images: rewrite size folder according to usage, and optionally prefix with Supabase public URL
  if (!isExternal(src)) {
    let path = adjustLocalPathForUsage(usage, src);
    let cleanedBase = base.replace(/\/$/, '');

    // Ensure base URL has https:// protocol (fix protocol-relative URLs)
    if (cleanedBase.startsWith('//')) {
      cleanedBase = 'https:' + cleanedBase;
    }

    if (path.startsWith('/images/')) {
      // Map /images/... to <base>/<bucket>/images/...
      path = `${cleanedBase}/${bucket}${path}`;
    } else if (path.startsWith('images/')) {
      // Map images/... (without leading slash) as well
      path = `${cleanedBase}/${bucket}/${path}`;
    } else if (path.startsWith('products/')) {
      // Map products/... directly to <base>/products/...
      path = `${cleanedBase}/${path}`;
    }

    // Final safety check: ensure no protocol-relative URLs escape
    if (path.startsWith('//')) {
      path = 'https:' + path;
    }

    return path;
  }

  // External images (Unsplash, etc): apply URL params
  const url = new URL(src);
  const p = presets[usage];
  if (p.w) url.searchParams.set('w', String(p.w));
  if (p.h) url.searchParams.set('h', String(p.h));
  if (p.fit) url.searchParams.set('fit', p.fit);
  return url.toString();
}

export function sizesFor(usage: ImageUsage) {
  return presets[usage]?.sizes || undefined;
}
