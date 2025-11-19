'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Lock, ArrowLeft, Loader, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  
  // Get token from URL hash (Supabase sends it as #access_token=...)
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Extract token from URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      // Parse the access token from hash
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      setToken(accessToken);
      setTokenValid(!!accessToken);
    } else {
      setError(t('auth.invalid_link', 'Lien invalide ou expiré'));
    }
    setValidating(false);
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwords_mismatch', 'Les mots de passe ne correspondent pas'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.password_too_short', 'Le mot de passe doit contenir au moins 8 caractères'));
      return;
    }

    setLoading(true);

    try {
      // Use Supabase REST API to update password with access token
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/auth/user`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.message || data.error;
        
        if (response.status === 401 || response.status === 403 || errorMsg?.toLowerCase().includes('invalid')) {
          setError(t('auth.token_expired', 'Le lien a expiré. Veuillez demander une nouvelle réinitialisation.'));
          setTokenValid(false);
        } else {
          setError(errorMsg || t('auth.error_resetting', 'Erreur lors de la réinitialisation'));
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('auth.error_unknown', 'Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={40} />
            <p className="text-nubia-black/70">{t('common.loading', 'Chargement...')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              {t('auth.reset_password', 'Réinitialiser le mot de passe')}
            </h1>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-green-800">
                  {t('auth.password_reset_success', 'Mot de passe réinitialisé')}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {t('auth.redirecting_login', 'Redirection vers la connexion...')}
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
          {!success && tokenValid && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-nubia-black mb-2">
                  {t('auth.new_password', 'Nouveau mot de passe')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-nubia-gold/50" size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.password_placeholder', 'Au moins 8 caractères')}
                    className="w-full pl-10 pr-12 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-nubia-gold/60 hover:text-nubia-gold"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-nubia-black mb-2">
                  {t('auth.confirm_password', 'Confirmer le mot de passe')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-nubia-gold/50" size={20} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirm_password_placeholder', 'Confirmez le mot de passe')}
                    className="w-full pl-10 pr-12 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-nubia-gold/60 hover:text-nubia-gold"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {t('common.loading', 'Chargement...')}
                  </>
                ) : (
                  t('auth.reset_password_button', 'Réinitialiser')
                )}
              </button>
            </form>
          )}

          {/* Invalid Token */}
          {!success && !tokenValid && (
            <div className="text-center">
              <p className="mb-6 text-nubia-black/70">
                {t('auth.request_new_reset', 'Demandez un nouveau lien de réinitialisation')}
              </p>
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="inline-block px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-colors"
              >
                {t('auth.forgot_password', 'Mot de passe oublié')}
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
