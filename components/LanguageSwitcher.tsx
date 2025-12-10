'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = pathname.split('/')[1] || 'fr';

  const switchLanguage = (locale: string) => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Remove current locale if it exists
    if (segments[0] === 'fr' || segments[0] === 'en') {
      segments.shift();
    }

    // Build new path with new locale
    const newPath = `/${locale}/${segments.join('/')}`;
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-nubia-gold/10 transition-colors"
        aria-label="Changer la langue / Change language"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Changer la langue / Change language"
      >
        <Globe size={20} className="text-nubia-gold" />
        <span className="text-sm font-medium uppercase">{currentLocale}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-max bg-nubia-white border border-nubia-gold/20 rounded-lg shadow-lg z-50">
          <button
            onClick={() => switchLanguage('fr')}
            className={`w-full text-left px-4 py-2 hover:bg-nubia-gold/10 transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-inset whitespace-nowrap ${
              currentLocale === 'fr' ? 'bg-nubia-gold/20 text-nubia-gold font-bold' : ''
            }`}
            aria-label="Changer la langue en français"
            aria-current={currentLocale === 'fr' ? 'true' : undefined}
          >
            🇫🇷 Français
          </button>
          <button
            onClick={() => switchLanguage('en')}
            className={`w-full text-left px-4 py-2 hover:bg-nubia-gold/10 transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-inset whitespace-nowrap ${
              currentLocale === 'en' ? 'bg-nubia-gold/20 text-nubia-gold font-bold' : ''
            }`}
            aria-label="Change language to English"
            aria-current={currentLocale === 'en' ? 'true' : undefined}
          >
            🇬🇧 English
          </button>
        </div>
      )}
    </div>
  );
}
