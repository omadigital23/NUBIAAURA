'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  const pathname = usePathname();
  const locale = pathname?.startsWith('/en') ? 'en' : 'fr';
  const homeHref = `/${locale}`;
  const catalogHref = `/${locale}/catalogue`;
  const customHref = `/${locale}/sur-mesure`;
  const contactHref = `/${locale}/contact`;
  const isEnglish = locale === 'en';

  return (
    <div className="min-h-screen bg-gradient-to-br from-nubia-white via-nubia-cream to-nubia-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-8xl sm:text-9xl font-playfair font-bold text-nubia-gold mb-4">404</h1>
          <h2 className="text-3xl font-playfair font-bold text-nubia-black mb-2">
            {isEnglish ? 'Page Not Found' : 'Page non trouvée'}
          </h2>
          <p className="text-gray-600">
            {isEnglish
              ? 'The page you are looking for does not exist or has been removed.'
              : "La page que vous recherchez n'existe pas ou a été supprimée."}
          </p>
        </div>

        <div className="mb-10 inline-flex h-16 w-16 items-center justify-center rounded-full border border-nubia-gold/30 bg-nubia-white text-nubia-gold shadow-sm">
          <Search size={32} aria-hidden="true" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={homeHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-colors"
          >
            <Home size={20} />
            {isEnglish ? 'Home' : 'Accueil'}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-nubia-gold text-nubia-gold font-semibold rounded-lg hover:bg-nubia-gold/10 transition-colors"
          >
            <ArrowLeft size={20} />
            {isEnglish ? 'Back' : 'Retour'}
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-nubia-gold/20">
          <p className="text-sm text-gray-600 mb-4">
            {isEnglish ? 'Popular pages:' : 'Pages populaires :'}
          </p>
          <div className="flex flex-col gap-2">
            <Link href={catalogHref} className="text-nubia-gold hover:text-nubia-gold/80 transition-colors">
              {isEnglish ? 'Catalog' : 'Catalogue'}
            </Link>
            <Link href={customHref} className="text-nubia-gold hover:text-nubia-gold/80 transition-colors">
              {isEnglish ? 'Custom order' : 'Sur-mesure'}
            </Link>
            <Link href={contactHref} className="text-nubia-gold hover:text-nubia-gold/80 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
