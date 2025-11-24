'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, Loader, AlertCircle, Truck, Package, MapPin } from 'lucide-react';

interface OrderDetail {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  shipping_method: string;
  delivery_duration_days: number;
  estimated_delivery_date: string | null;
  return_deadline: string | null;
  delivered_at: string | null;
  tracking_number: string;
  created_at: string;
  shipping_address: any;
  order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    products?: {
      name: string;
      image_url: string;
    };
  }>;
}

export default function OrderDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/orders/${orderId}`);
    }
  }, [isLoading, isAuthenticated, router, locale, orderId]);

  useEffect(() => {
    if (isAuthenticated && user && orderId) {
      fetchOrder();
    }
  }, [isAuthenticated, user, orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sb-auth-token');
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/orders/detail/${orderId}`, {
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Commande non trouvée');
        } else {
          setError('Erreur lors du chargement de la commande');
        }
        return;
      }

      const data = await response.json();
      setOrder(data.order);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      paid: 'Payée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      shipped: 'bg-purple-50 text-purple-700 border-purple-200',
      delivered: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      paid: 'bg-green-50 text-green-700 border-green-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <section className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={40} />
            <p className="text-nubia-black/70">{t('common.loading', 'Chargement...')}</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <section className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={40} />
            <p className="text-red-700 mb-6">{error || t('orders.not_found', 'Commande non trouvée')}</p>
            <Link
              href={`/${locale}/client/orders`}
              className="inline-block px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all"
            >
              Retour aux commandes
            </Link>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/${locale}/client/orders`}
              className="inline-flex items-center gap-2 text-nubia-gold hover:underline mb-4"
            >
              <ArrowLeft size={20} />
              Retour aux commandes
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-2">
                  {order.order_number}
                </h1>
                <p className="text-nubia-black/70">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`text-sm px-4 py-2 rounded-full border ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8 mb-8">
            <h2 className="font-semibold text-nubia-black mb-6">Suivi de la commande</h2>
            <div className="space-y-4">
              {order.status === 'pending' && (
                <div className="flex gap-4">
                  <Package className="text-yellow-600 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-semibold text-nubia-black">En attente de traitement</p>
                    <p className="text-sm text-nubia-black/70">
                      Votre commande est en cours de préparation
                    </p>
                  </div>
                </div>
              )}
              {order.status === 'processing' && (
                <>
                  <div className="flex gap-4">
                    <Package className="text-blue-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-nubia-black">En traitement</p>
                      <p className="text-sm text-nubia-black/70">
                        Votre commande est en cours de préparation
                      </p>
                    </div>
                  </div>
                  {order.estimated_delivery_date && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900">
                        📦 Livraison estimée dans {order.delivery_duration_days} jour{order.delivery_duration_days > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Date prévue : {new Date(order.estimated_delivery_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}
              {['shipped', 'delivered'].includes(order.status) && (
                <>
                  <div className="flex gap-4">
                    <Truck className="text-purple-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-nubia-black">Expédiée</p>
                      {order.tracking_number && (
                        <p className="text-sm text-nubia-black/70">
                          Numéro de suivi: {order.tracking_number}
                        </p>
                      )}
                      {order.estimated_delivery_date && (
                        <p className="text-sm text-nubia-black/70">
                          Livraison estimée:{' '}
                          {new Date(order.estimated_delivery_date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
              {order.status === 'delivered' && (
                <>
                  <div className="flex gap-4">
                    <Package className="text-green-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-nubia-black">Livrée</p>
                      <p className="text-sm text-nubia-black/70">
                        Votre commande a été livrée avec succès
                      </p>
                    </div>
                  </div>
                  {order.return_deadline && (
                    <div className={`mt-4 p-4 rounded-lg border ${new Date(order.return_deadline) > new Date()
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                      }`}>
                      <p className={`text-sm font-semibold ${new Date(order.return_deadline) > new Date()
                          ? 'text-green-900'
                          : 'text-red-900'
                        }`}>
                        🔄 Retour possible jusqu'au
                      </p>
                      <p className={`text-sm mt-1 ${new Date(order.return_deadline) > new Date()
                          ? 'text-green-700'
                          : 'text-red-700'
                        }`}>
                        {new Date(order.return_deadline).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {new Date(order.return_deadline) > new Date() ? (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          ✅ Vous pouvez encore demander un retour
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                          ❌ Délai de retour expiré
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8 mb-8">
            <h2 className="font-semibold text-nubia-black mb-6">Articles commandés</h2>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center pb-4 border-b border-nubia-gold/10 last:border-0">
                  <div className="flex-1">
                    <p className="font-semibold text-nubia-black">
                      {item.products?.name || 'Produit'}
                    </p>
                    <p className="text-sm text-nubia-black/70">
                      Quantité: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-nubia-gold">
                    {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8">
              <h2 className="font-semibold text-nubia-black mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-nubia-gold" />
                Adresse de livraison
              </h2>
              <div className="space-y-2 text-nubia-black/70">
                <p>{order.shipping_address?.firstName} {order.shipping_address?.lastName}</p>
                <p>{order.shipping_address?.address}</p>
                <p>
                  {order.shipping_address?.zipCode} {order.shipping_address?.city}
                </p>
                <p>{order.shipping_address?.country}</p>
              </div>
            </div>

            <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8">
              <h2 className="font-semibold text-nubia-black mb-4">Résumé</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-nubia-black/70">
                  <span>Sous-total</span>
                  <span>{order.total.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-nubia-black/70">
                  <span>Livraison</span>
                  <span>
                    {order.shipping_method === 'express' ? 'Express (15 000 FCFA)' : 'Standard (Gratuit)'}
                  </span>
                </div>
                <div className="pt-3 border-t border-nubia-gold/20 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-nubia-gold text-lg">
                    {order.total.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href={`/${locale}/client/orders`}
              className="flex-1 py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all text-center"
            >
              Retour aux commandes
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
