'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, ArrowLeft, Loader, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cooldown period in seconds
const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
      // Use our OTP API instead of Supabase magic link
      const response = await fetch('/api/auth/reset-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.error_sending_email', 'Erreur lors de l\'envoi'));
        return;
      }

      // Success - redirect to reset page with email
      setSuccess(true);
      setCooldown(COOLDOWN_SECONDS);

      // Store email in sessionStorage for the reset page
      sessionStorage.setItem('resetEmail', email.trim().toLowerCase());

      // Redirect to reset page after short delay
      setTimeout(() => {
        router.push(`/${locale}/auth/reset-password`);
      }, 1500);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('auth.error_unexpected', 'Une erreur inattendue s\'est produite');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend
  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.error_sending_email', 'Erreur lors de l\'envoi'));
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
              {t('auth.forgot_password_otp_desc', 'Entrez votre email pour recevoir un code de réinitialisation')}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-3 mb-4">
                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <p className="font-semibold text-green-800 mb-1">
                    {t('auth.code_sent', 'Code envoyé !')}
                  </p>
                  <p className="text-sm text-green-700">
                    {t('auth.code_sent_desc', 'Un code à 6 chiffres a été envoyé à votre email.')}
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    {t('auth.redirecting', 'Redirection en cours...')}
                  </p>
                </div>
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
                  t('auth.send_code', 'Envoyer le code')
                )}
              </button>
            </form>
          )}

          {/* Resend Button (when success) */}
          {success && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-nubia-gold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                {cooldown > 0
                  ? `${t('auth.resend_available_in', 'Renvoyer disponible dans')} ${cooldown}s`
                  : t('auth.resend_code', 'Renvoyer le code')
                }
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
