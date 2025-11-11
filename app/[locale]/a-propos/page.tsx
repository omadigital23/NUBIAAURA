'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Sparkles,
      title: t('about.value_creativity', 'Creativity'),
      description: t('about.value_creativity_desc', 'Each piece is unique and thoughtfully designed'),
    },
    {
      icon: Heart,
      title: t('about.value_authenticity', 'Authenticity'),
      description: t('about.value_authenticity_desc', 'We celebrate African heritage with pride'),
    },
    {
      icon: Zap,
      title: t('about.value_elegance', 'Elegance'),
      description: t('about.value_elegance_desc', 'Our timeless designs combine refinement and sophistication'),
    },
  ];

  const process = [
    {
      step: '1',
      title: t('about.process_step1', 'Consultation'),
      description: t('about.process_step1_desc', 'You share your vision, measurements and preferences'),
    },
    {
      step: '2',
      title: t('about.process_step2', 'Creation'),
      description: t('about.process_step2_desc', 'Our artisans create your unique piece with care and attention'),
    },
    {
      step: '3',
      title: t('about.process_step3', 'Fitting'),
      description: t('about.process_step3_desc', 'You try on your creation and we make any necessary adjustments'),
    },
    {
      step: '4',
      title: t('about.process_step4', 'Delivery'),
      description: t('about.process_step4_desc', 'You receive your perfect piece, ready to conquer the world'),
    },
  ];

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-4">
            {t('about.title', 'About Nubia Aura')}
          </h1>
          <p className="text-xl text-nubia-white/80">
            {t('about.tagline', 'Creativity, Authenticity, African Elegance')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-6">
                {t('about.mission_title', 'Our Mission')}
              </h2>
              <p className="text-lg text-nubia-black/70 mb-4">
                {t('about.mission_p1', 'At Nubia Aura, we value creativity and authenticity for your outfits')}
              </p>
              <p className="text-lg text-nubia-black/70 mb-4">
                {t('about.mission_p2', 'That\'s why we offer custom tailoring based on your personality')}
              </p>
              <p className="text-lg text-nubia-black/70">
                {t('about.mission_p3', 'If you\'re seeking originality, this concept is designed for you')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-nubia-gold/20 to-nubia-gold/5 rounded-lg p-12 flex items-center justify-center h-96">
              <div className="text-6xl">👗</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-nubia-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-12 text-center">
            {t('about.values_title', 'Our Values')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8 hover:shadow-gold transition-all duration-300"
                >
                  <Icon className="text-nubia-gold mb-4" size={40} />
                  <h3 className="font-playfair text-2xl font-bold text-nubia-black mb-3">
                    {value.title}
                  </h3>
                  <p className="text-nubia-black/70">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-nubia-gold/20 to-nubia-gold/5 rounded-lg p-12 flex items-center justify-center h-96">
              <div className="text-6xl">✨</div>
            </div>
            <div>
              <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-6">
                {t('about.founder_title', 'The Founder')}
              </h2>
              <h3 className="text-2xl font-bold text-nubia-gold mb-4">
                {t('about.founder_name', 'Nubia Aura')}
              </h3>
              <p className="text-lg text-nubia-black/70 mb-4">
                {t('about.founder_p1', 'A Senegalese stylist passionate about African fashion')}
              </p>
              <p className="text-lg text-nubia-black/70 mb-4">
                {t('about.founder_p2', 'With over 10 years of experience in artisanal tailoring')}
              </p>
              <p className="text-lg text-nubia-black/70">
                {t('about.founder_p3', 'Her unique approach combines African heritage with modernity')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-nubia-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-12 text-center">
            {t('about.process_title', 'Our Process')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {process.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-nubia-gold text-nubia-black rounded-full w-16 h-16 flex items-center justify-center font-playfair text-2xl font-bold mb-4 mx-auto">
                  {item.step}
                </div>
                <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-6 text-center">
                  <h3 className="font-playfair text-xl font-bold text-nubia-black mb-3">
                    {item.title}
                  </h3>
                  <p className="text-nubia-black/70">{item.description}</p>
                </div>
                {index < process.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-6 h-0.5 bg-nubia-gold/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approach Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-8">
            {t('about.approach_title', 'Our Approach')}
          </h2>
          <div className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white rounded-lg p-12">
            <p className="text-lg mb-6">
              {t('about.approach_p1', 'In this section, you\'ll find the options needed to place your order')}
            </p>
            <p className="text-lg mb-6">
              {t('about.approach_p2', 'Our approach is artisanal, ethical and environmentally respectful')}
            </p>
            <p className="text-lg">
              {t('about.approach_p3', 'We believe that true elegance lies in authenticity and quality')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-nubia-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-6">
            {t('about.cta_title', 'Ready to Create Your Outfit?')}
          </h2>
          <p className="text-lg text-nubia-black/70 mb-8 max-w-2xl mx-auto">
            {t('about.cta_description', 'Discover our custom creation process and let us help you create the piece of your dreams')}
          </p>
          <a
            href="/sur-mesure"
            className="inline-block px-8 py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300"
          >
            {t('about.cta_button', 'Create Your Custom Outfit')}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
