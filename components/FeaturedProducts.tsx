'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type ProductImage = {
  url: string | null;
  alt?: string | null;
  position?: number | null;
};

type DBProduct = {
  id: string;
  slug: string;
  name: string | null;
  name_fr: string | null;
  name_en: string | null;
  image: string | null;
  image_url: string | null;
  price: number;
  rating: number | null;
  reviews?: number | null;
  product_images?: ProductImage[] | null;
};

const fallbackProducts: DBProduct[] = [
  {
    id: 'fallback-chemise-wax-grande',
    slug: 'chemise-wax-grande',
    name: 'Chemise Wax Grande',
    name_fr: 'Chemise Wax Grande',
    name_en: 'Large Wax Shirt',
    image: '/images/chemises/wax/chemise-wax-grande/01-main.png',
    image_url: '/images/chemises/wax/chemise-wax-grande/01-main.png',
    price: 15000,
    rating: 5,
  },
  {
    id: 'fallback-robe-ville-courte-noire',
    slug: 'robe-ville-courte-noire',
    name: 'Robe Ville Courte Noire',
    name_fr: 'Robe Ville Courte Noire',
    name_en: 'Short Black City Dress',
    image: '/images/robes/ville/robe-ville-courte-noire/grande/01-main.png',
    image_url: '/images/robes/ville/robe-ville-courte-noire/grande/01-main.png',
    price: 55000,
    rating: 5,
  },
  {
    id: 'fallback-super100-noir',
    slug: 'super100-noir',
    name: 'Super100 Noir',
    name_fr: 'Super100 Noir',
    name_en: 'Black Super100',
    image: '/images/costumes/super100/super100-noir/grande/01-main.png',
    image_url: '/images/costumes/super100/super100-noir/grande/01-main.png',
    price: 15000,
    rating: 5,
  },
  {
    id: 'fallback-super100-bleu',
    slug: 'super100-bleu',
    name: 'Super100 Bleu',
    name_fr: 'Super100 Bleu',
    name_en: 'Blue Super100',
    image: '/images/costumes/super100/super100-bleu/grande/01-main.png',
    image_url: '/images/costumes/super100/super100-bleu/grande/01-main.png',
    price: 15000,
    rating: 5,
  },
  {
    id: 'fallback-robe-ville-longue-blanche',
    slug: 'robe-ville-longue-blanche',
    name: 'Robe Ville Longue Blanche',
    name_fr: 'Robe Ville Longue Blanche',
    name_en: 'Long White City Dress',
    image: '/images/robes/ville/robe-ville-longue-blanche/grande/01-main.png',
    image_url: '/images/robes/ville/robe-ville-longue-blanche/grande/01-main.png',
    price: 25000,
    rating: 5,
  },
  {
    id: 'fallback-robe-wax-longue',
    slug: 'robe-wax-longue',
    name: 'Robe Wax Longue',
    name_fr: 'Robe Wax Longue',
    name_en: 'Long Wax Dress',
    image: '/images/robes/wax/robe-wax-longue/grande/01-main.png',
    image_url: '/images/robes/wax/robe-wax-longue/grande/01-main.png',
    price: 20000,
    rating: 5,
  },
  {
    id: 'fallback-robe-wax-courte',
    slug: 'robe-wax-courte',
    name: 'Robe Wax Courte',
    name_fr: 'Robe Wax Courte',
    name_en: 'Short Wax Dress',
    image: '/images/robes/wax/robe-wax-courte/grande/01-main.png',
    image_url: '/images/robes/wax/robe-wax-courte/grande/01-main.png',
    price: 20000,
    rating: 5,
  },
];

function getPrimaryProductImage(product: DBProduct) {
  const galleryImage = product.product_images?.find((image, index) => (
    Boolean(image.url) && (image.position === 0 || image.position === null || index === 0)
  ))?.url;

  return galleryImage || product.image_url || product.image || '';
}

function toLocalProductPath(src: string) {
  const marker = '/storage/v1/object/public/products/';
  const index = src.indexOf(marker);
  if (index >= 0) return `/${src.slice(index + marker.length)}`;
  return src.startsWith('/images/') ? src : '';
}

