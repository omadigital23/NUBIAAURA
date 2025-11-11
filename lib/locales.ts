/**
 * Locale Configuration
 * Defines supported locales and default locale
 */

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

/**
 * Get the locale from pathname
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];

  if (locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale;
  }

  return defaultLocale;
}

/**
 * Redirect to locale path
 */
export function getLocalePath(path: string, locale: Locale): string {
  // Remove existing locale from path if present
  const segments = path.split('/');
  if (locales.includes(segments[1] as Locale)) {
    segments.splice(1, 1);
  }

  // Add new locale
  return `/${locale}${segments.join('/')}`;
}

/**
 * Get alternate locale
 */
export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'fr' ? 'en' : 'fr';
}
