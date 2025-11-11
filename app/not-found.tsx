'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-nubia-white via-nubia-cream to-nubia-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-9xl font-playfair font-bold text-nubia-gold mb-4">404</h1>
          <h2 className="text-3xl font-playfair font-bold text-nubia-black mb-2">Page Non Trouvée</h2>
          <p className="text-gray-600">La page que vous recherchez n'existe pas ou a été supprimée.</p>
        </div>

        {/* Illustration */}
        <div className="mb-12 text-6xl opacity-50">
          🔍
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-colors"
          >
            <Home size={20} />
            Accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-nubia-gold text-nubia-gold font-semibold rounded-lg hover:bg-nubia-gold/10 transition-colors"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
        </div>

        {/* Links */}
        <div className="mt-12 pt-8 border-t border-nubia-gold/20">
          <p className="text-sm text-gray-600 mb-4">Pages populaires:</p>
          <div className="flex flex-col gap-2">
            <Link href="/catalogue" className="text-nubia-gold hover:text-nubia-gold/80 transition-colors">
              → Catalogue
            </Link>
            <Link href="/sur-mesure" className="text-nubia-gold hover:text-nubia-gold/80 transition-colors">
              → Sur-Mesure
            </Link>
            <Link href="/contact" className="text-nubia-gold hover:text-nubia-gold/80 transition-colors">
              → Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
