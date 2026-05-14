'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { withImageParams } from '@/lib/image-formats';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

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
  product_images?: ProductImage[] | null;
};

function getPrimaryProductImage(product?: DBProduct) {
  const imageFromGallery = product?.product_images?.find((image) => Boolean(image.url))?.url;
  return imageFromGallery || product?.image_url || product?.image || '';
}

export default function HeroSlider() {
  const { t, locale } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [items, setItems] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const heroSlugs = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_HERO_SLUGS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    []
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '5' });
        if (heroSlugs.length > 0) {
          params.set('slugs', heroSlugs.join(','));
        }

        const response = await fetch(`/api/home-products?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load hero products: ${response.status}`);
        }

        const payload = (await response.json()) as { products?: DBProduct[] };
        if (isMounted) {
          setItems(payload.products || []);
        }
      } catch (error) {
        if (isMounted && !controller.signal.aborted) {
          console.warn('[HeroSlider] Failed to load products:', error);
          setItems([]);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [heroSlugs]);

  useEffect(() => {
    if (!isAutoPlay || isHovered || items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlay, isHovered, items.length]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (items.length === 0 ? 0 : prev === 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  const goToNext = useCallback(() => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (items.length === 0 ? 0 : (prev + 1) % items.length));
  }, [items.length]);

  const goToSlide = useCallback((index: number) => {
    setIsAutoPlay(false);
    setCurrentIndex(index);
  }, []);

  const currentProduct = items[currentIndex];
  const displayName = currentProduct
    ? (locale === 'fr'
      ? currentProduct.name_fr || currentProduct.name || currentProduct.name_en || ''
      : currentProduct.name_en || currentProduct.name || currentProduct.name_fr || '')
    : '';
  const imageSrc = getPrimaryProductImage(currentProduct);
  const price = currentProduct?.price || 0;
  const rating = currentProduct?.rating ?? 5;

  // Crossfade animation variants
  const slideVariants: Variants = {
    enter: {
      opacity: 0,
      scale: 1.02,
    },
    center: {
      opacity: 1,
      scale: 1,
      transition: {
        opacity: { duration: 0.8, ease: 'easeInOut' },
        scale: { duration: 0.8, ease: 'easeOut' },
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        opacity: { duration: 0.6, ease: 'easeInOut' },
        scale: { duration: 0.6, ease: 'easeIn' },
      },
    },
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="relative h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 rounded-2xl overflow-hidden border border-nubia-gold/30">
        <div className="absolute inset-0 bg-nubia-gold/10 animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="h-8 bg-nubia-gold/20 rounded-lg w-2/3 mb-3 animate-pulse" />
          <div className="h-5 bg-nubia-gold/15 rounded-lg w-1/3 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br from-nubia-black to-nubia-dark rounded-2xl overflow-hidden border border-nubia-gold/30 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background slides with Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={`slide-${currentIndex}`}
            className="absolute inset-0"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {imageSrc ? (
              <motion.img
                src={withImageParams('hero', imageSrc)}
                alt={displayName}
                className="h-full w-full object-cover"
                // Ken Burns — slow zoom over the slide duration
                initial={{ scale: 1.0 }}
                animate={{ scale: 1.08 }}
                transition={{ duration: 6, ease: 'linear' }}
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-nubia-cream/40" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-nubia-black/70 via-nubia-black/20 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-nubia-black/40 to-transparent z-10" />

      {/* Product Info — animated */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`info-${currentIndex}`}
          className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20 text-nubia-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="font-playfair text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
            {displayName}
          </h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg md:text-xl font-semibold text-nubia-gold drop-shadow">
              {price.toLocaleString('fr-FR')} {t('common.currency')}
            </span>
            <span
              className="text-sm"
              role="img"
              aria-label={`${Math.max(1, Math.min(5, rating))} ${t('common.stars', 'étoiles sur 5')}`}
            >
              {'⭐'.repeat(Math.max(1, Math.min(5, rating)))}
            </span>
          </div>
          {currentProduct && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Link
                href={`/${locale}/produit/${currentProduct.slug}`}
                className="inline-block px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 shadow-lg"
                aria-label={`${t('home.discover', 'Découvrir')} ${displayName}`}
              >
                {t('home.discover', 'Découvrir')}
              </Link>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-nubia-black/50 hover:bg-nubia-gold text-nubia-white hover:text-nubia-black p-2 md:p-3 rounded-full transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform hover:scale-110 backdrop-blur-sm"
        aria-label={t('common.previous')}
      >
        <ChevronLeft size={22} />
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-nubia-black/50 hover:bg-nubia-gold text-nubia-white hover:text-nubia-black p-2 md:p-3 rounded-full transition-all duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform hover:scale-110 backdrop-blur-sm"
        aria-label={t('common.next')}
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots Navigation — gold themed */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-500 ${
              index === currentIndex
                ? 'bg-nubia-gold w-8 h-2.5 shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                : 'bg-nubia-white/40 hover:bg-nubia-white/70 w-2.5 h-2.5'
            }`}
            aria-label={`${t('common.go_to_slide', 'Aller à la diapositive')} ${index + 1}`}
          />
        ))}
      </div>

      {/* Counter badge */}
      <div className="absolute top-4 right-4 z-30 bg-nubia-black/60 text-nubia-gold px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm border border-nubia-gold/30">
        {items.length === 0 ? 0 : currentIndex + 1} / {items.length}
      </div>
    </div>
  );
}
