"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Page /admin - Redirige vers le dashboard si authentifié
 */
export default function AdminPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      // Si authentifié, rediriger vers le dashboard avec tous les menus
      router.push(`/${locale}/admin/dashboard`);
    } else {
      setIsAuthenticated(false);
    }
  }, [locale, router]);

  // Afficher un écran de chargement pendant la vérification
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-nubia-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nubia-gold"></div>
          <p className="mt-4 text-nubia-black/60">{t('common.loading', 'Chargement...')}</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, afficher le message d'accès refusé avec lien vers login
  return (
    <div className="min-h-screen bg-nubia-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-4">
          {t('admin.access_denied', 'Accès Refusé')}
        </h1>
        <p className="text-nubia-black/60 mb-6">
          {t('admin.please_login', 'Veuillez vous connecter via la page de login')}
        </p>
        <a
          href={`/${locale}/admin/login`}
          className="bg-nubia-gold text-nubia-black px-6 py-2 rounded-lg hover:bg-nubia-gold/90 transition-colors"
        >
          {t('admin.go_to_login', 'Aller à la connexion')}
        </a>
      </div>
    </div>
  );
}
