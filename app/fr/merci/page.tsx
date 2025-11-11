"use client";

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function MerciContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <svg className="w-24 h-24 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Merci pour votre commande !
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Votre commande a été confirmée avec succès
          </p>
        </div>

        {orderId && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
            <p className="text-gray-700 mb-2 font-semibold">Numéro de commande :</p>
            <p className="text-2xl font-bold text-yellow-600">{orderId}</p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-gray-600">
            Nous vous avons envoyé un email de confirmation avec les détails de votre commande.
          </p>
          
          <div className="flex gap-4 justify-center mt-8">
            <Link
              href="/fr/catalogue"
              className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
            >
              Retour au Catalogue
            </Link>
            <Link
              href="/fr"
              className="px-6 py-3 border-2 border-yellow-500 text-yellow-600 font-semibold rounded-lg hover:bg-yellow-50 transition"
            >
              Retour à l'Accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MerciPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <MerciContent />
    </Suspense>
  );
}
