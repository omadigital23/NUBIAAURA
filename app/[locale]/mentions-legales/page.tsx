'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslation } from '@/hooks/useTranslation';

export default function MentionsLegalesPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-6">
            {t('legal.legal_notice.title', 'Mentions légales')}
          </h1>
          <p className="text-sm text-nubia-black/60 mb-8">
            {t('legal.updated', 'Dernière mise à jour')}
          </p>
          <div className="prose prose-sm md:prose lg:prose-lg max-w-none text-nubia-black">
            <p>{t('legal.legal_notice.intro', "Informations légales concernant Nubia Aura.")}</p>
            <h2 className="mt-8">{t('legal.company', 'Société')}</h2>
            <p>{t('legal.company_details', "Nubia Aura, société enregistrée.")}</p>
            <h2 className="mt-8">{t('legal.contact', 'Contact')}</h2>
            <p>{t('legal.contact_details', "Pour toute question, contactez-nous via la page Contact.")}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
