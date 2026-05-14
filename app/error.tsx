'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, locale } = useTranslation();

  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-nubia-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* African geometric pattern background */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="error-geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke="#D4AF37" strokeWidth="0.8"/>
              <path d="M30 15L45 30L30 45L15 30Z" fill="none" stroke="#D4AF37" strokeWidth="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#error-geo)" />
        </svg>
      </div>

      {/* Red-gold gradient accent for error */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-b from-red-500/8 via-nubia-gold/5 to-transparent rounded-full blur-3xl" />

      <motion.div
        className="text-center max-w-lg relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated error icon */}
        <motion.div
          className="mb-8 inline-block"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
        >
          <div className="relative">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="48" stroke="#D4AF37" strokeWidth="1.5" opacity="0.3"/>
              <circle cx="50" cy="50" r="38" stroke="#D4AF37" strokeWidth="1" strokeDasharray="6 3" opacity="0.2"/>
              <path d="M50 25L50 55" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="50" cy="68" r="3" fill="#D4AF37"/>
            </svg>
          </div>
        </motion.div>

        <motion.h1
          className="font-playfair text-4xl md:text-5xl font-bold text-nubia-gold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t('error.title', 'Erreur')}
        </motion.h1>

        <motion.p
          className="text-nubia-white/60 text-lg mb-3 leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {t('error.unexpected', 'Une erreur inattendue s\'est produite. Veuillez réessayer.')}
        </motion.p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <motion.div
            className="mb-8 p-4 bg-nubia-white/5 border border-nubia-gold/20 rounded-lg text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm font-mono text-nubia-gold/80 break-words">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-nubia-white/30 mt-2">ID: {error.digest}</p>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-nubia-gold text-nubia-black font-bold rounded-lg hover:bg-nubia-white transition-all duration-300 shadow-lg shadow-nubia-gold/20 hover:shadow-nubia-gold/40"
          >
            <RefreshCw size={20} />
            {t('error.retry', 'Réessayer')}
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-nubia-gold/50 text-nubia-gold font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all duration-300"
          >
            <Home size={20} />
            {t('nav.home', 'Accueil')}
          </Link>
        </motion.div>

        {/* Support */}
        <motion.div
          className="pt-8 border-t border-nubia-gold/15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-sm text-nubia-white/40 mb-3">{t('error.need_help', 'Besoin d\'aide?')}</p>
          <Link
            href={`/${locale}/contact`}
            className="text-nubia-gold hover:text-nubia-white transition-colors font-medium"
          >
            {t('error.contact_us', 'Contactez-nous')} →
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
