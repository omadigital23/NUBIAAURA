'use client';

import {
  MessageCircle,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type CommerceTrustBarProps = {
  className?: string;
  variant?: 'light' | 'dark' | 'compact';
  limit?: number;
};

type TrustItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export default function CommerceTrustBar({
  className = '',
  variant = 'light',
  limit,
}: CommerceTrustBarProps) {
  const { locale } = useTranslation();
  const isFrench = locale === 'fr';

  const items: TrustItem[] = [
    {
      icon: ShieldCheck,
      title: isFrench ? 'Paiement protégé' : 'Protected payment',
      description: isFrench
        ? 'Transactions sécurisées via PayDunya, Wave, Orange Money ou carte.'
        : 'Secure checkout through PayDunya, Wave, Orange Money or card.',
    },
    {
      icon: Truck,
      title: isFrench ? 'Livraison suivie' : 'Tracked delivery',
      description: isFrench
        ? 'Dakar, Sénégal et international avec suivi de commande.'
        : 'Dakar, Senegal and international delivery with order tracking.',
    },
    {
      icon: RotateCcw,
      title: isFrench ? 'Retours clairs' : 'Clear returns',
      description: isFrench
        ? 'Retour possible sur les pièces intactes selon la zone de livraison.'
        : 'Returns available for intact items based on delivery location.',
    },
    {
      icon: MessageCircle,
      title: isFrench ? 'Conseil atelier' : 'Atelier support',
      description: isFrench
        ? 'Aide WhatsApp pour taille, disponibilité et choix du modèle.'
        : 'WhatsApp help for sizing, availability and styling decisions.',
    },
    {
      icon: PackageCheck,
      title: isFrench ? 'Stock vérifié' : 'Verified stock',
      description: isFrench
        ? 'Les disponibilités sont contrôlées avant préparation.'
        : 'Availability is checked before preparation.',
    },
  ];

  const visibleItems = typeof limit === 'number' ? items.slice(0, limit) : items;
  const isDark = variant === 'dark';
  const isCompact = variant === 'compact';

  return (
    <section
      className={`${isDark ? 'bg-nubia-black text-nubia-white' : 'bg-nubia-white text-nubia-black'} ${className}`}
      aria-label={isFrench ? 'Garanties Nubia Aura' : 'Nubia Aura guarantees'}
    >
      <div className={isCompact ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`rounded-lg border p-4 ${
                isDark
                  ? 'border-nubia-white/12 bg-nubia-white/[0.06]'
                  : 'border-nubia-gold/20 bg-nubia-cream/20'
              }`}
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-nubia-gold/10 text-nubia-gold">
                <Icon size={20} aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold">{item.title}</h3>
              <p className={`mt-1 text-xs leading-5 ${isDark ? 'text-nubia-white/68' : 'text-nubia-black/65'}`}>
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
