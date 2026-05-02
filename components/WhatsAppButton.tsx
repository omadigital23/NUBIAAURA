'use client';

type WhatsAppMarkProps = {
  className?: string;
};

function WhatsAppMark({ className }: WhatsAppMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M16 3.5c-6.74 0-12.2 5.2-12.2 11.62 0 2.25.67 4.35 1.84 6.12L4 28.5l7.46-1.9A12.78 12.78 0 0 0 16 27.44c6.74 0 12.2-5.2 12.2-11.62S22.74 3.5 16 3.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M21.28 18.86c-.28-.14-1.63-.77-1.88-.86-.25-.1-.43-.14-.61.14-.18.27-.7.86-.86 1.04-.16.18-.32.2-.6.07-.28-.14-1.17-.42-2.23-1.32-.82-.7-1.38-1.56-1.54-1.82-.16-.27-.02-.42.12-.55.13-.12.28-.32.42-.48.14-.16.18-.27.28-.45.09-.18.05-.34-.02-.48-.07-.13-.61-1.4-.84-1.92-.22-.5-.44-.43-.61-.44h-.52c-.18 0-.47.07-.72.34-.25.27-.95.88-.95 2.15 0 1.27.98 2.5 1.12 2.67.14.18 1.94 2.82 4.7 3.95.66.27 1.17.43 1.57.55.66.2 1.26.17 1.73.1.53-.08 1.63-.64 1.86-1.25.23-.61.23-1.13.16-1.25-.07-.11-.25-.18-.53-.31Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
      className="group fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_18px_36px_rgba(7,94,84,0.28)] ring-1 ring-white/45 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#1FC45C] hover:shadow-[0_22px_44px_rgba(7,94,84,0.36)] focus:outline-none focus:ring-4 focus:ring-[#25D366]/35 focus:ring-offset-2 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16"
      aria-label="Contactez-nous sur WhatsApp"
      title="Contactez-nous sur WhatsApp"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366] opacity-25 motion-safe:animate-ping" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-[-8px] rounded-full bg-[#25D366]/20 blur-md" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-[-5px] rounded-full border border-[#25D366]/55 shadow-[0_0_26px_rgba(37,211,102,0.55)]" />
      <WhatsAppMark className="relative h-7 w-7 drop-shadow-sm sm:h-8 sm:w-8" />
    </a>
  );
}
