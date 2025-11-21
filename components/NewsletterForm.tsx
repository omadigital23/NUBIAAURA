'use client';

import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function NewsletterForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError(t('common.error'));
        setLoading(false);
        return;
      }

      // Call API to save to Supabase
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('common.error'));
      }

      setSuccess(true);
      setEmail('');

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <div className="flex-1 relative">
        <label htmlFor="newsletter-email" className="sr-only">
          {t('newsletter.email_label')}
        </label>
        <Mail className="absolute left-3 top-3 text-nubia-gold" size={20} aria-hidden="true" />
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('common.search')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          aria-label={t('newsletter.email_label')}
          className="w-full pl-10 pr-4 py-3 border border-nubia-gold/30 rounded-lg bg-nubia-white text-nubia-black placeholder-nubia-black/50 focus:outline-none focus:border-nubia-gold transition-colors disabled:opacity-50"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading || success}
        aria-label={t('newsletter.subscribe')}
        className="px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2"
      >
        {success ? (
          <>
            <Check size={18} />
            {t('common.success')}
          </>
        ) : loading ? (
          t('common.loading')
        ) : (
          t('newsletter.subscribe')
        )}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  );
}
