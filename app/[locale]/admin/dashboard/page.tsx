'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LogOut, ShoppingCart, Users, Package, BarChart3 } from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem('admin_token');
    const storedUsername = localStorage.getItem('admin_username');

    if (!token) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    setUsername(storedUsername || '');
    loadStats();
  }, [locale, router]);

  const loadStats = async () => {
    try {
      // Récupérer les statistiques
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
      ]);

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();

      const orders = ordersData.data || [];
      const products = productsData.data || [];

      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalCustomers: new Set(orders.map((o: any) => o.customer_id)).size,
        totalProducts: products.length,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    router.push(`/${locale}/admin/login`);
  };

  const menuItems = [
    { icon: ShoppingCart, label: t('admin.orders'), href: `/${locale}/admin/orders` },
    { icon: Package, label: t('admin.products'), href: `/${locale}/admin/products` },
    { icon: Users, label: t('admin.users'), href: `/${locale}/admin/users` },
    { icon: BarChart3, label: t('admin.statistics'), href: `/${locale}/admin/statistics` },
  ];

  const statCards = [
    {
      icon: ShoppingCart,
      label: t('admin.total_orders'),
      value: stats.totalOrders,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: Users,
      label: t('admin.total_customers'),
      value: stats.totalCustomers,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Package,
      label: t('admin.total_products'),
      value: stats.totalProducts,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: BarChart3,
      label: t('admin.total_revenue'),
      value: `${stats.totalRevenue.toLocaleString('fr-FR')} FCFA`,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-2">
                {t('admin.dashboard')}
              </h1>
              <p className="text-nubia-black/60">
                {t('admin.welcome')}, <span className="font-semibold">{username}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-lg hover:bg-red-100 transition-colors duration-300 font-semibold"
            >
              <LogOut size={20} />
              {t('admin.logout')}
            </button>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">{t('common.loading')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {statCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={index}
                      className={`${card.color} border border-nubia-gold/10 rounded-lg p-6`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-nubia-black">
                          {card.label}
                        </h3>
                        <Icon size={24} className={card.iconColor} />
                      </div>
                      <p className="text-3xl font-bold text-nubia-black">
                        {card.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={index}
                      href={item.href}
                      className="bg-nubia-white border-2 border-nubia-gold/20 rounded-lg p-6 hover:border-nubia-gold hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-nubia-gold/10 p-4 rounded-full group-hover:bg-nubia-gold/20 transition-colors">
                          <Icon size={32} className="text-nubia-gold" />
                        </div>
                      </div>
                      <h3 className="text-center font-semibold text-nubia-black group-hover:text-nubia-gold transition-colors">
                        {item.label}
                      </h3>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
