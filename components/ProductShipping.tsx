'use client';

import { motion } from 'framer-motion';
import { MessageCircle, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProductShipping() {
  const { locale } = useTranslation();
  const isFrench = locale === 'fr';

  const shippingInfo = [
    {
      icon: Truck,
      title: isFrench ? 'Livraison suivie' : 'Tracked delivery',
      description: isFrench
        ? 'Préparation contrôlée, suivi de commande et options standard ou express selon votre pays.'
        : 'Checked preparation, order tracking and standard or express options based on your country.',
    },
    {
      icon: RotateCcw,
      title: isFrench ? 'Retours et échanges' : 'Returns and exchanges',
      description: isFrench
        ? 'Les pièces intactes peuvent être signalées rapidement après réception selon la zone.'
        : 'Intact items can be reported shortly after delivery based on the delivery area.',
    },
    {
      icon: ShieldCheck,
      title: isFrench ? 'Paiement sécurisé' : 'Secure payment',
      description: isFrench
        ? 'Paiement en ligne protégé ou paiement à la livraison lorsque l’option est disponible.'
        : 'Protected online payment or cash on delivery when available.',
    },
    {
      icon: MessageCircle,
      title: isFrench ? 'Support atelier' : 'Atelier support',
      description: isFrench
        ? 'Une question sur la taille, la coupe ou la disponibilité ? L’équipe répond sur WhatsApp.'
        : 'Questions about size, fit or availability? The team answers on WhatsApp.',
    },
  ];

  return (
    <motion.section className="mt-12 border-t border-nubia-gold/20 pt-10">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nubia-gold">
            Nubia Aura
          </p>
          <h3 className="mt-2 font-playfair text-2xl font-bold text-nubia-black">
            {isFrench ? 'Commander en confiance' : 'Order with confidence'}
          </h3>
        </div>
        <p className="max-w-md text-sm text-nubia-black/60">
          {isFrench
            ? 'Les points essentiels sont visibles avant l’achat : livraison, retours, paiement et conseil taille.'
            : 'The essentials are visible before checkout: delivery, returns, payment and sizing advice.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shippingInfo.map((info) => {
          const Icon = info.icon;
          return (
            <motion.div
              key={info.title}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="group rounded-lg border border-nubia-gold/20 bg-nubia-cream/20 p-5 transition-colors duration-300 hover:bg-nubia-white"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-nubia-gold/10 text-nubia-gold transition-transform duration-300 group-hover:scale-110">
                <Icon size={22} aria-hidden="true" />
              </div>
              <h4 className="font-semibold text-nubia-black">{info.title}</h4>
              <p className="mt-2 text-sm leading-6 text-nubia-black/70">{info.description}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
