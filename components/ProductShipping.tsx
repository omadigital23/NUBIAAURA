'use client';

import { Truck, RotateCcw, Shield } from 'lucide-react';
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
      description: t('product.return_policy', 'Retours gratuits sous 30 jours'),
    },
    {
      icon: Shield,
      title: t('common.success', 'Garantie'),
      description: 'Satisfait ou remboursé 100%',
    },
  ];

  return (
    <div className="mt-8 border-t border-nubia-gold/20 pt-8">
      <h3 className="font-semibold text-lg text-nubia-black mb-6">
        {t('product.shipping', 'Livraison et Retours')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shippingInfo.map((info, index) => {
          const Icon = info.icon;
          return (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Icon className="text-nubia-gold" size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-nubia-black">{info.title}</h4>
                <p className="text-sm text-nubia-black/70 mt-1">{info.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
