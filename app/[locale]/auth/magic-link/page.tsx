'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function MagicLinkPage() {
    const { locale } = useParams();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    // Supabase will redirect to this URL after email verification
                    redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/client/dashboard`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send magic link');
            }

            setSuccess(true);
            setEmail('');
        } catch (err: any) {
            setError(err.message || t('auth.magic_link_error', 'Erreur lors de l\'envoi du lien magique'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href={`/${locale}`}>
                        <h1 className="text-3xl font-bold text-black">
                            Nubia<span className="text-[#D4AF37]">Aura</span>
                        </h1>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-center mb-2">
                        {t('auth.magic_link_title', 'Connexion par lien magique')}
                    </h2>
                    <p className="text-neutral-600 text-center mb-6">
                        {t('auth.magic_link_subtitle', 'Recevez un lien de connexion par email')}
                    </p>

                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-green-600 mb-2">
                                {t('auth.magic_link_sent', 'Un lien de connexion a été envoyé à votre email')}
                            </h3>
                            <p className="text-neutral-600 mb-4">
                                {t('auth.check_email', 'Vérifiez votre boîte mail')}
                            </p>
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-[#D4AF37] hover:underline"
                            >
                                {t('auth.send_magic_link', 'Envoyer le lien')} →
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    {t('auth.email', 'Email')}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.email_placeholder', 'votre@email.com')}
                                    required
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#C4A030] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {t('auth.sending', 'Envoi en cours...')}
                                    </span>
                                ) : (
                                    t('auth.send_magic_link', 'Envoyer le lien')
                                )}
                            </button>
                        </form>
                    )}

                    {/* Links */}
                    <div className="mt-6 text-center space-y-2">
                        <Link
                            href={`/${locale}/auth/login`}
                            className="text-[#D4AF37] hover:underline block"
                        >
                            {t('auth.use_password', 'Utiliser un mot de passe')}
                        </Link>
                        <p className="text-neutral-600">
                            {t('auth.no_account', 'Pas encore de compte ?')}{' '}
                            <Link href={`/${locale}/auth/signup`} className="text-[#D4AF37] hover:underline">
                                {t('auth.create_account', 'Créer un compte')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
