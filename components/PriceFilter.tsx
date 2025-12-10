'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';

export function PriceFilter() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [minPrice, setMinPrice] = useState(searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max') || '');
  
  // Mettre à jour les paramètres d'URL lorsque les prix changent
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (minPrice) params.set('min', minPrice);
    else params.delete('min');
    
    if (maxPrice) params.set('max', maxPrice);
    else params.delete('max');
    
    // Ne pas déclencher la navigation si c'est le rendu initial
    if (searchParams.toString() !== params.toString()) {
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [minPrice, maxPrice, pathname, router, searchParams]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder={t('catalog.min_price', 'Min')}
          className="w-24 px-3 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
          min="0"
        />
      </div>
      <span>-</span>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder={t('catalog.max_price', 'Max')}
          className="w-24 px-3 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
          min={minPrice || '0'}
        />
      </div>
      <span className="text-sm text-nubia-black/70">{t('common.currency', 'FCFA')}</span>
    </div>
  );
}
