'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { withImageParams } from '@/lib/image-formats';
import OptimizedImage from '@/components/OptimizedImage';

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
};

export default function HeroSlider() {
  const { t, locale } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [items, setItems] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const HERO_SLUGS = (process.env.NEXT_PUBLIC_HERO_SLUGS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      let data: DBProduct[] | null = null;
      let error: any = null;

      try {
        const base = supabase
          .from('products')
          .select('id, slug, name, name_fr, name_en, image, image_url, price, rating');

        if (HERO_SLUGS.length > 0) {
          const { data: d, error: e } = await base.in('slug', HERO_SLUGS).limit(5);
          data = d as any;
          error = e;
          // Preserve the order defined in HERO_SLUGS
          if (data) {
            const orderMap = new Map(HERO_SLUGS.map((s, i) => [s, i] as const));
            data.sort((a: any, b: any) => (orderMap.get(a.slug) ?? 999) - (orderMap.get(b.slug) ?? 999));
          }
        } else {
          const { data: d, error: e } = await base
            .eq('inStock', true)
            .order('rating', { ascending: false, nullsFirst: false })
            .limit(5);
          data = d as any;
          error = e;
        }
      } catch (e: any) {
        error = e;
      }

      if (!isMounted) return;
      if (error) setItems([]);
      else setItems(data || []);
      setLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlay || items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlay, items.length]);

  const goToPrevious = () => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (items.length === 0 ? 0 : prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (items.length === 0 ? 0 : (prev + 1) % items.length));
  };

  const goToSlide = (index: number) => {
    setIsAutoPlay(false);
    setCurrentIndex(index);
  };

  const currentProduct = items[currentIndex];
  const displayName = currentProduct
    ? (locale === 'fr'
      ? currentProduct.name_fr || currentProduct.name || currentProduct.name_en || ''
      : currentProduct.name_en || currentProduct.name || currentProduct.name_fr || '')
    : '';
  const imageSrc = currentProduct?.image || currentProduct?.image_url || '';
  const price = currentProduct?.price || 0;
  const rating = currentProduct?.rating ?? 5;



  return (
    <div className="relative h-full min-h-screen bg-gradient-to-br from-nubia-gold/20 to-nubia-gold/5 rounded-2xl overflow-hidden border border-nubia-gold/30 group">
      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <OptimizedImage
            src={withImageParams('hero', imageSrc)}
            alt={displayName}
            fill
            sizes="100vw"
            priority={currentIndex === 0}
            objectFit="cover"
            className="transition-opacity duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-nubia-cream/40" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-nubia-black/40 to-transparent" />

        {/* Product Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-nubia-white">
          <h3 className="font-playfair text-2xl font-bold mb-2">{loading ? t('common.loading') : displayName}</h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">
              {price.toLocaleString('fr-FR')} {t('common.currency')}
            </span>
            <span className="text-sm" role="img" aria-label={`${Math.max(1, Math.min(5, rating))} étoiles sur 5`}>
              {'⭐'.repeat(Math.max(1, Math.min(5, rating)))}
            </span>
          </div>
          {currentProduct && (
            <Link
              href={`/${locale}/produit/${currentProduct.slug}`}
              className="inline-block px-6 py-2 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
              aria-label={`Découvrir ${displayName}`}
            >
              {t('home.discover', 'Découvrir')}
            </Link>
          )}
        </div>
      </div>

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-nubia-gold/80 hover:bg-nubia-gold text-nubia-black p-2 rounded-full transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform hover:scale-110"
        aria-label={t('common.previous')}
      >
        <ChevronLeft size={24} />
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-nubia-gold/80 hover:bg-nubia-gold text-nubia-black p-2 rounded-full transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform hover:scale-110"
        aria-label={t('common.next')}
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
              ? 'bg-nubia-gold w-8'
              : 'bg-nubia-white/50 hover:bg-nubia-white/80 w-2'
              }`}
            aria-label={`Aller à la diapositive ${index + 1}`}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 z-20 bg-nubia-black/60 text-nubia-gold px-3 py-1 rounded-full text-sm font-semibold">
        {items.length === 0 ? 0 : currentIndex + 1} / {items.length}
      </div>
    </div>
  );
}
