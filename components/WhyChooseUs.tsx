'use client';

import { Shield, Truck, Heart, Award } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedCard from './AnimatedCard';

export default function WhyChooseUs() {
  const { t } = useTranslation();

  const reasons = [
    {
      icon: Shield,
      title: t('home.why_choose_quality', 'Qualité Garantie'),
      description: t('home.why_choose_quality_desc', 'Tissus premium et finitions impeccables'),
    },
    {
      icon: Truck,
      title: t('home.why_choose_delivery', 'Livraison Rapide'),
      description: t('home.why_choose_delivery_desc', 'Livraison gratuite pour commandes >50k FCFA'),
    },
    {
      icon: Heart,
      title: t('home.why_choose_custom', 'Sur-Mesure Personnalisé'),
      description: t('home.why_choose_custom_desc', 'Créations adaptées à votre style unique'),
    },
    {
      icon: Award,
      title: t('home.why_choose_support', 'Support Client'),
      description: t('home.why_choose_support_desc', 'Assistance 24/7 via WhatsApp et email'),
    },
  ];

  return (
    <section className="py-20 bg-nubia-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-4">
            {t('home.why_choose_title', 'Pourquoi nous choisir')}
          </h2>
          <p className="text-lg text-nubia-black/70">
            {t('home.about_description', 'Avec Nubia Aura, nous valorisons la créativité et l\'authenticité')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <AnimatedCard key={index} className="bg-nubia-cream/30 rounded-lg p-6 text-center border border-nubia-gold/20 hover:border-nubia-gold/50 transition-all">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-nubia-gold/10 rounded-full flex items-center justify-center">
                    <Icon className="text-nubia-gold" size={32} aria-hidden="true" />
                  </div>
                </div>
                <h3 className="font-semibold text-nubia-black mb-2 text-lg">{reason.title}</h3>
                <p className="text-sm text-nubia-black/70 leading-relaxed">{reason.description}</p>
              </AnimatedCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
