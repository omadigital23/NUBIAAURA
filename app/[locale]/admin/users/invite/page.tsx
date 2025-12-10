'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function InviteUserPage() {
    const { locale } = useParams();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    role,
                    redirectTo: `${window.location.origin}/${locale}/auth/complete-signup`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            setSuccess(true);
            setEmail('');
        } catch (err: any) {
            setError(err.message || t('auth.invite_error', 'Erreur lors de l\'envoi de l\'invitation'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">
                            {t('auth.invite_title', 'Inviter un utilisateur')}
                        </h1>
                        <p className="text-neutral-600">
                            {t('auth.invite_subtitle', 'Envoyez une invitation par email')}
                        </p>
                    </div>
                    <Link
                        href={`/${locale}/admin/users`}
                        className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition"
                    >
                        ← Retour
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-green-600 mb-2">
                                {t('auth.invite_sent', 'Invitation envoyée avec succès')}
                            </h3>
                            <p className="text-neutral-600 mb-6">
                                L'utilisateur recevra un email avec un lien pour créer son compte.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="px-6 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#C4A030] transition"
                                >
                                    Inviter un autre utilisateur
                                </button>
                                <Link
                                    href={`/${locale}/admin/users`}
                                    className="px-6 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition"
                                >
                                    Voir les utilisateurs
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    {t('auth.email', 'Email')} *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.invite_email_placeholder', 'email@example.com')}
                                    required
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    {t('auth.invite_role', 'Rôle')} *
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${role === 'user'
                                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="user"
                                            checked={role === 'user'}
                                            onChange={() => setRole('user')}
                                            className="sr-only"
                                        />
                                        <div className="text-center">
                                            <svg className="w-8 h-8 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="font-medium">{t('auth.role_user', 'Utilisateur')}</span>
                                        </div>
                                        {role === 'user' && (
                                            <div className="absolute top-2 right-2">
                                                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </label>

                                    <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${role === 'admin'
                                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="admin"
                                            checked={role === 'admin'}
                                            onChange={() => setRole('admin')}
                                            className="sr-only"
                                        />
                                        <div className="text-center">
                                            <svg className="w-8 h-8 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            <span className="font-medium">{t('auth.role_admin', 'Administrateur')}</span>
                                        </div>
                                        {role === 'admin' && (
                                            <div className="absolute top-2 right-2">
                                                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </label>
                                </div>
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
                                        Envoi en cours...
                                    </span>
                                ) : (
                                    t('auth.send_invite', 'Envoyer l\'invitation')
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
