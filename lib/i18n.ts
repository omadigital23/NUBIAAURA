import { notFound } from 'next/navigation';

const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export function isValidLocale(locale: unknown): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleFromPath(path: string): Locale {
  const parts = path.split('/').filter(Boolean);
  const potentialLocale = parts[0];
  
  if (isValidLocale(potentialLocale)) {
    return potentialLocale;
  }
  
  return 'fr'; // Default locale
}

export async function getTranslations(locale: Locale, namespace: string) {
  try {
    const translations = await import(`@/locales/${locale}/${namespace}.json`);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
    notFound();
  }
}

export function getTranslationKey(translations: Record<string, any>, key: string, defaultValue: string = ''): string {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return typeof value === 'string' ? value : defaultValue;
}
