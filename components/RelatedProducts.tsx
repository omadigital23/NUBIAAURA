'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';
import { withImageParams } from '@/lib/image-formats';
import OptimizedImage from '@/components/OptimizedImage';

type Item = {
  id: string;
  slug: string;
  name: string | null;
  name_fr: string | null;
  name_en: string | null;
  image: string | null;
  image_url: string | null;
  price: number;
  rating: number | null;
  product_images?: Array<{
    url: string | null;
    alt?: string | null;
    position?: number | null;
  }> | null;
};

function getPrimaryImage(item: Item) {
  const galleryImage = item.product_images
    ?.filter((image) => Boolean(image.url))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0]?.url;

  return galleryImage || item.image || item.image_url || '';
}

export default function RelatedProducts({
  category,
  excludeId,
  locale,
}: {
  category?: string | null;
  excludeId: string;
  locale: string;
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        let q = supabase
          .from('products')
          .select('id, slug, name, name_fr, name_en, image, image_url, price, rating, product_images(url, alt, position)')
          .neq('id', excludeId)
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(4);

        if (category) q = q.eq('category', category);

        const { data, error } = await q;
        if (error) throw error;
        if (!mounted) return;
        setItems((data || []) as Item[]);
      } catch (error) {
        if (!mounted) return;
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[RelatedProducts] Failed to load related products:', error);
        }
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [category, excludeId]);

  if (!category) return null;

  return (
    <motion.section
      className="mt-16"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nubia-gold">
            Nubia Aura
          </p>
          <h2 className="mt-2 font-playfair text-2xl font-bold text-nubia-black">
            {t('product.relatedProducts', 'Produits associés')}
          </h2>
        </div>
        <Link
          href={`/${locale}/catalogue`}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-nubia-gold transition-all duration-300 hover:gap-3 hover:text-nubia-black"
        >
          {t('home.view_all', 'Voir tout')}
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 rounded-lg bg-nubia-cream/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-nubia-gold/20 bg-nubia-cream/20 px-5 py-8 text-sm text-nubia-black/60">
          {t('product.no_related', 'Aucun produit associé')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((p, index) => {
            const name = locale === 'fr' ? (p.name_fr || p.name || '') : (p.name_en || p.name || '');
            const imageSrc = getPrimaryImage(p);
            const rating = Math.max(1, Math.min(5, Math.floor(p.rating ?? 5)));

            return (
              <motion.div
                key={p.id}
                transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.05 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  href={`/${locale}/produit/${p.slug}`}
                  className="group block overflow-hidden rounded-lg border border-nubia-gold/20 bg-white shadow-sm transition-all duration-300 hover:border-nubia-gold/45 hover:shadow-[0_18px_45px_rgba(0,0,0,0.10)]"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-nubia-cream/30 md:h-52">
                    {imageSrc && (
                      <OptimizedImage
                        src={withImageParams('thumbnail', imageSrc)}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        objectFit="cover"
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-nubia-black/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                  <div className="p-4">
                    <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-nubia-black" title={name}>
                      {name}
                    </div>
                    <div className="mt-3 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-bold text-nubia-gold">
                        {p.price.toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-nubia-black/60">
                        {Array.from({ length: rating }).map((_, starIndex) => (
                          <Star key={starIndex} size={12} fill="currentColor" className="text-nubia-gold" />
                        ))}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
