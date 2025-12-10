'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { withImageParams } from '@/lib/image-formats';
import OptimizedImage from '@/components/OptimizedImage';
import { CUSTOM_ONLY_CATEGORIES } from '@/lib/custom-categories';

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
  reviews: number | null;
  product_images?: Array<{ url: string; alt?: string; position?: number }> | null;
};

export default function FeaturedProducts() {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      // ⚠️ Catégories réservées au Sur-Mesure - NE PAS afficher sur homepage
      const { data } = await supabase
        .from('products')
        .select('id, slug, name, name_fr, name_en, image, image_url, price, rating, reviews, category, product_images(url, alt, position)')
        .eq('inStock', true)
        .not('category', 'in', `(${CUSTOM_ONLY_CATEGORIES.map(c => `"${c}"`).join(',')})`)
        .order('rating', { ascending: false, nullsFirst: false })
        .order('reviews', { ascending: false, nullsFirst: false })
        .limit(8);

      if (!isMounted) return;

      // Trier les product_images par position pour chaque produit
      const sortedData = (data || []).map((product: any) => ({
        ...product,
        product_images: product.product_images
          ? [...product.product_images].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          : []
      }));

      setItems(sortedData);
      setLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-16 bg-nubia-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black">
            {t('home.featured_title', 'Produits à la une')}
          </h2>
          <Link
            href={`/${locale}/catalogue`}
            className="text-nubia-gold hover:underline focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded"
            aria-label={t('home.view_all', 'Voir tout le catalogue')}
          >
            {t('home.view_all', 'Voir tout')}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-nubia-cream/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((p) => {
              const name = locale === 'fr'
                ? (p.name_fr || p.name || '')
                : (p.name_en || '');
              // Utiliser product_images[0] (main image avec position 0) comme sur la page de détail
              const mainImage = p.product_images && p.product_images.length > 0
                ? p.product_images.find(img => img.position === 0 || img.position === null || p.product_images!.indexOf(img) === 0)?.url
                : null;
              const imageSrc = mainImage || p.image_url || p.image || '';
              return (
                <Link
                  key={p.id}
                  href={`/${locale}/produit/${p.slug}`}
                  className="group border border-nubia-gold/20 rounded-xl overflow-hidden bg-white hover:shadow-2xl hover:border-nubia-gold/60 transition-all duration-300 transform hover:-translate-y-2 block cursor-pointer focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
                  aria-label={`Découvrir ${name}`}
                >
                  <div className="relative w-full h-96 bg-nubia-cream/30 overflow-hidden">
                    {imageSrc && (
                      <OptimizedImage
                        src={withImageParams('thumbnail', imageSrc)}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="group-hover:scale-110 transition-transform duration-500"
                        objectFit="cover"
                      />)
                    }
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-nubia-black truncate group-hover:text-nubia-gold transition-colors duration-300" title={name}>{name}</h3>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="font-semibold group-hover:text-nubia-gold transition-colors duration-300">
                        {p.price.toLocaleString('fr-FR')} {t('common.currency')}
                      </span>
                      <span
                        className="text-nubia-black/60 group-hover:text-nubia-gold transition-colors duration-300"
                        role="img"
                        aria-label={`${Math.max(1, Math.min(5, p.rating ?? 5))} étoiles sur 5`}
                      >
                        {'⭐'.repeat(Math.max(1, Math.min(5, p.rating ?? 5)))}
                      </span>
                    </div>
                    <div className="mt-3 inline-block text-nubia-gold hover:text-nubia-black transition-colors group-hover:font-semibold">
                      {t('home.discover', 'Découvrir')}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
