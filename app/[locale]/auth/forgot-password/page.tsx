'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, ArrowLeft, Loader, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cooldown period in seconds (matches Supabase minimum interval)
const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  // Validate email format
  const isValidEmail = useCallback((emailToCheck: string) => {
    return EMAIL_REGEX.test(emailToCheck.trim());
  }, []);

  // Map Supabase error codes to user-friendly messages
  const getErrorMessage = useCallback((errorCode: string, defaultMessage: string) => {
    const errorMap: Record<string, string> = {
      'rate_limit_exceeded': t('auth.error_rate_limit', 'Trop de tentatives. Veuillez patienter quelques minutes.'),
      'invalid_email': t('auth.error_invalid_email', 'Email invalide'),
      'user_not_found': t('auth.reset_sent', 'Un email de réinitialisation a été envoyé'), // Don't reveal if user exists
      'over_email_send_rate_limit': t('auth.error_rate_limit', 'Trop de tentatives. Veuillez patienter quelques minutes.'),
    };
    return errorMap[errorCode] || defaultMessage;
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!isValidEmail(email)) {
      setError(t('auth.error_invalid_email', 'Email invalide'));
      return;
    }

    // Check cooldown
    if (cooldown > 0) {
      setError(t('auth.error_wait', `Veuillez patienter ${cooldown} secondes avant de réessayer.`));
      return;
    }

    setLoading(true);

    try {
      // Use Supabase native password reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
        }
      );

      if (resetError) {
        // Handle specific error codes
        const errorMessage = getErrorMessage(
          resetError.message?.toLowerCase().replace(/\s+/g, '_') || '',
          resetError.message || t('auth.error_sending_email', 'Erreur lors de l\'envoi de l\'email')
        );

        // If it's a rate limit error, set cooldown
        if (resetError.message?.toLowerCase().includes('rate') || resetError.message?.toLowerCase().includes('limit')) {
          setCooldown(COOLDOWN_SECONDS);
        }

        setError(errorMessage);
        return;
      }

      // Success
      setSentEmail(email);
      setSuccess(true);
      setCooldown(COOLDOWN_SECONDS);
      setEmail('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.error_unexpected', 'Une erreur inattendue s\'est produite');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend email
  const handleResend = async () => {
    if (cooldown > 0 || !sentEmail) return;

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        sentEmail.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
        }
      );

      if (resetError) {
        setError(getErrorMessage(
          resetError.message?.toLowerCase().replace(/\s+/g, '_') || '',
          resetError.message || t('auth.error_sending_email', 'Erreur lors de l\'envoi de l\'email')
        ));
        return;
      }

      setCooldown(COOLDOWN_SECONDS);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.error_unexpected', 'Une erreur inattendue s\'est produite');
      setError(errorMessage);
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
            <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-3 mb-4">
                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <p className="font-semibold text-green-800 mb-1">
                    {t('auth.reset_email_sent', 'Email envoyé')}
                  </p>
                  <p className="text-sm text-green-700">
                    {t('auth.reset_email_sent_to', 'Un email a été envoyé à')} <strong>{sentEmail}</strong>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {t('auth.reset_email_sent_desc', 'Vérifiez votre email pour le lien de réinitialisation. Le lien expire dans 1 heure.')}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    {t('auth.check_spam', 'Vérifiez également votre dossier spam.')}
                  </p>
                </div>
              </div>

              {/* Resend button */}
              <div className="border-t border-green-200 pt-4 mt-4">
                <p className="text-sm text-green-700 mb-3">
                  {t('auth.didnt_receive', "Vous n'avez pas reçu l'email ?")}
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || cooldown > 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {loading ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  {cooldown > 0
                    ? `${t('auth.resend_available_in', 'Renvoyer disponible dans')} ${cooldown}s`
                    : t('auth.resend_email', "Renvoyer l'email")
                  }
                </button>
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
                disabled={loading || !email || cooldown > 0}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {t('auth.sending', 'Envoi en cours...')}
                  </>
                ) : cooldown > 0 ? (
                  `${t('auth.resend_available_in', 'Renvoyer disponible dans')} ${cooldown}s`
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
