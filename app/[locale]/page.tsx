 'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCard from '@/components/AnimatedCard';
import { useTranslation } from '@/hooks/useTranslation';
import WhatsAppButton from '@/components/WhatsAppButton';
import FeaturedProducts from '@/components/FeaturedProducts';
import WhyChooseUs from '@/components/WhyChooseUs';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import NewsletterForm from '@/components/NewsletterForm';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-nubia-white via-nubia-cream to-nubia-white text-nubia-black py-20 md:py-32 overflow-hidden">
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

              <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6 leading-tight">
                {t('home.hero_title')}
              </h1>

              <p className="text-lg text-nubia-black/70 mb-8 leading-relaxed">
                {t('home.hero_description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/catalogue"
                  className="inline-flex items-center justify-center px-8 py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300 transform hover:scale-105"
                >
                  {t('home.discover_catalog')}
                  <ArrowRight className="ml-2" size={20} />
                </Link>
                <Link
                  href="/sur-mesure"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all duration-300"
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
        <section className="py-20 bg-nubia-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-6">
                  {t('home.about_title')}
                </h2>
                <p className="text-lg text-nubia-black/70 mb-4 leading-relaxed">
                  {t('home.about_description')}
                </p>
                <p className="text-lg text-nubia-black/70 mb-8 leading-relaxed">
                  {t('home.about_description2')}
                </p>
                <Link
                  href="/a-propos"
                  className="inline-flex items-center px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300"
                >
                  {t('home.learn_more')}
                  <ArrowRight className="ml-2" size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AnimatedCard className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="font-semibold text-nubia-black mb-2">{t('home.quality')}</h3>
                  <p className="text-sm text-nubia-black/70">{t('home.quality_desc')}</p>
                </AnimatedCard>
                <AnimatedCard className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">🎨</div>
                  <h3 className="font-semibold text-nubia-black mb-2">{t('home.creativity')}</h3>
                  <p className="text-sm text-nubia-black/70">{t('home.creativity_desc')}</p>
                </AnimatedCard>
                <AnimatedCard className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">👑</div>
                  <h3 className="font-semibold text-nubia-black mb-2">{t('home.elegance')}</h3>
                  <p className="text-sm text-nubia-black/70">{t('home.elegance_desc')}</p>
                </AnimatedCard>
                <AnimatedCard className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">💎</div>
                  <h3 className="font-semibold text-nubia-black mb-2">{t('home.authenticity')}</h3>
                  <p className="text-sm text-nubia-black/70">{t('home.authenticity_desc')}</p>
                </AnimatedCard>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="py-20 bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
              {t('home.cta_title')}
            </h2>
            <p className="text-xl text-nubia-white/80 mb-8">
              {t('home.cta_description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalogue"
                className="inline-flex items-center justify-center px-8 py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300"
              >
                {t('home.discover_catalog')}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-nubia-gold text-nubia-white font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all duration-300"
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
        <section className="py-16 bg-gradient-to-br from-nubia-gold/10 via-nubia-white to-nubia-gold/5 text-nubia-black border-y border-nubia-gold/20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
              {t('newsletter.title', 'Restez informé')}
            </h2>
            <p className="text-nubia-black/70 mb-6">
              {t('newsletter.subtitle', 'Recevez nos nouveautés et offres exclusives')}
            </p>

            <NewsletterForm />

            <p className="text-xs text-nubia-black/60 mt-4">
              {t('newsletter.privacy', 'Nous respectons votre vie privée. Désinscription simple à tout moment.')}
            </p>
          </div>
        </section>
      </AnimatedSection>

      <WhatsAppButton />
      <Footer />
    </div>
  );
}
