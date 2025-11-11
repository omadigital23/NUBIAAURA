'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-nubia-white via-nubia-cream to-nubia-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="text-red-600" size={40} />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-nubia-black mb-2">Erreur</h1>
          <p className="text-gray-600">Une erreur inattendue s'est produite. Veuillez réessayer.</p>
        </div>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-mono text-red-700 break-words">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">ID: {error.digest}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-colors"
          >
            <RefreshCw size={20} />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-nubia-gold text-nubia-gold font-semibold rounded-lg hover:bg-nubia-gold/10 transition-colors"
          >
            <Home size={20} />
            Accueil
          </Link>
        </div>

        {/* Support */}
        <div className="mt-12 pt-8 border-t border-nubia-gold/20">
          <p className="text-sm text-gray-600 mb-4">Besoin d'aide?</p>
          <Link
            href="/contact"
            className="text-nubia-gold hover:text-nubia-gold/80 transition-colors font-medium"
          >
            Contactez-nous →
          </Link>
        </div>
      </div>
    </div>
  );
}
