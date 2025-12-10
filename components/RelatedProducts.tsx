'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
};

export default function RelatedProducts({ category, excludeId, locale }: { category?: string | null; excludeId: string; locale: string }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      let q = supabase
        .from('products')
        .select('id, slug, name, name_fr, name_en, image, image_url, price, rating')
        .neq('id', excludeId)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(4);
      if (category) q = q.eq('category', category);
      const { data } = await q;
      if (!mounted) return;
      setItems(data || []);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [category, excludeId]);

  if (!category) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-playfair text-2xl font-bold text-nubia-black">{t('product.relatedProducts', 'Produits associés')}</h2>
        <Link href={`/${locale}/catalogue`} className="text-nubia-gold hover:underline">{t('home.view_all', 'Voir tout')}</Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-nubia-cream/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-nubia-black/60">{t('product.no_related', 'Aucun produit associé')}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((p) => {
            const name = locale === 'fr' ? (p.name_fr || p.name || '') : (p.name_en || '');
            // Utiliser product.image ou product.image_url (image de face principal)
            const imageSrc = p.image || p.image_url || '';
            return (
              <Link href={`/${locale}/produit/${p.slug}`} key={p.id} className="group border border-nubia-gold/20 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                <div className="relative w-full h-40 bg-nubia-cream/30 overflow-hidden">
                  {imageSrc && (
                    <OptimizedImage src={withImageParams('thumbnail', imageSrc)} alt={name} fill sizes="(max-width: 768px) 50vw, 25vw" objectFit="cover" />
                  )}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm truncate" title={name}>{name}</div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-semibold">{p.price.toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}</span>
                    <span className="text-nubia-black/60">{'⭐'.repeat(Math.max(1, Math.min(5, p.rating ?? 5)))}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
