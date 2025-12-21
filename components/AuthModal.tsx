'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';
import { useAuthToken } from '@/hooks/useAuthToken';
import { useTranslation } from '@/hooks/useTranslation';
import { signInWithGoogle } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);



export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null);
  const [error, setError] = useState('');
  const { saveToken } = useAuthToken();
  const { t, locale } = useTranslation();

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setOauthLoading('google');
      setError('');
      await signInWithGoogle(`${window.location.origin}/api/auth/callback?next=/${locale}`);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion avec Google');
      setOauthLoading(null);
    }
  };



  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Save token to localStorage
      if (data.token) {
        saveToken(data.token);
      }

      setLoginData({ email: '', password: '' });
      onLoginSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          password: signupData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Après inscription, se connecter automatiquement
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        // Save token to localStorage
        if (loginData.token) {
          saveToken(loginData.token);
        }
        setSignupData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
        onLoginSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center sm:p-4">
      <div className="bg-nubia-white rounded-none sm:rounded-lg max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-nubia-white border-b border-nubia-gold/20 p-6 flex items-center justify-between">
          <h2 className="font-playfair text-2xl font-bold text-nubia-black">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-nubia-gold/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-nubia-black" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading !== null || loading}
              className="w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {t('auth.continue_with_google', 'Continuer avec Google')}
            </button>


          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-nubia-gold/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-nubia-white text-nubia-black/60">
                {t('auth.or', 'ou')}
              </span>
            </div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder={t('auth.email_placeholder', 'votre@email.com')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder={t('auth.password_placeholder', '••••••••')}
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  onClick={onClose}
                  className="text-sm text-nubia-gold hover:text-nubia-black transition-colors"
                >
                  {t('auth.forgot_password', 'Mot de passe oublié ?')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || oauthLoading !== null}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {t('auth.logging_in', 'Connexion...')}
                  </>
                ) : (
                  t('auth.login_button', 'Se connecter')
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all"
              >
                {t('auth.signup_register', 'Créer un compte')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    {t('auth.first_name_label', 'Prénom')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                    <input
                      type="text"
                      value={signupData.firstName}
                      onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                      placeholder={t('auth.first_name_placeholder', 'Prénom')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    {t('auth.last_name_label', 'Nom')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                    <input
                      type="text"
                      value={signupData.lastName}
                      onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                      placeholder={t('auth.last_name_placeholder', 'Nom')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder={t('auth.email_placeholder', 'votre@email.com')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder={t('auth.password_placeholder', '••••••••')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  {t('auth.confirm_password_label', 'Confirmer mot de passe')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder={t('auth.password_placeholder', '••••••••')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || oauthLoading !== null}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {t('auth.signup_registering', 'Inscription...')}
                  </>
                ) : (
                  t('auth.signup_submit', 'Créer mon compte')
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all"
              >
                {t('auth.already_have_account', "J'ai déjà un compte")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
