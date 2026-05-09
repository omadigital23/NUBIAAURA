export const DEFAULT_WHATSAPP_MESSAGE =
  "Bonjour Nubia Aura, je viens de visiter votre site et un ou plusieurs articles m'intéressent. Pouvez-vous me contacter pour en parler plus en détail ?";

export const DEFAULT_WHATSAPP_PHONE = '+221771430137';

export function getWhatsAppHref(options?: {
  phone?: string;
  message?: string;
}) {
  const phone = options?.phone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE;
  const message = options?.message || process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE || DEFAULT_WHATSAPP_MESSAGE;
  const normalizedPhone = phone.replace(/\D/g, '');

  if (!normalizedPhone) return '';

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
