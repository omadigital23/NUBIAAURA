'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { SyntheticEvent } from 'react';
import {
  ArrowRight,
  Award,
  Crown,
  Gem,
  MessageCircle,
  Palette,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import Header from '@/components/Header';
import FeaturedProducts from '@/components/FeaturedProducts';
import AnimatedSection from '@/components/AnimatedSection';
import { useTranslation } from '@/hooks/useTranslation';
import { getProductImageUrl } from '@/lib/media';

const WhyChooseUs = dynamic(() => import('@/components/WhyChooseUs'), {
  loading: () => <div className="py-16 bg-nubia-cream/20"><div className="h-64 animate-pulse" /></div>,
});
const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  loading: () => <div className="py-16"><div className="h-48 animate-pulse bg-nubia-cream/20 rounded-lg" /></div>,
});
const FAQ = dynamic(() => import('@/components/FAQ'), {
  loading: () => <div className="py-16"><div className="h-48 animate-pulse bg-nubia-cream/20 rounded-lg" /></div>,
});
const NewsletterForm = dynamic(() => import('@/components/NewsletterForm'), {
  loading: () => <div className="h-12 animate-pulse bg-nubia-gold/20 rounded-lg" />,
});
const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => <div className="h-64 bg-nubia-black" />,
});

type ProductAsset = {
  src: string;
  fallback: string;
};

const productAsset = (path: string): ProductAsset => {
  const cleanPath = path.replace(/^\/+/, '');
  return {
    src: getProductImageUrl(cleanPath),
    fallback: `/${cleanPath}`,
  };
};

const handleImageError = (
  event: SyntheticEvent<HTMLImageElement>,
  fallback: string,
) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
};

