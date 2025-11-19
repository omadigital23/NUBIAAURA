'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function SignUpFormClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.error_password_mismatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('auth.error_weak_password'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.error_unexpected'));
      }

      setSuccess(true);
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
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
            {t('auth.signup_title')}
          </h1>
          <p className="text-nubia-black/70">
            {t('auth.signup_subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <div>
              <p className="text-green-700 font-semibold text-sm">{t('auth.success_signup')}</p>
              <p className="text-green-600 text-sm">{t('auth.redirecting_login')}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-nubia-black mb-2">
              {t('auth.first_name')}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                placeholder={t('auth.first_name_placeholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-nubia-black mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                placeholder={t('auth.password_placeholder')}
              />
            </div>
            <p className="text-xs text-nubia-black/50 mt-1">
              {t('auth.password_min_length', 'Minimum 8 caractères')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-nubia-black mb-2">
              {t('auth.confirm_password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                placeholder={t('auth.confirm_password_placeholder')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                {t('auth.signing_up')}
              </>
            ) : (
              t('auth.signup_button')
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-nubia-gold/20">
          <p className="text-center text-nubia-black/70 mb-4">
            {t('auth.already_have_account')}
          </p>
          <Link
            href="/auth/login"
            className="block w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all text-center"
          >
            {t('auth.login_here')}
          </Link>
        </div>
      </div>
    </section>
  );
}
