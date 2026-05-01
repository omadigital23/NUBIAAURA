'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Award,
  CheckCircle,
  Clock3,
  Heart,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getProductImageUrl } from '@/lib/media';

type ProductAsset = {
  src: string;
  fallback: string;
};

const productAsset = (path: string): ProductAsset => {
  const cleanPath = path.replace(/^\/+/, '');
  return {
    src: `/${cleanPath}`,
    fallback: getProductImageUrl(cleanPath),
  };
};

const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallback: string,
) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
};

export default function AboutPage() {
  const { t, locale } = useTranslation();

  const heroImages = [
    {
      asset: productAsset('images/banners/hero/hero-2.png'),
      alt: t('about.hero_image_primary', 'Nubia Aura collection'),
      className: 'col-span-3 row-span-6',
    },
    {
      asset: productAsset('images/robes/ceremonie/longues/robe-ceremonie-longue-doree/grande/01-main.png'),
      alt: t('about.hero_image_dress', 'Ceremony dress'),
      className: 'col-span-2 row-span-3',
    },
    {
      asset: productAsset('images/costumes/africains/costume-vert/grande/01-main.png'),
      alt: t('about.hero_image_suit', 'African suit'),
      className: 'col-span-2 row-span-3',
    },
  ];

  const stats = [
    {
      value: t('about.stat_experience_value', '10+'),
      label: t('about.stat_experience_label', 'Years of tailoring experience'),
    },
    {
      value: t('about.stat_model_value', '1:1'),
      label: t('about.stat_model_label', 'Custom guidance for every order'),
    },
    {
      value: t('about.stat_quality_value', '100%'),
      label: t('about.stat_quality_label', 'Final fit and finish review'),
    },
  ];

  const values = [
    {
      icon: Sparkles,
      title: t('about.creativity', 'Creativity'),
      description: t('about.creativityDesc', 'Each piece is unique and thoughtfully designed'),
    },
    {
      icon: Heart,
      title: t('about.authenticity', 'Authenticity'),
      description: t('about.authenticityDesc', 'We celebrate African heritage with pride'),
    },
    {
      icon: Zap,
      title: t('about.elegance', 'Elegance'),
      description: t('about.eleganceDesc', 'Our timeless designs combine refinement and sophistication'),
    },
  ];

  const process = [
    {
      icon: Ruler,
      step: '01',
      title: t('about.step1', 'Consultation'),
      description: t('about.step1Desc', 'You share your vision, measurements and preferences'),
    },
    {
      icon: Scissors,
      step: '02',
      title: t('about.step2', 'Creation'),
      description: t('about.step2Desc', 'Our artisans create your unique piece with care and attention'),
    },
    {
      icon: CheckCircle,
      step: '03',
      title: t('about.step3', 'Fitting'),
      description: t('about.step3Desc', 'You try on your creation and we make any necessary adjustments'),
    },
    {
      icon: ShieldCheck,
      step: '04',
      title: t('about.step4', 'Delivery'),
      description: t('about.step4Desc', 'You receive your perfect piece, ready to conquer the world'),
    },
  ];

  const approachPillars = [
    {
      icon: Award,
      title: t('about.pillar_identity_title', 'Identity'),
      description: t('about.pillar_identity_desc', 'A garment that keeps your culture visible without feeling dated.'),
    },
    {
      icon: Ruler,
      title: t('about.pillar_fit_title', 'Fit'),
      description: t('about.pillar_fit_desc', 'Measurements, posture and comfort guide every decision.'),
    },
    {
      icon: Clock3,
      title: t('about.pillar_care_title', 'Care'),
      description: t('about.pillar_care_desc', 'Clear communication from first brief to final delivery.'),
    },
  ];

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-nubia-black via-nubia-dark to-nubia-black text-nubia-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(212,175,55,0.16),transparent_36%,rgba(255,255,255,0.08)_74%,transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-nubia-gold/45 bg-nubia-gold/15 px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-nubia-gold">
                <Sparkles size={16} aria-hidden="true" />
                Nubia Aura
              </p>
              <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                {t('about.title', 'About Nubia Aura')}
              </h1>
              <p className="mt-6 text-xl leading-8 text-nubia-white/82">
                {t('about.subtitle', 'Creativity, Authenticity, African Elegance')}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-nubia-white/70">
                {t('about.hero_text', 'A fashion house built around expressive African silhouettes, thoughtful tailoring and a personal creation experience.')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/${locale}/sur-mesure`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-nubia-gold px-6 py-4 font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-2xl"
                >
                  <Scissors size={19} aria-hidden="true" />
                  {t('about.cta', 'Create Your Custom Outfit')}
                </Link>
                <Link
                  href={`/${locale}/catalogue`}
                  className="inline-flex items-center justify-center rounded-lg border border-nubia-white/25 px-6 py-4 font-semibold text-nubia-white transition-all duration-300 hover:border-nubia-gold hover:bg-nubia-white/10"
                >
                  {t('about.catalog_cta', 'Explore the collection')}
                </Link>
              </div>
            </div>

            <div className="grid h-[430px] grid-cols-5 grid-rows-6 gap-3 md:h-[540px]">
              {heroImages.map((image) => (
                <div key={image.alt} className={`${image.className} overflow-hidden rounded-lg border border-nubia-white/15 bg-nubia-white/5 shadow-2xl`}>
                  <img
                    src={image.asset.src}
                    alt={image.alt}
                    onError={(event) => handleImageError(event, image.asset.fallback)}
                    className="h-full w-full object-cover transition-transform duration-700 motion-safe:hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-3 border-t border-nubia-white/12 pt-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.value} className="rounded-lg border border-nubia-white/12 bg-nubia-white/[0.07] p-5">
                <p className="font-playfair text-4xl font-bold text-nubia-gold">{stat.value}</p>
                <p className="mt-2 text-sm leading-6 text-nubia-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-10 lg:gap-16 items-center">
            <div className="relative overflow-hidden rounded-lg border border-nubia-gold/20 bg-nubia-cream shadow-sm">
              <img
                src={productAsset('images/chemises/wax/chemise-wax-grande/03-detail.png').src}
                alt={t('about.mission_image_alt', 'Wax textile detail')}
                onError={(event) => handleImageError(event, productAsset('images/chemises/wax/chemise-wax-grande/03-detail.png').fallback)}
                className="h-[440px] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-nubia-black/85 to-transparent p-7">
                <p className="max-w-sm text-sm font-semibold leading-6 text-nubia-white/90">
                  {t('about.image_caption', 'Modern cuts, African textiles and a finish designed for everyday confidence.')}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                {t('about.mission_kicker', 'The house')}
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-nubia-black">
                {t('about.mission', 'Our Mission')}
              </h2>
              <p className="mt-6 text-lg leading-8 text-nubia-black/72">
                {t('about.missionText', 'At Nubia Aura, we value creativity and authenticity in your outfits.')}
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-5">
                  <ShieldCheck className="mb-4 text-nubia-gold" size={28} aria-hidden="true" />
                  <h3 className="font-playfair text-2xl font-bold text-nubia-black">
                    {t('about.mission_card_1_title', 'Personal by design')}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-nubia-black/65">
                    {t('about.mission_card_1_desc', 'Every brief starts with the person, not a template.')}
                  </p>
                </div>
                <div className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-5">
                  <Award className="mb-4 text-nubia-gold" size={28} aria-hidden="true" />
                  <h3 className="font-playfair text-2xl font-bold text-nubia-black">
                    {t('about.mission_card_2_title', 'Craft with restraint')}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-nubia-black/65">
                    {t('about.mission_card_2_desc', 'The silhouette, fabric and detail work together without excess.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-nubia-cream/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
              {t('about.values_kicker', 'Principles')}
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-nubia-black">
              {t('about.values', 'Our Values')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-nubia-gold/55 hover:shadow-xl"
                >
                  <Icon className="text-nubia-gold mb-5" size={38} aria-hidden="true" />
                  <h3 className="font-playfair text-2xl font-bold text-nubia-black">
                    {value.title}
                  </h3>
                  <p className="mt-3 leading-7 text-nubia-black/70">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                {t('about.founder_kicker', 'Creative direction')}
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-nubia-black">
                {t('about.founder', 'The Founder')}
              </h2>
              <h3 className="mt-4 text-2xl font-bold text-nubia-gold">
                {t('about.founderName', 'Nubia Aura')}
              </h3>
              <p className="mt-5 text-lg leading-8 text-nubia-black/72">
                {t('about.founderBio', 'Senegalese stylist passionate about African fashion, Nubia Aura creates pieces that tell stories.')}
              </p>
              <blockquote className="mt-8 rounded-lg border-l-4 border-nubia-gold bg-nubia-cream/60 p-6 text-lg italic leading-8 text-nubia-black/75">
                {t('about.founder_quote', 'Elegance should feel personal first, then visible to everyone else.')}
              </blockquote>
            </div>

            <div className="overflow-hidden rounded-lg border border-nubia-gold/20 bg-nubia-black shadow-sm">
              <img
                src={productAsset('images/robes/ceremonie/courtes/robe-ceremonie-courte-rose/grande/01-main.png').src}
                alt={t('about.founder_image_alt', 'Nubia Aura ceremony piece')}
                onError={(event) => handleImageError(event, productAsset('images/robes/ceremonie/courtes/robe-ceremonie-courte-rose/grande/01-main.png').fallback)}
                className="h-[460px] w-full object-cover"
              />
              <div className="border-t border-nubia-gold/25 p-6 text-nubia-white">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-nubia-gold">
                  {t('about.atelier_note_label', 'Atelier note')}
                </p>
                <p className="mt-2 text-sm leading-6 text-nubia-white/72">
                  {t('about.atelier_note_text', 'Each order is refined through silhouette, fabric choice and finish before delivery.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-nubia-cream/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
              {t('about.process_kicker', 'From brief to delivery')}
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-nubia-black">
              {t('about.process', 'Our Process')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {process.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-playfair text-4xl font-bold text-nubia-gold">{item.step}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nubia-gold text-nubia-black">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="font-playfair text-2xl font-bold text-nubia-black">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-nubia-black/68">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-lg bg-gradient-to-br from-nubia-black to-nubia-dark text-nubia-white">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="p-7 md:p-10 lg:p-12">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                  {t('about.approach_kicker', 'Method')}
                </p>
                <h2 className="font-playfair text-4xl md:text-5xl font-bold">
                  {t('about.approach', 'Our Approach')}
                </h2>
                <p className="mt-6 text-lg leading-8 text-nubia-white/75">
                  {t('about.approachText', 'Together, we will navigate through your world to deliver a product that meets your expectations.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-nubia-white/12 lg:border-l lg:border-t-0">
                {approachPillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.title} className="border-b border-nubia-white/12 p-7 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                      <Icon className="mb-5 text-nubia-gold" size={30} aria-hidden="true" />
                      <h3 className="font-playfair text-2xl font-bold text-nubia-white">
                        {pillar.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-nubia-white/68">{pillar.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-nubia-gold/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
            {t('about.cta_kicker', 'Start the brief')}
          </p>
          <h2 className="font-playfair text-3xl md:text-5xl font-bold leading-tight text-nubia-black">
            {t('about.cta_title', 'Ready to Create Your Outfit?')}
          </h2>
          <p className="mt-5 text-lg leading-8 text-nubia-black/70">
            {t('about.cta_description', 'Discover our custom creation process and let us help you create the piece of your dreams.')}
          </p>
          <Link
            href={`/${locale}/sur-mesure`}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-nubia-gold bg-nubia-gold px-8 py-4 font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-xl"
          >
            <Scissors size={19} aria-hidden="true" />
            {t('about.cta', 'Create Your Custom Outfit')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
