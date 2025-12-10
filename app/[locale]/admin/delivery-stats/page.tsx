'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface DeliveryStats {
  totalOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  overdueOrders: number;
  averageDeliveryTime: number;
  onTimePercentage: number;
  returnRequests: number;
  approvedReturns: number;
  rejectedReturns: number;
}

interface OrderStatus {
  status: string;
  count: number;
  percentage: number;
}

export default function AdminDeliveryStatsPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    loadStats();
  }, [locale, router]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('No admin token found');
      }

      const [ordersRes, returnsRes] = await Promise.all([
        fetch('/api/admin/orders/list', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/admin/returns/list', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (!ordersRes.ok || !returnsRes.ok) {
        throw new Error('Failed to load stats');
      }

      const ordersData = await ordersRes.json();
      const returnsData = await returnsRes.json();

      const orders = ordersData.orders || [];
      const returns = returnsData.returns || [];

      // Calculate stats
      const totalOrders = orders.length;
      const shippedOrders = orders.filter((o: any) => o.status === 'shipped').length;
      const deliveredOrders = orders.filter((o: any) => o.status === 'delivered').length;
      
      // Count overdue orders (estimated delivery date passed)
      const overdueOrders = orders.filter((o: any) => {
        if (!o.estimated_delivery_date) return false;
        return new Date(o.estimated_delivery_date) < new Date() && o.status !== 'delivered';
      }).length;

      // Calculate average delivery time
      const deliveredWithTime = orders.filter(
        (o: any) => o.shipped_at && o.delivered_at
      );
      const averageDeliveryTime =
        deliveredWithTime.length > 0
          ? Math.round(
              deliveredWithTime.reduce((sum: number, o: any) => {
                const shipped = new Date(o.shipped_at).getTime();
                const delivered = new Date(o.delivered_at).getTime();
                return sum + (delivered - shipped) / (1000 * 60 * 60 * 24);
              }, 0) / deliveredWithTime.length
            )
          : 0;

      // Calculate on-time percentage
      const onTimeOrders = orders.filter((o: any) => {
        if (!o.estimated_delivery_date || !o.delivered_at) return false;
        return new Date(o.delivered_at) <= new Date(o.estimated_delivery_date);
      }).length;
      const onTimePercentage =
        deliveredOrders > 0 ? Math.round((onTimeOrders / deliveredOrders) * 100) : 0;

      // Return stats
      const returnRequests = returns.length;
      const approvedReturns = returns.filter((r: any) => r.status === 'approved').length;
      const rejectedReturns = returns.filter((r: any) => r.status === 'rejected').length;

      setStats({
        totalOrders,
        shippedOrders,
        deliveredOrders,
        overdueOrders,
        averageDeliveryTime,
        onTimePercentage,
        returnRequests,
        approvedReturns,
        rejectedReturns,
      });

      // Calculate order statuses
      const statusCounts: Record<string, number> = {};
      orders.forEach((o: any) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      const statuses = Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          count: count as number,
          percentage: Math.round(((count as number) / totalOrders) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setOrderStatuses(statuses);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700',
      processing: 'bg-blue-50 text-blue-700',
      shipped: 'bg-purple-50 text-purple-700',
      delivered: 'bg-green-50 text-green-700',
      cancelled: 'bg-red-50 text-red-700',
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push(`/${locale}/admin/dashboard`)}
              className="p-2 hover:bg-nubia-gold/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-nubia-gold" />
            </button>
            <div>
              <h1 className="font-playfair text-4xl font-bold text-nubia-black">
                Statistiques de Livraison
              </h1>
              <p className="text-nubia-black/60 mt-1">
                Analyse des performances de livraison et des retours
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">Chargement des statistiques...</p>
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Orders */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-blue-700">
                      Commandes totales
                    </h3>
                    <TrendingUp size={24} className="text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats.totalOrders}
                  </p>
                </div>

                {/* Shipped Orders */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-purple-700">
                      Expédiées
                    </h3>
                    <Clock size={24} className="text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {stats.shippedOrders}
                  </p>
                </div>

                {/* Delivered Orders */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-green-700">
                      Livrées
                    </h3>
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.deliveredOrders}
                  </p>
                </div>

                {/* Overdue Orders */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-red-700">
                      En retard
                    </h3>
                    <AlertCircle size={24} className="text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-900">
                    {stats.overdueOrders}
                  </p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Average Delivery Time */}
                <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6">
                  <h3 className="font-semibold text-nubia-black mb-4">
                    Temps moyen de livraison
                  </h3>
                  <p className="text-4xl font-bold text-nubia-gold mb-2">
                    {stats.averageDeliveryTime}
                  </p>
                  <p className="text-nubia-black/60">jours</p>
                </div>

                {/* On-Time Percentage */}
                <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6">
                  <h3 className="font-semibold text-nubia-black mb-4">
                    Taux de livraison à temps
                  </h3>
                  <p className="text-4xl font-bold text-nubia-gold mb-2">
                    {stats.onTimePercentage}%
                  </p>
                  <div className="w-full bg-nubia-gold/10 rounded-full h-2">
                    <div
                      className="bg-nubia-gold h-2 rounded-full"
                      style={{ width: `${stats.onTimePercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Order Status Distribution */}
              <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6">
                <h3 className="font-semibold text-nubia-black mb-6">
                  Distribution des statuts
                </h3>
                <div className="space-y-4">
                  {orderStatuses.map((status) => (
                    <div key={status.status}>
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            status.status
                          )}`}
                        >
                          {getStatusLabel(status.status)}
                        </span>
                        <span className="text-nubia-black/60">
                          {status.count} ({status.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-nubia-gold/10 rounded-full h-2">
                        <div
                          className="bg-nubia-gold h-2 rounded-full"
                          style={{ width: `${status.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Returns Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Returns */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-orange-700 mb-4">
                    Demandes de retour
                  </h3>
                  <p className="text-3xl font-bold text-orange-900">
                    {stats.returnRequests}
                  </p>
                </div>

                {/* Approved Returns */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-green-700 mb-4">
                    Retours approuvés
                  </h3>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.approvedReturns}
                  </p>
                </div>

                {/* Rejected Returns */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-red-700 mb-4">
                    Retours rejetés
                  </h3>
                  <p className="text-3xl font-bold text-red-900">
                    {stats.rejectedReturns}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
