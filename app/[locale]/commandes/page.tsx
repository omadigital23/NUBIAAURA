"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '@/hooks/useAuthToken';
import { Package, Calendar, CreditCard, Truck, Eye, ArrowLeft } from 'lucide-react';
import { Loader } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  shipping_method: string;
  created_at: string;
  delivered_at?: string | null;
  shipped_at?: string | null;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    name: string;
    image_url: string;
  };
}

export default function OrdersPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { token, isLoading: tokenLoading } = useAuthToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for token to be loaded
    if (tokenLoading) {
      console.log('[OrdersPage] Waiting for token to load...');
      return;
    }

    console.log('[OrdersPage] Token loading complete. Token:', token ? 'present' : 'missing');

    if (token) {
      console.log('[OrdersPage] Token available, fetching orders');
      fetchOrders();
    } else {
      console.log('[OrdersPage] No token available, redirecting to login');
      setLoading(false);
      router.push(`/${locale}/auth/login?callbackUrl=/${locale}/commandes`);
    }
  }, [token, tokenLoading, locale]);

  const fetchOrders = async () => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('[OrdersPage] Auth header set with token');
      } else {
        console.warn('[OrdersPage] No auth token available for fetch');
        setError(t('orders.error_loading', 'Impossible de charger vos commandes'));
        setLoading(false);
        return;
      }
      
      console.log('[OrdersPage] Fetching orders from /api/orders/list');
      const response = await fetch('/api/orders/list', {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies
      });
      
      console.log('[OrdersPage] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[OrdersPage] Orders received:', data.orders?.length || 0);
        setOrders(data.orders || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OrdersPage] API error:', response.status, errorData);
        setError(t('orders.error_loading', 'Impossible de charger vos commandes'));
      }
    } catch (err) {
      console.error('[OrdersPage] Fetch error:', err);
      setError(t('orders.error', 'Erreur lors du chargement des commandes'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'shipped':
        return 'text-purple-600 bg-purple-50';
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('orders.status.pending', 'En attente');
      case 'processing':
        return t('orders.status.processing', 'En traitement');
      case 'shipped':
        return t('orders.status.shipped', 'Expédiée');
      case 'delivered':
        return t('orders.status.delivered', 'Livrée');
      case 'cancelled':
        return t('orders.status.cancelled', 'Annulée');
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <section className="flex-1 py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={48} />
            <p className="text-nubia-black/70">{t('common.loading', 'Chargement...')}</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      
      <section className="flex-1 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-nubia-black/70 hover:text-nubia-black mb-4"
            >
              <ArrowLeft size={20} />
              {t('common.back', 'Retour')}
            </button>
            
            <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-4">
              {t('orders.title', 'Mes Commandes')}
            </h1>
            <p className="text-nubia-black/70 text-lg">
              {t('orders.subtitle', 'Consultez l\'historique de vos commandes et suivez leur statut')}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-nubia-cream/30 rounded-lg p-12 text-center">
              <Package className="text-nubia-gold mx-auto mb-4" size={48} />
              <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-4">
                {t('orders.empty.title', 'Aucune commande')}
              </h2>
              <p className="text-nubia-black/70 mb-6">
                {t('orders.empty.subtitle', 'Vous n\'avez pas encore passé de commande. Découvrez nos produits !')}
              </p>
              <button
                onClick={() => router.push(`/${locale}/catalogue`)}
                className="px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all"
              >
                {t('orders.empty.shop_now', 'Commencer mes achats')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="text-nubia-gold" size={20} />
                        <span className="font-mono text-sm text-nubia-black/60">
                          {t('orders.number', 'Commande')} #{order.order_number}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-nubia-black/60">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          {new Date(order.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        {order.delivered_at && (
                          <div className="flex items-center gap-1 text-green-600 font-medium">
                            <Truck size={16} />
                            {t('orders.delivered_on', 'Livrée le')} {new Date(order.delivered_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                        {!order.delivered_at && order.shipped_at && (
                          <div className="flex items-center gap-1 text-purple-600 font-medium">
                            <Truck size={16} />
                            {t('orders.shipped_on', 'Expédiée le')} {new Date(order.shipped_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CreditCard size={16} />
                          {order.payment_status === 'paid' 
                            ? t('orders.paid', 'Payée')
                            : t('orders.pending', 'En attente')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                      <div className="text-right">
                        <p className="text-sm text-nubia-black/60">{t('orders.total', 'Total')}</p>
                        <p className="font-playfair text-2xl font-bold text-nubia-gold">
                          {order.total.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          console.log('[OrdersPage] Navigating to order details:', order.id);
                          router.push(`/${locale}/commandes/${order.id}`);
                        }}
                        type="button"
                        className="px-6 py-2 border-2 border-nubia-gold text-nubia-black font-medium rounded-lg hover:bg-nubia-gold/10 active:bg-nubia-gold/20 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <Eye size={16} />
                        {t('orders.view_details', 'Voir détails')}
                      </button>
                    </div>
                  </div>

                  {/* Items Preview */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="border-t border-nubia-gold/20 pt-4">
                      <p className="text-sm text-nubia-black/60 mb-2">
                        {order.order_items.length} {order.order_items.length === 1 ? 'article' : 'articles'}
                      </p>
                      <div className="flex gap-2">
                        {order.order_items.slice(0, 3).map((item) => (
                          <div key={item.id} className="w-12 h-12 bg-nubia-gold/10 rounded border border-nubia-gold/20 overflow-hidden">
                            {item.products?.image_url && (
                              <img
                                src={item.products.image_url}
                                alt={item.products?.name || 'Produit'}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div className="w-12 h-12 bg-nubia-cream/50 rounded border border-nubia-gold/20 flex items-center justify-center">
                            <span className="text-xs text-nubia-black/60">+{order.order_items.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
