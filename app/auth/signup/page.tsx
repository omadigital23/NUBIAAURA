'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Lock, User, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function SignUpPage() {
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
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
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
        throw new Error(data.error || 'Erreur lors de l\'inscription');
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
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-2">
              Créer un compte
            </h1>
            <p className="text-nubia-black/70">
              Rejoignez la communauté Nubia Aura
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
                <p className="text-green-700 font-semibold text-sm">Inscription réussie !</p>
                <p className="text-green-600 text-sm">Redirection vers la connexion...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-nubia-black mb-2">
                Nom complet
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
                  placeholder="Votre nom"
                />
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <p className="text-xs text-nubia-black/50 mt-1">
                Minimum 8 caractères
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-nubia-black mb-2">
                Confirmer le mot de passe
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
                  placeholder="Confirmez votre mot de passe"
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
                  Inscription en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-nubia-gold/20">
            <p className="text-center text-nubia-black/70 mb-4">
              Vous avez déjà un compte ?
            </p>
            <Link
              href="/auth/login"
              className="block w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all text-center"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