export default function Home() {
  const { t, locale } = useTranslation();

  const heroImages = [
    {
      asset: productAsset('images/banners/category/robes-mariage.png'),
      alt: t('home.hero_image_primary', 'Nubia Aura wedding dress'),
      className: 'col-span-3 row-span-6',
    },
    {
      asset: productAsset('images/robes/ceremonie/longues/robe-ceremonie-longue-doree/grande/01-main.png'),
      alt: t('home.hero_image_ceremony', 'Gold ceremony dress'),
      className: 'col-span-2 row-span-3',
    },
    {
      asset: productAsset('images/costumes/africains/costume-vert/grande/01-main.png'),
      alt: t('home.hero_image_suit', 'Green African suit'),
      className: 'col-span-2 row-span-3',
    },
  ];

  const proofPoints = [
    {
      icon: Scissors,
      value: t('home.proof_piece_value', 'Signature pieces'),
      label: t('home.proof_piece_label', 'Ready-to-wear and custom creations'),
    },
    {
      icon: Ruler,
      value: t('home.proof_custom_value', 'Made to measure'),
      label: t('home.proof_custom_label', 'Guided fit and style brief'),
    },
    {
      icon: Truck,
      value: t('home.proof_delivery_value', 'Fast delivery'),
      label: t('home.proof_delivery_label', 'Senegal and international shipping'),
    },
  ];

  const valueCards = [
    {
      icon: Award,
      title: t('home.quality'),
      description: t('home.quality_desc'),
    },
    {
      icon: Palette,
      title: t('home.creativity'),
      description: t('home.creativity_desc'),
    },
    {
      icon: Crown,
      title: t('home.elegance'),
      description: t('home.elegance_desc'),
    },
    {
      icon: Gem,
      title: t('home.authenticity'),
      description: t('home.authenticity_desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section
        className="relative overflow-hidden bg-gradient-to-br from-nubia-black via-nubia-dark to-nubia-black text-nubia-white"
        aria-label={t('home.hero_aria', 'Nubia Aura homepage hero')}
      >
        <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(212,175,55,0.18),transparent_36%,rgba(255,255,255,0.08)_76%,transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-12 lg:gap-16 items-center">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-nubia-gold/45 bg-nubia-gold/15 px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-nubia-gold">
                <Sparkles size={16} aria-hidden="true" />
                {t('home.hero_kicker', 'African elegance')}
              </div>

              <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-nubia-white">
                {t('home.hero_title')}
              </h1>

              <p className="mt-6 text-lg md:text-xl leading-8 text-nubia-white/82">
                {t('home.hero_description')}
              </p>

              <p className="mt-4 text-base md:text-lg font-medium text-nubia-gold/95">
                {t('home.hero_note', 'Ready-to-wear, ceremony pieces and custom tailoring designed around your presence.')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/${locale}/catalogue`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-nubia-gold px-6 py-4 font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-nubia-gold/30"
                  aria-label={t('home.discover_catalog', 'Discover catalog')}
                >
                  {t('home.discover_catalog')}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>

                <Link
                  href={`/${locale}/sur-mesure`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-nubia-white/25 px-6 py-4 font-semibold text-nubia-white transition-all duration-300 hover:border-nubia-gold hover:bg-nubia-white/10 focus:outline-none focus:ring-4 focus:ring-nubia-gold/20"
                  aria-label={t('home.custom_order', 'Order custom')}
                >
                  <Scissors size={18} aria-hidden="true" />
                  {t('home.custom_order')}
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {proofPoints.map((point) => {
                  const Icon = point.icon;
                  return (
                    <div key={point.value} className="rounded-lg border border-nubia-white/12 bg-nubia-white/[0.07] p-4 backdrop-blur">
                      <Icon className="mb-3 text-nubia-gold" size={22} aria-hidden="true" />
                      <p className="text-sm font-bold text-nubia-white">{point.value}</p>
                      <p className="mt-1 text-xs leading-5 text-nubia-white/65">{point.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid h-[430px] grid-cols-5 grid-rows-6 gap-3 md:h-[540px]">
              {heroImages.map((image) => (
                <div
                  key={image.alt}
                  className={`${image.className} overflow-hidden rounded-lg border border-nubia-white/15 bg-nubia-white/5 shadow-2xl`}
                >
                  <img
                    src={image.asset.src}
                    alt={image.alt}
                    onError={(event) => handleImageError(event, image.asset.fallback)}
                    className="h-full w-full object-cover transition-transform duration-700 motion-safe:hover:scale-105"
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="py-16 md:py-20 bg-nubia-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center">
              <div className="relative overflow-hidden rounded-lg border border-nubia-gold/20 bg-nubia-cream shadow-sm">
                <img
                  src={productAsset('images/chemises/wax/chemise-wax-grande/03-detail.png').src}
                  alt={t('home.about_image_alt', 'Wax shirt detail')}
                  onError={(event) => handleImageError(event, productAsset('images/chemises/wax/chemise-wax-grande/03-detail.png').fallback)}
                  className="h-[420px] w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-nubia-black/85 to-transparent p-7">
                  <p className="max-w-sm text-sm font-semibold leading-6 text-nubia-white/90">
                    {t('home.about_image_caption', 'Modern African fashion, refined for real occasions and everyday confidence.')}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                  {t('home.about_kicker', 'The house')}
                </p>
                <h2 className="font-playfair text-4xl md:text-5xl font-bold text-nubia-black">
                  {t('home.about_title')}
                </h2>
                <p className="mt-6 text-lg leading-8 text-nubia-black/72">
                  {t('home.about_description')}
                </p>
                <p className="mt-4 text-lg leading-8 text-nubia-black/72">
                  {t('home.about_description2')}
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {valueCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.title} className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-nubia-gold/55 hover:shadow-xl">
                        <Icon className="mb-4 text-nubia-gold" size={28} aria-hidden="true" />
                        <h3 className="font-playfair text-2xl font-bold text-nubia-black">
                          {card.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-nubia-black/65">
                          {card.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href={`/${locale}/a-propos`}
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-nubia-gold px-6 py-4 font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-nubia-gold/20"
                  aria-label={t('home.learn_more', 'Learn more')}
                >
                  {t('home.learn_more')}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="bg-gradient-to-br from-nubia-black to-nubia-dark text-nubia-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-8 lg:gap-12 items-center">
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                  {t('home.cta_kicker', 'Custom creation')}
                </p>
                <h2 className="font-playfair text-3xl md:text-5xl font-bold leading-tight">
                  {t('home.cta_title')}
                </h2>
                <p className="mt-5 text-lg leading-8 text-nubia-white/75">
                  {t('home.cta_description')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={`/${locale}/catalogue`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-nubia-gold px-6 py-4 font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-nubia-gold/30"
                  aria-label={t('home.discover_catalog', 'Discover catalog')}
                >
                  {t('home.discover_catalog')}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-nubia-gold/55 px-6 py-4 font-semibold text-nubia-white transition-all duration-300 hover:bg-nubia-white/10 focus:outline-none focus:ring-4 focus:ring-nubia-gold/20"
                  aria-label={t('nav.contact', 'Contact')}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  {t('nav.contact')}
                </Link>
                <div className="sm:col-span-2 rounded-lg border border-nubia-white/12 bg-nubia-white/[0.07] p-5">
                  <ShieldCheck className="mb-3 text-nubia-gold" size={24} aria-hidden="true" />
                  <p className="font-semibold text-nubia-white">
                    {t('home.cta_trust_title', 'Secure payment and direct atelier support')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-nubia-white/68">
                    {t('home.cta_trust_desc', 'Flutterwave payments, WhatsApp assistance and order follow-up from the team.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <FeaturedProducts />

      <WhyChooseUs />

      <Testimonials />

      <FAQ />

      <AnimatedSection>
        <section className="py-10 md:py-12 lg:py-16 bg-gradient-to-br from-nubia-gold/10 via-nubia-white to-nubia-gold/5 text-nubia-black border-y border-nubia-gold/20" aria-label={t('home.newsletter_aria', 'Newsletter signup')}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-playfair text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
              {t('home.newsletter_title')}
            </h2>
            <p className="text-sm md:text-base text-nubia-black/85 mb-5 md:mb-6">
              {t('home.newsletter_subtitle')}
            </p>

            <NewsletterForm />

            <p className="text-xs text-nubia-black/75 mt-3 md:mt-4">
              {t('home.newsletter_privacy')}
            </p>
          </div>
        </section>
      </AnimatedSection>
      <Footer />
    </div>
  );
}
