'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslation } from '@/hooks/useTranslation';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-6">
            {t('legal.privacy_policy.title', 'Politique de confidentialité')}
          </h1>
          <p className="text-sm text-nubia-black/60 mb-8">
            {t('legal.updated', 'Dernière mise à jour')}
          </p>
          <div className="prose prose-sm md:prose lg:prose-lg max-w-none text-nubia-black">
            <p>{t('legal.privacy_policy.intro', "Cette politique explique comment nous collectons et utilisons vos données personnelles.")}</p>
            <h2 className="mt-8">{t('legal.data_collection', 'Collecte des données')}</h2>
            <p>{t('legal.data_collection_details', "Nous collectons uniquement les données nécessaires pour la fourniture de nos services.")}</p>
            <h2 className="mt-8">{t('legal.rights', 'Vos droits')}</h2>
            <p>{t('legal.rights_details', "Vous pouvez exercer vos droits d'accès, de rectification et de suppression en nous contactant.")}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
