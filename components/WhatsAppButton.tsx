'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '+221771234567';
  const defaultMsg = 'Bonjour Nubia Aura, j\'aimerais une consultation gratuite';
  const message = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE || defaultMsg;
  const href = `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110 z-40"
      aria-label="WhatsApp"
      title="WhatsApp"
    >
      <MessageCircle size={28} />
    </a>
  );
}
