'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Lock, ArrowLeft, Loader, AlertCircle, CheckCircle, Eye, EyeOff, Mail } from 'lucide-react';

export default function ResetPasswordPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from sessionStorage on mount
  useEffect(() => {
    const savedEmail = sessionStorage.getItem('resetEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }

    setCode(newCode);

    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');

    if (!email) {
      setError(t('auth.email_required', 'Email requis'));
      return;
    }

    if (fullCode.length !== 6) {
      setError(t('auth.code_required', 'Veuillez entrer le code à 6 chiffres'));
      return;
    }

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
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: fullCode,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.error_resetting', 'Erreur lors de la réinitialisation'));
        return;
      }

      // Success!
      setSuccess(true);

      // Clear sessionStorage
      sessionStorage.removeItem('resetEmail');

      // Redirect to login
      setTimeout(() => {
        router.push(`/${locale}/auth/login?message=password_reset_success`);
      }, 2000);

    } catch (err: any) {
      setError(err.message || t('auth.error_resetting', 'Erreur lors de la réinitialisation'));
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
              href={`/${locale}/auth/forgot-password`}
              className="inline-flex items-center gap-2 text-nubia-gold hover:underline mb-6"
            >
              <ArrowLeft size={20} />
              {t('auth.back', 'Retour')}
            </Link>

            <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-2">
              {t('auth.reset_password', 'Réinitialiser le mot de passe')}
            </h1>
            <p className="text-nubia-black/70">
              {t('auth.enter_code_desc', 'Entrez le code reçu par email et votre nouveau mot de passe')}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-green-800">
                  {t('auth.password_reset_success', 'Mot de passe réinitialisé !')}
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
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
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

              {/* OTP Code */}
              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  {t('auth.verification_code', 'Code de vérification')}
                </label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    />
                  ))}
                </div>
                <p className="text-xs text-nubia-black/50 text-center mt-2">
                  {t('auth.code_hint', 'Entrez le code à 6 chiffres reçu par email')}
                </p>
              </div>

              {/* New Password */}
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

              {/* Confirm Password */}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || code.join('').length !== 6 || !password || !confirmPassword}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {t('common.loading', 'Chargement...')}
                  </>
                ) : (
                  t('auth.reset_password_button', 'Réinitialiser le mot de passe')
                )}
              </button>

              {/* Link to request new code */}
              <p className="text-center text-sm text-nubia-black/70">
                {t('auth.no_code', "Vous n'avez pas reçu le code ?")}
                {' '}
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-nubia-gold hover:underline font-medium"
                >
                  {t('auth.request_new_code', 'Demander un nouveau code')}
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
