'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const { locale } = useParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the hash fragment from the URL
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const errorParam = hashParams.get('error');
                const errorDescription = hashParams.get('error_description');

                // Check for errors in the URL
                if (errorParam) {
                    console.error('[Auth Callback] Error in URL:', errorParam, errorDescription);
                    setError(errorDescription || errorParam);
                    setTimeout(() => {
                        router.push(`/${locale}/auth/login?error=${encodeURIComponent(errorDescription || errorParam)}`);
                    }, 2000);
                    return;
                }

                // If we have tokens in the hash, set the session
                if (accessToken) {
                    console.log('[Auth Callback] Setting session from hash tokens');
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (sessionError) {
                        console.error('[Auth Callback] Session error:', sessionError);
                        setError(sessionError.message);
                        setTimeout(() => {
                            router.push(`/${locale}/auth/login?error=${encodeURIComponent(sessionError.message)}`);
                        }, 2000);
                        return;
                    }

                    // IMPORTANT: Save token to localStorage for the custom auth system
                    try {
                        localStorage.setItem('sb-auth-token', accessToken);
                        // Trigger token-changed event so useAuth and useCart pick it up
                        window.dispatchEvent(new CustomEvent('token-changed', { detail: accessToken }));
                        console.log('[Auth Callback] Token saved to localStorage and event dispatched');
                    } catch (e) {
                        console.error('[Auth Callback] Failed to save token:', e);
                    }

                    // Success - redirect to dashboard
                    console.log('[Auth Callback] Success, redirecting to dashboard');
                    router.push(`/${locale}/client/dashboard`);
                    return;
                }

                // Check for code in query params (OAuth flow)
                const searchParams = new URLSearchParams(window.location.search);
                const code = searchParams.get('code');
                const next = searchParams.get('next') || `/${locale}/client/dashboard`;

                if (code) {
                    console.log('[Auth Callback] Exchanging code for session');
                    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                    if (exchangeError) {
                        console.error('[Auth Callback] Exchange error:', exchangeError);
                        setError(exchangeError.message);
                        setTimeout(() => {
                            router.push(`/${locale}/auth/login?error=${encodeURIComponent(exchangeError.message)}`);
                        }, 2000);
                        return;
                    }

                    // Save token to localStorage for the custom auth system
                    if (exchangeData?.session?.access_token) {
                        try {
                            localStorage.setItem('sb-auth-token', exchangeData.session.access_token);
                            window.dispatchEvent(new CustomEvent('token-changed', { detail: exchangeData.session.access_token }));
                            console.log('[Auth Callback] Token saved after code exchange');
                        } catch (e) {
                            console.error('[Auth Callback] Failed to save token:', e);
                        }
                    }

                    // Success - redirect
                    router.push(next);
                    return;
                }

                // No tokens or code - check if already logged in
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.push(`/${locale}/client/dashboard`);
                    return;
                }

                // Nothing found - redirect to login
                console.log('[Auth Callback] No auth data found');
                setError('Aucune information d\'authentification trouvée');
                setTimeout(() => {
                    router.push(`/${locale}/auth/login`);
                }, 2000);

            } catch (err: any) {
                console.error('[Auth Callback] Exception:', err);
                setError(err.message || 'Erreur inattendue');
                setTimeout(() => {
                    router.push(`/${locale}/auth/login?error=unexpected`);
                }, 2000);
            }
        };

        handleAuthCallback();
    }, [router, locale]);

    return (
        <div className="min-h-screen bg-nubia-white flex flex-col items-center justify-center p-4">
            <div className="text-center">
                {error ? (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-nubia-black mb-2">Erreur d'authentification</h2>
                        <p className="text-nubia-black/70 mb-4">{error}</p>
                        <p className="text-sm text-nubia-black/50">Redirection vers la page de connexion...</p>
                    </>
                ) : (
                    <>
                        <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={48} />
                        <h2 className="text-xl font-bold text-nubia-black mb-2">Connexion en cours...</h2>
                        <p className="text-nubia-black/70">Veuillez patienter</p>
                    </>
                )}
            </div>
        </div>
    );
}
