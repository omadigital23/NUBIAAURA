'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { User, ShoppingBag, LogOut, AlertCircle, MapPin, TrendingUp, Package } from 'lucide-react';

interface UserStats {
  totalSpent: number;
  totalOrders: number;
  totalAddresses: number;
  activeOrders: number;
  lastOrder?: {
    id: string;
    total: number;
    status: string;
    created_at: string;
  };
}

export default function ClientDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalSpent: 0,
    totalOrders: 0,
    totalAddresses: 0,
    activeOrders: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/dashboard`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchStats();
    }
  }, [isAuthenticated, user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/users/stats', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-nubia-black/70">{t('common.loading', 'Chargement...')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-2">
              {t('nav.account', 'Mon compte')}
            </h1>
            <p className="text-nubia-black/70">
              {t('dashboard.welcome', 'Bienvenue,')} {user.name || user.email}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-nubia-gold/20 flex items-center justify-center">
                    <User className="text-nubia-gold" size={32} />
                  </div>
                )}
                <div>
                  <h2 className="font-playfair text-2xl font-bold text-nubia-black">
                    {user.name || t('profile.default_name', 'Utilisateur')}
                  </h2>
                  <p className="text-nubia-black/70">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-nubia-white rounded-lg border border-nubia-gold/10">
                <p className="text-sm text-nubia-black/70 mb-1">{t('dashboard.role_label', 'Rôle')}</p>
                <p className="font-semibold text-nubia-black capitalize">
                  {user.role === 'customer' ? 'Client' : user.role}
                </p>
              </div>
              <div className="p-4 bg-nubia-white rounded-lg border border-nubia-gold/10">
                <p className="text-sm text-nubia-black/70 mb-1">{t('dashboard.status_label', 'Statut')}</p>
                <p className="font-semibold text-green-600">{t('dashboard.status_active', 'Actif')}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              <LogOut size={20} />
              {t('nav.logout', 'Déconnexion')}
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Spent */}
            <div className="bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-nubia-black">
                  {t('dashboard.total_spent')}
                </h3>
                <TrendingUp size={24} className="text-nubia-gold" />
              </div>
              <p className="text-3xl font-bold text-nubia-black">
                {(stats.totalSpent || 0).toLocaleString('fr-FR')} FCFA
              </p>
            </div>

            {/* Total Orders */}
            <div className="bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-nubia-black">
                  {t('dashboard.total_orders')}
                </h3>
                <ShoppingBag size={24} className="text-nubia-gold" />
              </div>
              <p className="text-3xl font-bold text-nubia-black">
                {stats.totalOrders}
              </p>
            </div>

            {/* Active Orders */}
            <div className="bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-nubia-black">
                  {t('dashboard.active_orders')}
                </h3>
                <Package size={24} className="text-nubia-gold" />
              </div>
              <p className="text-3xl font-bold text-nubia-black">
                {stats.activeOrders}
              </p>
            </div>

            {/* Saved Addresses */}
            <div className="bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-nubia-black">
                  {t('dashboard.saved_addresses')}
                </h3>
                <MapPin size={24} className="text-nubia-gold" />
              </div>
              <p className="text-3xl font-bold text-nubia-black">
                {stats.totalAddresses}
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Orders */}
            <a
              href={`/${locale}/client/orders`}
              className="p-6 bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg hover:border-nubia-gold transition-colors group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-nubia-gold/20 rounded-lg group-hover:bg-nubia-gold/30 transition-colors">
                  <ShoppingBag className="text-nubia-gold" size={24} />
                </div>
                <h3 className="font-playfair text-xl font-bold text-nubia-black">
                  {t('nav.my_orders')}
                </h3>
              </div>
              <p className="text-nubia-black/70 text-sm">
                {t('dashboard.view_all_orders')}
              </p>
            </a>

            {/* Settings */}
            <a
              href={`/${locale}/client/settings`}
              className="p-6 bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg hover:border-nubia-gold transition-colors group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-nubia-gold/20 rounded-lg group-hover:bg-nubia-gold/30 transition-colors">
                  <User className="text-nubia-gold" size={24} />
                </div>
                <h3 className="font-playfair text-xl font-bold text-nubia-black">
                  {t('nav.settings')}
                </h3>
              </div>
              <p className="text-nubia-black/70 text-sm">
                {t('settings.manage_info')}
              </p>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
