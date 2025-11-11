'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslation } from '@/hooks/useTranslation';

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-6">
            {t('legal.terms.title', 'Conditions générales')}
          </h1>
          <p className="text-sm text-nubia-black/60 mb-8">
            {t('legal.updated', 'Dernière mise à jour')}
          </p>
          <div className="prose prose-sm md:prose lg:prose-lg max-w-none text-nubia-black">
            <p>{t('legal.terms.intro', "Veuillez lire attentivement ces conditions générales avant d'utiliser nos services.")}</p>
            <h2 className="mt-8">{t('legal.orders', 'Commandes')}</h2>
            <p>{t('legal.orders_details', "Les commandes sont traitées selon nos politiques de paiement et de livraison.")}</p>
            <h2 className="mt-8">{t('legal.returns', 'Retours')}</h2>
            <p>{t('legal.returns_details', "Vous disposez d'un délai de 30 jours pour retourner un article non porté.")}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
