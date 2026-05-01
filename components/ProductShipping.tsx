'use client';

import { motion } from 'framer-motion';
import { RotateCcw, Shield, Truck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProductShipping() {
  const { t } = useTranslation();

  const shippingInfo = [
    {
      icon: Truck,
      title: t('product.shipping', 'Livraison'),
      description: t('home.why_choose_delivery_desc', 'Livraison gratuite pour commandes >50k FCFA'),
    },
    {
      icon: RotateCcw,
      title: t('product.returns', 'Retours'),
      description: t('product.return_policy', 'Retours: 3 jours (SN) / 14 jours (Intl) - Produit intact avec emballage'),
    },
    {
      icon: Shield,
      title: t('common.success', 'Succès'),
      description: t('product.satisfaction_guarantee', 'Satisfait ou remboursé 100%'),
    },
  ];

  return (
    <motion.section
      className="mt-12 border-t border-nubia-gold/20 pt-10"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nubia-gold">
            Nubia Aura
          </p>
          <h3 className="mt-2 font-playfair text-2xl font-bold text-nubia-black">
            {t('product.shipping', 'Livraison et Retours')}
          </h3>
        </div>
        <p className="max-w-md text-sm text-nubia-black/60">
          {t('product.shipping_reassurance', 'Des garanties simples pour commander avec confiance.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <Icon size={22} />
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
