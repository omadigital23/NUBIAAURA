'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LogOut, ShoppingCart, Users, Package, BarChart3, RotateCcw, Boxes, Palette, MessageSquare, Percent, Star, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalStock?: number;
  stockValue?: number;
  outOfStock?: number;
  lowStock?: number;
  ordersByStatus?: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  conversionRate?: number;
  averageOrderValue?: number;
  activeCustomers?: number;
}

interface AnalyticsData {
  revenueTimeSeries: { date: string; label: string; revenue: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  statusDistribution: { status: string; label: string; count: number; color: string }[];
  kpiDeltas: {
    revenue: { current: number; previous: number; delta: number };
    orders: { current: number; previous: number; delta: number };
  };
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
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
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
    loadAnalytics();
  }, [locale, router]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('No admin token');
      }

      // Récupérer les statistiques avancées depuis la nouvelle API
      const statsRes = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsRes.ok) {
        throw new Error('Failed to load stats');
      }

      const statsData = await statsRes.json();
      const advancedStats = statsData.stats;

      setStats({
        totalOrders: advancedStats.orders.total,
        totalRevenue: advancedStats.revenue.total,
        totalCustomers: advancedStats.customers.total,
        totalProducts: advancedStats.products.total,
        totalStock: advancedStats.stock.total,
        stockValue: advancedStats.stock.value,
        outOfStock: advancedStats.stock.outOfStock,
        lowStock: advancedStats.stock.lowStock,
        ordersByStatus: advancedStats.orders.byStatus,
        conversionRate: advancedStats.customers.conversionRate,
        averageOrderValue: advancedStats.revenue.averageOrderValue,
        activeCustomers: advancedStats.customers.active,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    router.push(`/${locale}/admin/login`);
  };

  const menuItems = [
    { icon: ShoppingCart, label: t('admin.orders'), href: `/${locale}/admin/orders` },
    { icon: Palette, label: t('admin.custom_orders', 'Commandes Sur-mesure'), href: `/${locale}/admin/submissions` },
    { icon: Package, label: t('admin.products'), href: `/${locale}/admin/products` },
    { icon: Boxes, label: t('admin.stock_management', 'Gestion du Stock'), href: `/${locale}/admin/stock` },
    { icon: Users, label: t('admin.users'), href: `/${locale}/admin/users` },
    { icon: BarChart3, label: t('admin.delivery_tracking', 'Suivi Livraison'), href: `/${locale}/admin/delivery-stats` },
    { icon: RotateCcw, label: t('admin.returns_management', 'Gestion Retours'), href: `/${locale}/admin/returns` },
    { icon: MessageSquare, label: t('admin.contacts', 'Messages & Newsletter'), href: `/${locale}/admin/submissions` },
    { icon: Percent, label: 'Codes Promo', href: `/${locale}/admin/promos` },
    { icon: Star, label: 'Modération Avis', href: `/${locale}/admin/reviews` },
    { icon: Shield, label: t('admin.security_2fa', 'Sécurité 2FA'), href: `/${locale}/admin/settings/2fa` },
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
      value: `${(stats.totalRevenue || 0).toLocaleString('fr-FR')} FCFA`,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      icon: Boxes,
      label: t('admin.total_stock'),
      value: stats.totalStock || 0,
      color: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      icon: BarChart3,
      label: t('admin.stock_value'),
      value: `${((stats.stockValue || 0) / 1000).toFixed(0)}k FCFA`,
      color: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      icon: ShoppingCart,
      label: t('admin.orders_pending'),
      value: stats.ordersByStatus?.pending || 0,
      color: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      icon: ShoppingCart,
      label: t('admin.orders_shipped'),
      value: stats.ordersByStatus?.shipped || 0,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: ShoppingCart,
      label: t('admin.orders_delivered'),
      value: stats.ordersByStatus?.delivered || 0,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Users,
      label: t('admin.conversion_rate'),
      value: `${(stats.conversionRate || 0).toFixed(1)}%`,
      color: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
    {
      icon: BarChart3,
      label: t('admin.average_order_value'),
      value: `${(stats.averageOrderValue || 0).toLocaleString('fr-FR')} FCFA`,
      color: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      icon: Users,
      label: t('admin.active_customers'),
      value: stats.activeCustomers || 0,
      color: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      icon: Package,
      label: t('admin.out_of_stock'),
      value: stats.outOfStock || 0,
      color: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      icon: Package,
      label: t('admin.low_stock'),
      value: stats.lowStock || 0,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  // Custom tooltip for charts
  const GoldTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-nubia-black border border-nubia-gold/30 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-nubia-gold text-xs font-semibold mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-nubia-white text-sm">
            {entry.value?.toLocaleString('fr-FR')} {entry.name === 'revenue' ? 'FCFA' : ''}
          </p>
        ))}
      </div>
    );
  };

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
              {/* KPI Delta Cards */}
              {analytics?.kpiDeltas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-nubia-black to-nubia-dark rounded-xl p-6 border border-nubia-gold/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-nubia-gold/70 text-sm font-semibold uppercase tracking-wider">
                        {t('admin.revenue_this_month', 'Revenus ce mois')}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-sm font-bold rounded-full px-3 py-1 ${
                        analytics.kpiDeltas.revenue.delta >= 0
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {analytics.kpiDeltas.revenue.delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {analytics.kpiDeltas.revenue.delta >= 0 ? '+' : ''}{analytics.kpiDeltas.revenue.delta}%
                      </span>
                    </div>
                    <p className="font-playfair text-3xl font-bold text-nubia-gold">
                      {analytics.kpiDeltas.revenue.current.toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-nubia-white/40 text-xs mt-1">
                      vs {analytics.kpiDeltas.revenue.previous.toLocaleString('fr-FR')} FCFA {t('admin.previous_month', 'mois précédent')}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-nubia-black to-nubia-dark rounded-xl p-6 border border-nubia-gold/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-nubia-gold/70 text-sm font-semibold uppercase tracking-wider">
                        {t('admin.orders_this_month', 'Commandes ce mois')}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-sm font-bold rounded-full px-3 py-1 ${
                        analytics.kpiDeltas.orders.delta >= 0
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {analytics.kpiDeltas.orders.delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {analytics.kpiDeltas.orders.delta >= 0 ? '+' : ''}{analytics.kpiDeltas.orders.delta}%
                      </span>
                    </div>
                    <p className="font-playfair text-3xl font-bold text-nubia-gold">
                      {analytics.kpiDeltas.orders.current}
                    </p>
                    <p className="text-nubia-white/40 text-xs mt-1">
                      vs {analytics.kpiDeltas.orders.previous} {t('admin.previous_month', 'mois précédent')}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
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

              {/* ── Charts Section ──────────────────────────────────── */}
              {analytics && (
                <div className="mb-12 space-y-8">
                  <h2 className="font-playfair text-2xl font-bold text-nubia-black">
                    {t('admin.analytics_title', 'Analyses visuelles')}
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Line Chart — spans 2 cols */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-nubia-black to-nubia-dark rounded-xl p-6 border border-nubia-gold/20">
                      <h3 className="text-nubia-gold font-semibold mb-4 text-sm uppercase tracking-wider">
                        {t('admin.revenue_30_days', 'Revenus — 30 derniers jours')}
                      </h3>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.revenueTimeSeries} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
                            <XAxis
                              dataKey="label"
                              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                              axisLine={{ stroke: 'rgba(212,175,55,0.2)' }}
                              tickLine={false}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<GoldTooltip />} />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              stroke="#D4AF37"
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 5, fill: '#D4AF37', stroke: '#1A1A1A', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Order Status Pie Chart */}
                    <div className="bg-nubia-white border-2 border-nubia-gold/15 rounded-xl p-6">
                      <h3 className="text-nubia-black font-semibold mb-4 text-sm uppercase tracking-wider">
                        {t('admin.order_status_title', 'Statut des commandes')}
                      </h3>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.statusDistribution}
                              cx="50%"
                              cy="45%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="count"
                              nameKey="label"
                            >
                              {analytics.statusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [value ?? 0, '']}
                              contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, color: '#D4AF37' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              formatter={(value) => <span className="text-xs text-nubia-black/70">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Top Products Bar Chart */}
                  {analytics.topProducts.length > 0 && (
                    <div className="bg-nubia-white border-2 border-nubia-gold/15 rounded-xl p-6">
                      <h3 className="text-nubia-black font-semibold mb-4 text-sm uppercase tracking-wider">
                        {t('admin.top_products_title', 'Top 5 Produits — par revenu')}
                      </h3>
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" horizontal={false} />
                            <XAxis
                              type="number"
                              tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={140}
                              tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={<GoldTooltip />} />
                            <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 6, 6, 0]} barSize={28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
