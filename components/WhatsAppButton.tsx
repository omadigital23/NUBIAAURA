'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
  const defaultMsg = 'Bonjour Nubia Aura, j\'aimerais une consultation gratuite';
  const message = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE || defaultMsg;
  
  if (!phone) {
    console.error('NEXT_PUBLIC_WHATSAPP_PHONE is not configured');
    return null;
  }
  const href = `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110 z-40 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
      aria-label="Contactez-nous sur WhatsApp"
      title="Contactez-nous sur WhatsApp"
    >
      <MessageCircle size={24} className="sm:w-7 sm:h-7" />
    </a>
  );
}
