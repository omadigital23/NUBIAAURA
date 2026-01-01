'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import HeroSlider from '@/components/HeroSlider';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCard from '@/components/AnimatedCard';
import { useTranslation } from '@/hooks/useTranslation';
import WhatsAppButton from '@/components/WhatsAppButton';

// Lazy loading des composants below-the-fold pour améliorer les performances
const FeaturedProducts = dynamic(() => import('@/components/FeaturedProducts'), {
  loading: () => <div className="py-16 bg-nubia-white"><div className="max-w-7xl mx-auto px-4"><div className="h-96 animate-pulse bg-nubia-cream/30 rounded-xl" /></div></div>,
});
const WhyChooseUs = dynamic(() => import('@/components/WhyChooseUs'), {
  loading: () => <div className="py-16 bg-nubia-cream/20"><div className="h-64 animate-pulse" /></div>,
});
const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  loading: () => <div className="py-16"><div className="h-48 animate-pulse bg-nubia-cream/20 rounded-xl" /></div>,
});
const FAQ = dynamic(() => import('@/components/FAQ'), {
  loading: () => <div className="py-16"><div className="h-48 animate-pulse bg-nubia-cream/20 rounded-xl" /></div>,
});
const NewsletterForm = dynamic(() => import('@/components/NewsletterForm'), {
  loading: () => <div className="h-12 animate-pulse bg-nubia-gold/20 rounded-lg" />,
});
const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => <div className="h-64 bg-nubia-black" />,
});

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-nubia-white via-nubia-cream to-nubia-white text-nubia-black py-12 md:py-20 lg:py-32 overflow-hidden" aria-label="Section principale">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-nubia-gold rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-nubia-gold rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="animate-fade-in">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="text-nubia-gold" size={24} />
                <span className="text-nubia-gold font-semibold text-sm tracking-widest uppercase">{t('common.welcome')}</span>
              </div>

              <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                {t('home.hero_title')}
              </h1>

              <p className="text-base md:text-lg text-nubia-black/85 mb-6 md:mb-8 leading-relaxed">
                {t('home.hero_description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link
                  href="/catalogue"
                  className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300 transform hover:scale-105 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
                  aria-label={t('home.discover_catalog', 'Découvrir le catalogue')}
                >
                  {t('home.discover_catalog')}
                  <ArrowRight className="ml-2" size={18} />
                </Link>
                <Link
                  href="/sur-mesure"
                  className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all duration-300 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
                  aria-label={t('home.custom_order', 'Commander sur mesure')}
                >
                  {t('home.custom_order')}
                </Link>
              </div>
            </div>

            {/* Hero Slider */}
            <HeroSlider />
          </div>
        </div>
      </section>

      {/* About Section */}
      <AnimatedSection>
        <section className="py-12 md:py-16 lg:py-20 bg-nubia-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl font-bold text-nubia-black mb-4 md:mb-6">
                  {t('home.about_title')}
                </h2>
                <p className="text-base md:text-lg text-nubia-black/85 mb-3 md:mb-4 leading-relaxed">
                  {t('home.about_description')}
                </p>
                <p className="text-base md:text-lg text-nubia-black/85 mb-6 md:mb-8 leading-relaxed">
                  {t('home.about_description2')}
                </p>
                <Link
                  href="/a-propos"
                  className="inline-flex items-center px-5 md:px-6 py-2.5 md:py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
                  aria-label={t('home.learn_more', 'En savoir plus')}
                >
                  {t('home.learn_more')}
                  <ArrowRight className="ml-2" size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <AnimatedCard className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-4 md:p-6 text-center">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3" aria-hidden="true">✨</div>
                  <h3 className="font-semibold text-nubia-black mb-1 md:mb-2 text-sm md:text-base">{t('home.quality')}</h3>
                  <p className="text-xs md:text-sm text-nubia-black/80">{t('home.quality_desc')}</p>
                </AnimatedCard>
                <AnimatedCard className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-4 md:p-6 text-center">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3" aria-hidden="true">🎨</div>
                  <h3 className="font-semibold text-nubia-black mb-1 md:mb-2 text-sm md:text-base">{t('home.creativity')}</h3>
                  <p className="text-xs md:text-sm text-nubia-black/80">{t('home.creativity_desc')}</p>
                </AnimatedCard>
                <AnimatedCard className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-4 md:p-6 text-center">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3" aria-hidden="true">👑</div>
                  <h3 className="font-semibold text-nubia-black mb-1 md:mb-2 text-sm md:text-base">{t('home.elegance')}</h3>
                  <p className="text-xs md:text-sm text-nubia-black/80">{t('home.elegance_desc')}</p>
                </AnimatedCard>
                <AnimatedCard className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-4 md:p-6 text-center">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3" aria-hidden="true">💎</div>
                  <h3 className="font-semibold text-nubia-black mb-1 md:mb-2 text-sm md:text-base">{t('home.authenticity')}</h3>
                  <p className="text-xs md:text-sm text-nubia-black/80">{t('home.authenticity_desc')}</p>
                </AnimatedCard>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              {t('home.cta_title')}
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-nubia-white/90 mb-6 md:mb-8">
              {t('home.cta_description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link
                href="/catalogue"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
                aria-label={t('home.discover_catalog', 'Découvrir le catalogue')}
              >
                {t('home.discover_catalog')}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 border-2 border-nubia-gold text-nubia-white font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all duration-300 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
                aria-label={t('nav.contact', 'Nous contacter')}
              >
                {t('nav.contact')}
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <FeaturedProducts />

      <WhyChooseUs />

      <Testimonials />

      <FAQ />

      {/* Newsletter Section */}
      <AnimatedSection>
        <section className="py-10 md:py-12 lg:py-16 bg-gradient-to-br from-nubia-gold/10 via-nubia-white to-nubia-gold/5 text-nubia-black border-y border-nubia-gold/20" aria-label="Inscription à la newsletter">
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

      <WhatsAppButton />
      <Footer />
    </div>
  );
}
