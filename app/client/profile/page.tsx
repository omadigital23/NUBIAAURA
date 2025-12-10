'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslation } from '@/hooks/useTranslation';
import { User, Mail, Phone, ArrowLeft, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <section className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={40} />
            <p className="text-nubia-black/70">Chargement du profil...</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/client/dashboard"
              className="inline-flex items-center gap-2 text-nubia-gold hover:underline mb-4"
            >
              <ArrowLeft size={20} />
              Retour au tableau de bord
            </Link>
            <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-2">
              Mon Profil
            </h1>
            <p className="text-nubia-black/70">
              Gérez vos informations personnelles
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <p className="text-green-700 text-sm">Profil mis à jour avec succès</p>
            </div>
          )}

          {/* Profile Form */}
          <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8 mb-8">
            <h2 className="font-semibold text-nubia-black mb-6 flex items-center gap-2">
              <User className="text-nubia-gold" size={24} />
              Informations Personnelles
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg bg-nubia-black/5 text-nubia-black/50 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-nubia-black/50 mt-1">
                  L'email ne peut pas être modifié
                </p>
              </div>

              {/* Name */}
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
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                    placeholder={t('profile.name_placeholder', 'Votre nom complet')}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  {t('contact.phone_label', 'Téléphone')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all"
                    placeholder={t('contact.phone_placeholder', '+221 77 123 45 67')}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Mise à jour en cours...
                  </>
                ) : (
                  'Mettre à jour le profil'
                )}
              </button>
            </form>
          </div>

          {/* Account Actions */}
          <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8">
            <h2 className="font-semibold text-nubia-black mb-6">Actions du Compte</h2>
            <div className="space-y-3">
              <Link
                href="/client/addresses"
                className="block w-full py-3 px-4 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all text-center"
              >
                Gérer les Adresses
              </Link>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/');
                }}
                className="w-full py-3 px-4 border-2 border-red-600 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all"
              >
                {t('nav.logout', 'Déconnexion')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
