'use client';

import { useParams } from 'next/navigation';
import { Locale, isValidLocale } from '@/lib/i18n';
import { useMemo } from 'react';

// Import translations
import frCommon from '@/locales/fr/common.json';
import enCommon from '@/locales/en/common.json';
import frLegal from '@/locales/fr/legal.json';
import enLegal from '@/locales/en/legal.json';
import frHome from '@/locales/fr/home.json';
import enHome from '@/locales/en/home.json';
import frCatalog from '@/locales/fr/catalog.json';
import enCatalog from '@/locales/en/catalog.json';
import frProduct from '@/locales/fr/product.json';
import enProduct from '@/locales/en/product.json';
import frCheckout from '@/locales/fr/checkout.json';
import enCheckout from '@/locales/en/checkout.json';
import frCallback from '@/locales/fr/callback.json';
import enCallback from '@/locales/en/callback.json';
import frCustom from '@/locales/fr/custom.json';
import enCustom from '@/locales/en/custom.json';
import frAuth from '@/locales/fr/auth.json';
import enAuth from '@/locales/en/auth.json';
import frAbout from '@/locales/fr/about.json';
import enAbout from '@/locales/en/about.json';
import frContact from '@/locales/fr/contact.json';
import enContact from '@/locales/en/contact.json';
import frThankYou from '@/locales/fr/thank-you.json';
import enThankYou from '@/locales/en/thank-you.json';

const merge = (...objs: Record<string, any>[]) => Object.assign({}, ...objs);
const translations: Record<Locale, Record<string, any>> = {
  fr: merge(frCommon as any, frLegal as any, frHome as any, frCatalog as any, frProduct as any, frCheckout as any, frCallback as any, frCustom as any, frAuth as any, frAbout as any, frContact as any, frThankYou as any),
  en: merge(enCommon as any, enLegal as any, enHome as any, enCatalog as any, enProduct as any, enCheckout as any, enCallback as any, enCustom as any, enAuth as any, enAbout as any, enContact as any, enThankYou as any),
};

export function useTranslation() {
  const params = useParams();
  const locale = useMemo(() => {
    const paramLocale = params?.locale;
    return isValidLocale(paramLocale) ? paramLocale : 'fr';
  }, [params?.locale]);

  const t = (key: string, defaultValue: string = ''): string => {
    const dict = translations[locale];
    // 1) Support flat dotted keys in JSON (e.g., "nav.catalog")
    if (Object.prototype.hasOwnProperty.call(dict, key)) {
      const flatVal = (dict as any)[key];
      if (typeof flatVal === 'string') return flatVal as string;
    }
    // 2) Fallback to segmented object traversal
    const parts = key.split('.');
    let value: any = dict;
    for (const p of parts) value = value?.[p];
    return typeof value === 'string' ? value : defaultValue;
  };

  return { t, locale };
}
