'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedSection from './AnimatedSection';

export default function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: t('home.faq_q1', 'Quels sont les délais de livraison?'),
      answer: t('home.faq_a1', 'Les délais varient entre 3-7 jours ouvrables selon votre localisation. Les commandes sur-mesure prennent 10-14 jours.'),
    },
    {
      question: t('home.faq_q2', 'Puis-je retourner un produit?'),
      answer: t('home.faq_a2', 'Oui, vous avez 30 jours pour retourner un produit non porté. Les frais de retour sont gratuits.'),
    },
    {
      question: t('home.faq_q3', 'Acceptez-vous les commandes sur-mesure?'),
      answer: t('home.faq_a3', 'Absolument! Nous proposons des créations entièrement personnalisées. Contactez-nous pour discuter de votre projet.'),
    },
    {
      question: t('home.faq_q4', 'Quels sont les moyens de paiement acceptés?'),
      answer: t('home.faq_a4', 'Nous acceptons les paiements via Flutterwave (cartes, Orange Money, Wave, etc.) et les virements bancaires.'),
    },
    {
      question: t('home.faq_q5', 'Comment puis-je commander une création sur-mesure?'),
      answer: t('home.faq_a5', 'Visitez notre page \'Sur-Mesure\', remplissez le formulaire avec vos préférences et nous vous contacterons pour affiner les détails.'),
    },
  ];

  return (
    <AnimatedSection>
      <section className="py-20 bg-nubia-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl font-bold text-nubia-black mb-4">
              {t('home.faq_title', 'Questions Fréquemment Posées')}
            </h2>
            <p className="text-lg text-nubia-black/70">
              {t('home.about_description', 'Trouvez les réponses à vos questions')}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-nubia-gold/20 rounded-lg overflow-hidden hover:border-nubia-gold/50 transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-nubia-white hover:bg-nubia-cream/20 transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <h3 id={`faq-question-${index}`} className="font-semibold text-nubia-black text-left">{faq.question}</h3>
                  <ChevronDown
                    size={20}
                    className={`text-nubia-gold flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openIndex === index && (
                  <div 
                    id={`faq-answer-${index}`}
                    className="px-6 py-4 bg-nubia-cream/10 border-t border-nubia-gold/20"
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                  >
                    <p className="text-nubia-black/80 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
