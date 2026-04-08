export type PasswordResetLocale = 'fr' | 'en';

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeBaseUrl(value: string | undefined): string {
  const fallback = 'https://www.nubiaaura.com';
  return (value || fallback).replace(/\/+$/, '');
}

export function getPasswordResetConfig(locale: PasswordResetLocale = 'fr') {
  return {
    locale,
    brandName: process.env.NEXT_PUBLIC_PASSWORD_RESET_BRAND_NAME || 'NUBIA AURA',
    baseUrl: normalizeBaseUrl(
      process.env.NEXT_PUBLIC_PASSWORD_RESET_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL
    ),
    codeTtlMinutes: parsePositiveInteger(
      process.env.NEXT_PUBLIC_PASSWORD_RESET_CODE_TTL_MINUTES,
      15
    ),
    resendCooldownSeconds: parsePositiveInteger(
      process.env.NEXT_PUBLIC_PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
      60
    ),
    maxAttempts: parsePositiveInteger(
      process.env.NEXT_PUBLIC_PASSWORD_RESET_MAX_ATTEMPTS,
      5
    ),
    supportEmail: process.env.NEXT_PUBLIC_PASSWORD_RESET_SUPPORT_EMAIL || 'supports@nubiaaura.com',
  };
}

export function getPasswordResetPageUrl(locale: PasswordResetLocale = 'fr') {
  const config = getPasswordResetConfig(locale);
  return `${config.baseUrl}/${locale}/auth/reset-password`;
}
