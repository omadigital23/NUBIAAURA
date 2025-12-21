'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertCircle, ArrowLeft, User, Mail, Lock, Loader } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/settings`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-nubia-black/70">{t('common.loading', 'Chargement...')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href={`/${locale}/client/dashboard`}
              className="p-2 hover:bg-nubia-gold/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-nubia-gold" size={24} />
            </Link>
            <div>
              <h1 className="font-playfair text-4xl font-bold text-nubia-black">
                {t('nav.settings', 'Paramètres')}
              </h1>
              <p className="text-nubia-black/70">
                {t('settings.manage_info', 'Gérez vos informations personnelles')}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{t('common.profile_updated', 'Profil mis à jour avec succès!')}</p>
            </div>
          )}

          {/* Profile Form */}
          <div className="bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg p-8 mb-8">
            <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
              {t('settings.personal_info', 'Informations Personnelles')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  {t('contact.name_label', 'Nom complet')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                    placeholder={t('auth.first_name_placeholder', 'Votre nom')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg bg-nubia-white/50 text-nubia-black/50 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-nubia-black/50 mt-1">
                  {t('settings.email_change_hint', "Pour changer votre email, utilisez le bouton dans la section Sécurité")}
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {t('common.saving', 'Enregistrement...')}
                  </>
                ) : (
                  t('common.save_changes', 'Enregistrer les modifications')
                )}
              </button>
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg p-8">
            <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
              {t('settings.security', 'Sécurité')}
            </h2>

            <div className="space-y-4">
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="w-full p-4 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-colors flex items-center gap-3"
              >
                <Lock size={20} />
                {t('settings.change_password', 'Changer le mot de passe')}
              </Link>
              <Link
                href={`/${locale}/client/settings/change-email`}
                className="w-full p-4 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-colors flex items-center gap-3"
              >
                <Mail size={20} />
                {t('auth.change_email_title', "Changer l'adresse email")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
