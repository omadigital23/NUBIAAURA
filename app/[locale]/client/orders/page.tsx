'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertCircle, ArrowLeft, Package } from 'lucide-react';

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_method: string;
  address: any;
  delivered_at?: string | null;
  shipped_at?: string | null;
}

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/orders`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const token = localStorage.getItem('sb-auth-token');
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      console.log('[OrdersPage] Using token from localStorage:', !!token);
      const response = await fetch('/api/orders/list', {
        method: 'GET',
        headers,
        // ensure cookies are sent and no cached responses are used
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des commandes');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      paid: 'Payée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href={`/${locale}/client/dashboard`}
              className="p-2 hover:bg-nubia-gold/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-nubia-gold" size={24} />
            </Link>
            <div>
              <h1 className="font-playfair text-4xl font-bold text-nubia-black">
                {t('nav.my_orders', 'Mes commandes')}
              </h1>
              <p className="text-nubia-black/70">
                Historique de vos achats
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {ordersLoading ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">{t('common.loading', 'Chargement...')}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto mb-4 text-nubia-gold/30" size={48} />
              <p className="text-nubia-black/70 mb-6">Vous n'avez pas encore de commandes</p>
              <Link
                href={`/${locale}/catalogue`}
                className="inline-block px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all"
              >
                Découvrir le catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg hover:border-nubia-gold transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-playfair font-bold text-nubia-black">
                          Commande #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-nubia-black/70 mb-2">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {order.delivered_at && (
                        <p className="text-sm text-green-600 font-medium mb-2">
                          Livrée le {new Date(order.delivered_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                      {!order.delivered_at && order.shipped_at && (
                        <p className="text-sm text-purple-600 font-medium mb-2">
                          Expédiée le {new Date(order.shipped_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                      <p className="text-sm text-nubia-black/70">
                        Livraison: {order.shipping_method === 'standard' ? 'Standard' : 'Express'}
                      </p>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <p className="text-sm text-nubia-black/70 mb-1">Total</p>
                      <p className="font-playfair text-2xl font-bold text-nubia-gold">
                        {Number(order.total).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                      </p>
                    </div>

                    {/* Action */}
                    <Link
                      href={`/${locale}/client/orders/${order.id}`}
                      className="px-6 py-2 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-colors text-center"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
