/**
 * Utilitaires de formatage
 */

/**
 * Formate un prix selon la locale
 */
export function formatPrice(price: number, locale: 'fr' | 'en' = 'fr'): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formate un prix avec la devise
 */
export function formatPriceWithCurrency(
  price: number,
  locale: 'fr' | 'en' = 'fr',
  currency: string = 'FCFA'
): string {
  const formatted = formatPrice(price, locale);
  return locale === 'fr' ? `${formatted} ${currency}` : `${currency} ${formatted}`;
}

/**
 * Formate une date selon la locale
 */
export function formatDate(
  date: string | Date,
  locale: 'fr' | 'en' = 'fr',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    defaultOptions
  ).format(dateObj);
}

/**
 * Formate une date relative (il y a X jours)
 */
export function formatRelativeDate(date: string | Date, locale: 'fr' | 'en' = 'fr'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return locale === 'fr' ? "Aujourd'hui" : 'Today';
  } else if (diffDays === 1) {
    return locale === 'fr' ? 'Hier' : 'Yesterday';
  } else if (diffDays < 7) {
    return locale === 'fr' ? `Il y a ${diffDays} jours` : `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return locale === 'fr' 
      ? `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
      : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj, locale);
  }
}

/**
 * Tronque un texte avec ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Génère un slug à partir d'un texte
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('221')) {
    // Sénégal: +221 77 123 45 67
    return `+221 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  } else if (cleaned.startsWith('212')) {
    // Maroc: +212 6 12 34 56 78
    return `+212 ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  
  return phone;
}