function handleImageError(event: SyntheticEvent<HTMLImageElement>, fallback: string) {
  const image = event.currentTarget;
  if (!fallback || image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
}

export default function FeaturedProducts() {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<DBProduct[]>(fallbackProducts);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    async function load() {
      try {
        const response = await fetch('/api/home-products?limit=8&excludeCustomOnly=1', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load featured products: ${response.status}`);
        }

        const payload = (await response.json()) as { products?: DBProduct[] };
        if (isMounted && payload.products?.length) {
          setItems(payload.products);
        }
      } catch (error) {
        if (isMounted && !controller.signal.aborted) {
          console.warn('[FeaturedProducts] Failed to load products:', error);
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    load();
    return () => {
      isMounted = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  const featured = items[0];
  const rest = items.slice(1, 7);

  const renderRating = (rating: number, name: string) => (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} ${locale === 'fr' ? 'étoiles sur 5' : 'stars out of 5'} ${name}`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={13}
          className={index < rating ? 'fill-nubia-gold text-nubia-gold' : 'text-nubia-gold/30'}
          aria-hidden="true"
        />
      ))}
    </span>
  );

  const productName = (product: DBProduct) => (
    locale === 'fr'
      ? product.name_fr || product.name || product.name_en || ''
      : product.name_en || product.name || product.name_fr || ''
  );

  const productCard = (product: DBProduct, featuredCard = false) => {
    const name = productName(product);
    const imageSrc = getPrimaryProductImage(product);
    const localImageSrc = toLocalProductPath(imageSrc);
    const displayImageSrc = localImageSrc || imageSrc;
    const fallback = localImageSrc && localImageSrc !== imageSrc ? imageSrc : '';
    const rating = Math.max(1, Math.min(5, product.rating ?? 5));

    return (
      <Link
        key={product.id}
        href={`/${locale}/produit/${product.slug}`}
        className={`group block overflow-hidden rounded-lg border border-nubia-gold/20 bg-nubia-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-nubia-gold/60 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-nubia-gold/20 ${featuredCard ? 'lg:col-span-2 lg:row-span-2' : ''}`}
        aria-label={`${t('home.discover', 'Discover')} ${name}`}
      >
        <div className={`relative overflow-hidden bg-nubia-cream/35 ${featuredCard ? 'h-[420px] md:h-[580px]' : 'h-72 md:h-80'}`}>
          {displayImageSrc && (
            <img
              src={displayImageSrc}
              alt={name}
              onError={(event) => handleImageError(event, fallback)}
              loading="eager"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-nubia-black/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <div className={featuredCard ? 'p-6 md:p-7' : 'p-4'}>
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3 className={`${featuredCard ? 'font-playfair text-3xl' : 'text-base'} font-bold leading-tight text-nubia-black transition-colors duration-300 group-hover:text-nubia-gold`}>
              {name}
            </h3>
            {renderRating(rating, name)}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-nubia-black">
              {product.price.toLocaleString('fr-FR')} {t('common.currency')}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-nubia-gold">
              {t('home.discover', 'Discover')}
              <ArrowRight size={14} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="py-16 md:py-20 bg-nubia-cream/35">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
              {t('home.featured_kicker', 'Selected pieces')}
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-nubia-black">
              {t('home.featured_title', 'Featured Products')}
            </h2>
            <p className="mt-4 text-lg leading-8 text-nubia-black/68">
              {t('home.featured_subtitle', 'A quick view of the pieces that best express the Nubia Aura silhouette.')}
            </p>
          </div>

          <Link
            href={`/${locale}/catalogue`}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-nubia-gold/35 px-5 py-3 font-semibold text-nubia-black transition-all duration-300 hover:border-nubia-gold hover:bg-nubia-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-nubia-gold/20 md:self-auto"
            aria-label={t('home.view_all', 'View all')}
          >
            {t('home.view_all', 'View all')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured && productCard(featured, true)}
          {rest.map((product) => productCard(product))}
        </div>
      </div>
    </section>
  );
}
