'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, ArrowLeft, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use Supabase native password reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message || t('auth.error_sending_email', 'Erreur lors de l\'envoi de l\'email'));
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || t('auth.error_unknown', 'Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/${locale}/auth/login`}
              className="inline-flex items-center gap-2 text-nubia-gold hover:underline mb-6"
            >
              <ArrowLeft size={20} />
              {t('auth.back_to_login', 'Retour à la connexion')}
            </Link>

            <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-2">
              {t('auth.forgot_password', 'Mot de passe oublié')}
            </h1>
            <p className="text-nubia-black/70">
              {t('auth.forgot_password_desc', 'Entrez votre adresse email pour recevoir un lien de réinitialisation')}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-green-800 mb-1">
                  {t('auth.reset_email_sent', 'Email envoyé')}
                </p>
                <p className="text-sm text-green-700">
                  {t('auth.reset_email_sent_desc', 'Vérifiez votre email pour le lien de réinitialisation. Le lien expire dans 1 heure.')}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-nubia-black mb-2">
                  {t('auth.email', 'Email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-nubia-gold/50" size={20} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.email_placeholder', 'votre@email.com')}
                    className="w-full pl-10 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {t('common.loading', 'Chargement...')}
                  </>
                ) : (
                  t('auth.send_reset_link', 'Envoyer le lien')
                )}
              </button>
            </form>
          )}

          {/* Back Link */}
          {success && (
            <div className="text-center">
              <Link
                href={`/${locale}/auth/login`}
                className="text-nubia-gold hover:underline font-semibold"
              >
                {t('auth.back_to_login', 'Retour à la connexion')}
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
