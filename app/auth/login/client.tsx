'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthToken } from '@/hooks/useAuthToken';

export default function LoginFormClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveToken } = useAuthToken();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.error_login_failed'));
      }

      // Save token to localStorage
      if (data.token) {
        saveToken(data.token);
      }

      // Redirect to target if provided, else to client dashboard
      const callbackUrl = searchParams?.get('callbackUrl');
      const redirect = searchParams?.get('redirect');
      router.push(callbackUrl || redirect || '/client/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-2">
            {t('auth.login_title')}
          </h1>
          <p className="text-nubia-black/70">
            {t('auth.login_subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-nubia-black mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                placeholder={t('auth.email_placeholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-nubia-black mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                placeholder={t('auth.password_placeholder')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                {t('auth.logging_in')}
              </>
            ) : (
              t('auth.login_button')
            )}
          </button>

          <div className="text-center mt-4">
            <a
              href="/auth/forgot-password"
              className="text-sm text-nubia-gold hover:text-nubia-gold/70 hover:underline font-medium"
            >
              {t('auth.forgot_password')}
            </a>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-nubia-gold/20">
          <p className="text-center text-nubia-black/70 mb-4">
            {t('auth.no_account')}
          </p>
          <Link
            href="/auth/signup"
            className="block w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all text-center"
          >
            {t('auth.create_account')}
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/contact"
            className="text-sm text-nubia-gold hover:underline"
          >
            {t('auth.need_help')}
          </Link>
        </div>
      </div>
    </section>
  );
}
