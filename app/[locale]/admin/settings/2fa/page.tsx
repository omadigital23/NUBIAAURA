'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Shield, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function Admin2FASetupPage() {
    const router = useRouter();
    const { locale, t } = useTranslation();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('admin_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const adminEmail = localStorage.getItem('admin_username') || 'admin';
            const res = await fetch('/api/admin/2fa/setup', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ email: adminEmail })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || t('admin.twofa.generate_error', 'Erreur de generation'));

            setQrCode(data.qrCode);
            setSecret(data.secret);
            setSuccess(t('admin.twofa.generated', 'QR Code genere avec succes. Veuillez le scanner.'));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/2fa/verify', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ code: verifyCode, secret })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || t('admin.twofa.invalid_code', 'Code invalide'));

            setIsVerified(true);
            setSuccess(t('admin.twofa.configured', '2FA configuree avec succes ! Mettez a jour ADMIN_2FA_SECRET dans votre .env'));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copySecret = async () => {
        if (secret) {
            try {
                await navigator.clipboard.writeText(secret);
                setSuccess(t('admin.twofa.secret_copied', 'Secret copie dans le presse-papiers'));
            } catch {
                setError(t('admin.twofa.copy_failed', 'Impossible de copier le secret dans le presse-papiers'));
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.push(`/${locale}/admin/dashboard`)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-nubia-gold/20 text-nubia-gold rounded-xl">
                                <Shield size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-nubia-black">{t('admin.twofa.title', 'Configuration 2FA')}</h1>
                                <p className="text-gray-600 mt-1">{t('admin.twofa.subtitle', "Securisez l'acces a votre interface administrateur")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                                <AlertCircle className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                        
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
                                <CheckCircle className="shrink-0" />
                                <p>{success}</p>
                            </div>
                        )}

                        {!qrCode ? (
                            <div className="text-center py-8">
                                <Shield size={64} className="mx-auto text-gray-300 mb-6" />
                                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('admin.twofa.enable_title', 'Activer la double authentification')}</h2>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    {t('admin.twofa.enable_desc', 'Generez un QR code pour configurer Google Authenticator ou Authy sur votre telephone pour ajouter une couche de securite supplementaire.')}
                                </p>
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="px-8 py-3 bg-nubia-gold text-black font-semibold rounded-xl hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {loading ? t('admin.twofa.generating', 'Generation...') : t('admin.twofa.start_setup', 'Commencer la configuration')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-nubia-black mb-2">{t('admin.twofa.scan_title', '1. Scannez le QR Code')}</h3>
                                        <p className="text-gray-600 mb-4">
                                            {t('admin.twofa.scan_desc', 'Utilisez Google Authenticator, Authy ou toute autre application TOTP pour scanner ce code.')}
                                        </p>
                                        <div className="bg-gray-50 p-4 rounded-2xl flex justify-center border border-gray-200">
                                            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg shadow-sm" />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">{t('admin.twofa.manual_key', 'Ou saisissez la cle manuellement :')}</p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-gray-100 p-3 rounded-lg text-sm font-mono break-all text-gray-800">
                                                {secret}
                                            </code>
                                            <button 
                                                onClick={copySecret}
                                                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                                            >
                                                <Copy size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <h3 className="text-lg font-bold text-nubia-black mb-2">{t('admin.twofa.verify_title', '2. Verifiez le code')}</h3>
                                        <p className="text-gray-600 mb-6 text-sm">
                                            {t('admin.twofa.verify_desc', 'Entrez le code a 6 chiffres genere par votre application pour confirmer la configuration.')}
                                        </p>

                                        <form onSubmit={handleVerify} className="space-y-4">
                                            <input
                                                type="text"
                                                value={verifyCode}
                                                onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="123456"
                                                maxLength={6}
                                                className="w-full px-4 py-3 text-center tracking-[0.5em] text-2xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                                                required
                                                disabled={isVerified || loading}
                                            />
                                            
                                            <button
                                                type="submit"
                                                disabled={verifyCode.length !== 6 || isVerified || loading}
                                                className="w-full py-3 bg-nubia-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? t('admin.twofa.verifying', 'Verification...') : isVerified ? t('admin.twofa.code_validated', 'Code valide') : t('admin.twofa.verify_button', 'Verifier le code')}
                                            </button>
                                        </form>

                                        {isVerified && (
                                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                                                <strong className="block mb-1">{t('admin.twofa.finished_title', 'Configuration terminee !')}</strong>
                                                {t('admin.twofa.finished_prefix', "N'oubliez pas d'ajouter")} <code className="bg-yellow-100 px-1 py-0.5 rounded">ADMIN_2FA_SECRET={secret}</code> {t('admin.twofa.finished_and', 'et')} <code className="bg-yellow-100 px-1 py-0.5 rounded">ADMIN_2FA_ENABLED=true</code> {t('admin.twofa.finished_suffix', 'dans votre fichier .env pour activer la protection.')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
