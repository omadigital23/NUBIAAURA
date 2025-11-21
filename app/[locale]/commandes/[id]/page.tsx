"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter, useParams } from 'next/navigation';
import { Package, Calendar, CreditCard, Truck, MapPin, ArrowLeft, Loader } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  shipping_address: any;
  shipping_method: string;
  created_at: string;
  delivered_at?: string | null;
  shipped_at?: string | null;
  estimated_delivery_date?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
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

export default function OrderDetailPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
    }
  }, [params.id]);

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        setError('Commande non trouvée');
      }
    } catch (err) {
      setError('Erreur lors du chargement de la commande');
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <section className="flex-1 py-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Commande non trouvée'}</p>
            <button
              onClick={() => router.push(`/${locale}/commandes`)}
              className="px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all"
            >
              {t('orders.back_to_list', 'Retour à mes commandes')}
            </button>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push(`/${locale}/commandes`)}
              className="flex items-center gap-2 text-nubia-black/70 hover:text-nubia-black mb-4"
            >
              <ArrowLeft size={20} />
              {t('orders.back_to_list', 'Retour à mes commandes')}
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-2 sm:mb-0">
                {t('orders.detail.title', 'Détails de la commande')} #{order.order_number}
              </h1>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>

          {/* Order Status Stepper */}
          <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6 mb-6 overflow-hidden">
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 hidden sm:block" />

              {/* Progress Bar Active */}
              <div
                className="absolute top-1/2 left-0 h-1 bg-nubia-gold -translate-y-1/2 transition-all duration-500 hidden sm:block"
                style={{
                  width: order.status === 'delivered' ? '100%' :
                    order.status === 'shipped' ? '75%' :
                      order.status === 'processing' ? '50%' :
                        '25%'
                }}
              />

              <div className="flex flex-col sm:flex-row justify-between relative z-10 gap-6 sm:gap-0">
                {['pending', 'processing', 'shipped', 'delivered'].map((step, index) => {
                  const steps = ['pending', 'processing', 'shipped', 'delivered'];
                  const currentStepIndex = steps.indexOf(order.status);
                  const stepIndex = steps.indexOf(step);
                  const isCompleted = stepIndex <= currentStepIndex;
                  const isCurrent = stepIndex === currentStepIndex;

                  return (
                    <div key={step} className="flex items-center sm:flex-col sm:justify-center gap-4 sm:gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted
                            ? 'bg-nubia-gold border-nubia-gold text-nubia-black'
                            : 'bg-white border-gray-300 text-gray-300'
                          }`}
                      >
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex flex-col sm:items-center">
                        <span className={`text-sm font-bold ${isCompleted ? 'text-nubia-black' : 'text-gray-400'}`}>
                          {getStatusText(step)}
                        </span>
                        {isCurrent && (
                          <span className="text-xs text-nubia-gold font-medium animate-pulse">
                            {t('common.in_progress', 'En cours')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Calendar className="text-nubia-gold mt-1" size={20} />
                <div>
                  <p className="text-sm text-nubia-black/60">{t('orders.date', 'Date')}</p>
                  <p className="font-semibold text-nubia-black">
                    {new Date(order.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>



              <div className="flex items-start gap-3">
                <Truck className="text-nubia-gold mt-1" size={20} />
                <div>
                  <p className="text-sm text-nubia-black/60">{t('orders.shipping', 'Livraison')}</p>
                  <p className="font-semibold text-nubia-black">
                    {order.shipping_method === 'standard'
                      ? t('checkout.shipping.standard', 'Livraison Standard')
                      : t('checkout.shipping.express', 'Livraison Express')}
                  </p>

                  {/* Tracking Info */}
                  {order.tracking_number && (
                    <div className="mt-2 p-2 bg-nubia-gold/10 rounded text-sm">
                      <p className="font-medium text-nubia-black">
                        {t('orders.tracking', 'Suivi')}: <span className="font-mono">{order.tracking_number}</span>
                      </p>
                      {order.carrier && (
                        <p className="text-nubia-black/70 text-xs">
                          {t('orders.carrier', 'Transporteur')}: {order.carrier}
                        </p>
                      )}
                    </div>
                  )}

                  {order.estimated_delivery_date && !order.delivered_at && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      {t('orders.estimated', 'Estimée le')} {new Date(order.estimated_delivery_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}

                  {order.delivered_at && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      {t('orders.delivered_on', 'Livrée le')} {new Date(order.delivered_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                  {!order.delivered_at && order.shipped_at && (
                    <p className="text-sm text-purple-600 font-medium mt-1">
                      {t('orders.shipped_on', 'Expédiée le')} {new Date(order.shipped_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="text-nubia-gold mt-1" size={20} />
                <div>
                  <p className="text-sm text-nubia-black/60">{t('orders.payment', 'Paiement')}</p>
                  <p className="font-semibold text-nubia-black">
                    {order.payment_status === 'paid'
                      ? t('orders.paid', 'Payée')
                      : t('orders.pending', 'En attente')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Shipping Address */}
            <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6">
              <h2 className="font-playfair text-xl font-bold text-nubia-black mb-4 flex items-center gap-2">
                <MapPin className="text-nubia-gold" size={20} />
                {t('orders.shipping_address', 'Adresse de livraison')}
              </h2>

              <div className="bg-nubia-gold/5 rounded-lg p-4">
                <p className="font-semibold text-nubia-black mb-2">
                  {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                </p>
                <p className="text-nubia-black/70 mb-1">{order.shipping_address?.address}</p>
                <p className="text-nubia-black/70 mb-1">
                  {order.shipping_address?.zipCode && `${order.shipping_address.zipCode} `}
                  {order.shipping_address?.city}
                </p>
                <p className="text-nubia-black/70 mb-3">{order.shipping_address?.country}</p>
                <p className="text-nubia-black/70">{order.shipping_address?.phone}</p>
                <p className="text-nubia-black/70">{order.shipping_address?.email}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6">
              <h2 className="font-playfair text-xl font-bold text-nubia-black mb-4 flex items-center gap-2">
                <Package className="text-nubia-gold" size={20} />
                {t('orders.summary', 'Résumé')}
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between text-nubia-black/70">
                  <span>{order.order_items?.length || 0} articles</span>
                  <span>{order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-nubia-black/70">
                  <span>{t('orders.shipping', 'Livraison')}</span>
                  <span>Calculé au checkout</span>
                </div>
                <div className="border-t border-nubia-gold/20 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-playfair text-xl font-bold text-nubia-black">
                      {t('orders.total', 'Total')}
                    </span>
                    <span className="font-playfair text-2xl font-bold text-nubia-gold">
                      {order.total.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6">
            <h2 className="font-playfair text-xl font-bold text-nubia-black mb-6">
              {t('orders.items', 'Articles commandés')}
            </h2>

            <div className="space-y-4">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-nubia-cream/30 rounded-lg border border-nubia-gold/20">
                  {/* Item Image */}
                  {item.products?.image_url && (
                    <div className="w-20 h-20 flex-shrink-0 bg-nubia-gold/10 rounded-lg overflow-hidden">
                      <img
                        src={item.products.image_url}
                        alt={item.products?.name || 'Produit'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="flex-1">
                    <h3 className="font-playfair font-bold text-nubia-black mb-2">
                      {item.products?.name || 'Produit'}
                    </h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-nubia-black/70 text-sm">
                          {t('cart.quantity', 'Quantité')}: {item.quantity}
                        </p>
                        <p className="text-nubia-gold font-semibold">
                          {Number(item.price).toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                      <p className="font-bold text-nubia-black">
                        {Number(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => router.push(`/${locale}/catalogue`)}
              className="px-6 py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all"
            >
              {t('orders.continue_shopping', 'Continuer mes achats')}
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all"
            >
              {t('orders.print', 'Imprimer la commande')}
            </button>
          </div>
        </div >
      </section >

      <Footer />
    </div >
  );
}
