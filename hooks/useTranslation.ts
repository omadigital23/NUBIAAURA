'use client';

import { useParams } from 'next/navigation';
import { Locale, isValidLocale } from '@/lib/i18n';
import { useMemo } from 'react';

// Import translations
import frCommon from '@/locales/fr/common.json';
import enCommon from '@/locales/en/common.json';
import frAdmin from '@/locales/fr/admin.json';
import enAdmin from '@/locales/en/admin.json';
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
import frErrors from '@/locales/fr/errors.json';
import enErrors from '@/locales/en/errors.json';

const merge = (...objs: Record<string, any>[]) => Object.assign({}, ...objs);

const expandFlatKeys = (obj: Record<string, any>) => {
  const result: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (!key.includes('.')) {
      result[key] = value;
      return;
    }

    const parts = key.split('.');
    let cursor = result;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        cursor[part] = value;
        return;
      }
      cursor[part] = cursor[part] && typeof cursor[part] === 'object' ? cursor[part] : {};
      cursor = cursor[part];
    });
  });

  return result;
};

const namespaced = (namespace: string, obj: Record<string, any>) => {
  const expanded = expandFlatKeys(obj);
  const nested = expanded[namespace];

  return {
    ...obj,
    [namespace]: {
      ...expanded,
      ...(nested && typeof nested === 'object' ? nested : {}),
    },
  };
};

const translations: Record<Locale, Record<string, any>> = {
  fr: merge(
    frCommon as any,
    namespaced('admin', frAdmin as any),
    namespaced('legal', frLegal as any),
    namespaced('home', frHome as any),
    namespaced('catalog', frCatalog as any),
    namespaced('product', frProduct as any),
    namespaced('checkout', frCheckout as any),
    namespaced('callback', frCallback as any),
    namespaced('custom', frCustom as any),
    namespaced('auth', frAuth as any),
    namespaced('about', frAbout as any),
    namespaced('contact', frContact as any),
    namespaced('merci', frThankYou as any),
    namespaced('errors', frErrors as any),
  ),
  en: merge(
    enCommon as any,
    namespaced('admin', enAdmin as any),
    namespaced('legal', enLegal as any),
    namespaced('home', enHome as any),
    namespaced('catalog', enCatalog as any),
    namespaced('product', enProduct as any),
    namespaced('checkout', enCheckout as any),
    namespaced('callback', enCallback as any),
    namespaced('custom', enCustom as any),
    namespaced('auth', enAuth as any),
    namespaced('about', enAbout as any),
    namespaced('contact', enContact as any),
    namespaced('merci', enThankYou as any),
    namespaced('errors', enErrors as any),
  ),
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
