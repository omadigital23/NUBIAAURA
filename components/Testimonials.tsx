'use client';

import { useTranslation } from '@/hooks/useTranslation';
import AnimatedCard from './AnimatedCard';

export default function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t('home.testimonial_1_name', 'Aïssatou Diallo'),
      location: t('home.testimonial_1_location', 'Dakar, Sénégal'),
      text: t('home.testimonial_1_text', 'Nubia Aura a transformé ma vision en réalité. La qualité est exceptionnelle et le service client est impeccable!'),
      rating: 5,
    },
    {
      name: t('home.testimonial_2_name', 'Mariam Sow'),
      location: t('home.testimonial_2_location', 'Thiès, Sénégal'),
      text: t('home.testimonial_2_text', 'J\'adore mes créations! Chaque pièce est unique et parfaitement adaptée à mon style personnel.'),
      rating: 5,
    },
    {
      name: t('home.testimonial_3_name', 'Fatou Ba'),
      location: t('home.testimonial_3_location', 'Casablanca, Maroc'),
      text: t('home.testimonial_3_text', 'Service professionnel, livraison rapide et produits de qualité. Je recommande vivement!'),
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-nubia-cream/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-4">
            {t('home.testimonials_title', 'Ce que nos clients disent')}
          </h2>
          <p className="text-lg text-nubia-black/70">
            {t('home.testimonials_subtitle', 'Découvrez les avis de nos clientes satisfaites')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedCard
              key={index}
              className="bg-nubia-white rounded-lg p-6 border border-nubia-gold/20 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-nubia-black">{testimonial.name}</h3>
                  <p className="text-sm text-nubia-black/60">{testimonial.location}</p>
                </div>
              </div>

              <div className="flex mb-4" role="img" aria-label={`${testimonial.rating} étoiles sur 5`}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <span key={i} className="text-nubia-gold" aria-hidden="true">⭐</span>
                ))}
              </div>

              <p className="text-nubia-black/80 leading-relaxed italic">"{testimonial.text}"</p>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
