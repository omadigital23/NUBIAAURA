'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { useAuthToken } from '@/hooks/useAuthToken';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveToken } = useAuthToken();

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
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Save token to localStorage
      if (data.token) {
        saveToken(data.token);
      }

      // Redirect to target if provided, else to client dashboard
      const callbackUrl = searchParams.get('callbackUrl');
      const redirect = searchParams.get('redirect');
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
              Connexion
            </h1>
            <p className="text-nubia-black/70">
              Accédez à votre espace client
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
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                  placeholder="votre@email.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                  placeholder="••••••••"
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
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-nubia-gold/20">
            <p className="text-center text-nubia-black/70 mb-4">
              Pas encore de compte ?
            </p>
            <Link
              href="/auth/signup"
              className="block w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all text-center"
            >
              Créer un compte
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/contact"
              className="text-sm text-nubia-gold hover:underline"
            >
              Besoin d'aide ?
            </Link>
          </div>
        </div>
      </section>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-nubia-gold" size={40} />
        </div>
      }>
        <LoginForm />
      </Suspense>
      <Footer />
    </div>
  );
}
