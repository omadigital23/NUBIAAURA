'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  const pathname = usePathname();
  const locale = pathname?.startsWith('/en') ? 'en' : 'fr';
  const homeHref = `/${locale}`;
  const catalogHref = `/${locale}/catalogue`;
  const customHref = `/${locale}/sur-mesure`;
  const contactHref = `/${locale}/contact`;
  const isEnglish = locale === 'en';

  return (
    <div className="min-h-screen bg-nubia-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* African geometric pattern background */}
      <div className="absolute inset-0 opacity-[0.06]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="african-geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0L80 40L40 80L0 40Z" fill="none" stroke="#D4AF37" strokeWidth="1"/>
              <path d="M40 10L70 40L40 70L10 40Z" fill="none" stroke="#D4AF37" strokeWidth="0.5"/>
              <circle cx="40" cy="40" r="5" fill="none" stroke="#D4AF37" strokeWidth="0.5"/>
              <path d="M20 0L40 20M60 0L40 20M80 20L60 40M80 60L60 40M60 80L40 60M20 80L40 60M0 60L20 40M0 20L20 40" fill="none" stroke="#D4AF37" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#african-geo)" />
        </svg>
      </div>

      {/* Gold gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-nubia-gold/10 to-transparent rounded-full blur-3xl" />

      <motion.div
        className="text-center max-w-lg relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Decorative SVG */}
        <motion.div
          className="mb-8 inline-block"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="58" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.4"/>
            <circle cx="60" cy="60" r="45" stroke="#D4AF37" strokeWidth="1" opacity="0.3"/>
            <path d="M60 15L90 45L75 60L90 75L60 105L30 75L45 60L30 45Z" stroke="#D4AF37" strokeWidth="2" fill="none"/>
            <text x="60" y="68" textAnchor="middle" fill="#D4AF37" fontSize="24" fontWeight="bold" fontFamily="serif">404</text>
          </svg>
        </motion.div>

        <motion.h1
          className="font-playfair text-5xl md:text-6xl font-bold text-nubia-gold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {isEnglish ? 'Page Not Found' : 'Page non trouvée'}
        </motion.h1>

        <motion.p
          className="text-nubia-white/60 text-lg mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {isEnglish
            ? 'The page you are looking for does not exist or has been moved.'
            : "La page que vous recherchez n'existe pas ou a été déplacée."}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            href={homeHref}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-nubia-gold text-nubia-black font-bold rounded-lg hover:bg-nubia-white transition-all duration-300 shadow-lg shadow-nubia-gold/20 hover:shadow-nubia-gold/40"
          >
            <Home size={20} />
            {isEnglish ? 'Home' : 'Accueil'}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-nubia-gold/50 text-nubia-gold font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all duration-300"
          >
            <ArrowLeft size={20} />
            {isEnglish ? 'Go Back' : 'Retour'}
          </button>
        </motion.div>

        <motion.div
          className="pt-8 border-t border-nubia-gold/15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-sm text-nubia-white/40 mb-4 uppercase tracking-widest font-semibold">
            {isEnglish ? 'Explore' : 'Explorer'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={catalogHref} className="text-nubia-gold/70 hover:text-nubia-gold transition-colors text-sm font-medium">
              {isEnglish ? 'Catalog' : 'Catalogue'}
            </Link>
            <span className="text-nubia-gold/20">•</span>
            <Link href={customHref} className="text-nubia-gold/70 hover:text-nubia-gold transition-colors text-sm font-medium">
              {isEnglish ? 'Custom Order' : 'Sur-mesure'}
            </Link>
            <span className="text-nubia-gold/20">•</span>
            <Link href={contactHref} className="text-nubia-gold/70 hover:text-nubia-gold transition-colors text-sm font-medium">
              Contact
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
