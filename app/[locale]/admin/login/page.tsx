'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('admin.login_error'));
        setLoading(false);
        return;
      }

      // Stocker le token
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_username', data.username);

      // Rediriger vers le dashboard
      router.push(`/${locale}/admin/dashboard`);
    } catch (err: any) {
      setError(err.message || t('admin.login_error'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-nubia-gold p-3 rounded-full">
                <LogIn size={32} className="text-nubia-black" />
              </div>
            </div>
            <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-2">
              {t('admin.login')}
            </h1>
            <p className="text-nubia-black/60">
              {t('admin.title')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-nubia-black mb-2">
                {t('admin.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('admin.usernamePlaceholder') || 'Username'}
                className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-nubia-black mb-2">
                {t('admin.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('admin.password_placeholder', '••••••••')}
                className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-nubia-gold text-nubia-black font-semibold py-3 rounded-lg hover:bg-nubia-gold/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('admin.login_button')}
            </button>
          </form>

          {/* Footer Text */}
          <div className="mt-8 text-center text-sm text-nubia-black/60">
            <p>🔐 {t('admin.title')}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
