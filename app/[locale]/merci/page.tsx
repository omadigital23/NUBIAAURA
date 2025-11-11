"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader, CheckCircle, Package, Truck, Clock } from 'lucide-react';

interface OrderDetails {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  shipping_address: any;
  shipping_method: string;
  created_at: string;
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('orderId');
    console.log('[ThankYou] Page mounted, orderId from searchParams:', id, 'locale:', locale);
    setOrderId(id);
    
    // Récupérer les détails de la commande
    if (id) {
      fetchOrderDetails(id);
    } else {
      setLoading(false);
    }
  }, [searchParams, locale]);
  
  const fetchOrderDetails = async (id: string) => {
    try {
      console.log('[ThankYou] Fetching order details for:', id);
      const response = await fetch(`/api/orders/${id}`);
      console.log('[ThankYou] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ThankYou] Order data received:', data);
        setOrderDetails(data.order);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ThankYou] Error response:', errorData);
        setError('Unable to load order details');
      }
    } catch (err) {
      console.error('[ThankYou] Exception fetching order:', err);
      setError('Unable to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="flex-1 py-20 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={48} />
          <p className="text-nubia-black/70">{t('common.loading', 'Chargement...')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-4">
            {t('merci.title', 'Merci pour votre commande !')}
          </h1>
          <p className="text-nubia-black/70 text-lg">
            {t('merci.subtitle', 'Nous vous avons envoyé un e-mail de confirmation avec les détails de votre commande.')}
          </p>
        </div>

        {/* Order ID Display (always show) */}
        {orderId && (
          <div className="bg-nubia-gold/10 rounded-lg p-6 mb-8 text-center">
            <p className="text-sm text-nubia-black/60 mb-2">{t('merci.order_number', 'Numéro de commande')}</p>
            <p className="font-mono text-lg font-semibold text-nubia-black">{orderId}</p>
          </div>
        )}

        {/* Order Details */}
        {orderDetails && (
          <div className="bg-white border-2 border-nubia-gold/20 rounded-lg p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
                  {t('merci.order_details', 'Détails de la commande')}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Package className="text-nubia-gold mt-1" size={20} />
                    <div>
                      <p className="text-sm text-nubia-black/60">{t('merci.order_number', 'Numéro de commande')}</p>
                      <p className="font-semibold text-nubia-black">{orderDetails.order_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Truck className="text-nubia-gold mt-1" size={20} />
                    <div>
                      <p className="text-sm text-nubia-black/60">{t('merci.shipping_method', 'Méthode de livraison')}</p>
                      <p className="font-semibold text-nubia-black">
                        {orderDetails.shipping_method === 'standard' 
                          ? t('checkout.shipping.standard', 'Livraison Standard')
                          : t('checkout.shipping.express', 'Livraison Express')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="text-nubia-gold mt-1" size={20} />
                    <div>
                      <p className="text-sm text-nubia-black/60">{t('merci.order_date', 'Date de commande')}</p>
                      <p className="font-semibold text-nubia-black">
                        {new Date(orderDetails.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
                  {t('merci.delivery_address', 'Adresse de livraison')}
                </h2>
                
                <div className="bg-nubia-gold/5 rounded-lg p-4">
                  <p className="font-semibold text-nubia-black mb-2">
                    {orderDetails.shipping_address?.firstName} {orderDetails.shipping_address?.lastName}
                  </p>
                  <p className="text-nubia-black/70 mb-1">{orderDetails.shipping_address?.address}</p>
                  <p className="text-nubia-black/70 mb-1">
                    {orderDetails.shipping_address?.zipCode && `${orderDetails.shipping_address.zipCode} `}
                    {orderDetails.shipping_address?.city}
                  </p>
                  <p className="text-nubia-black/70 mb-3">{orderDetails.shipping_address?.country}</p>
                  <p className="text-nubia-black/70">{orderDetails.shipping_address?.phone}</p>
                  <p className="text-nubia-black/70">{orderDetails.shipping_address?.email}</p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-nubia-gold/20 mt-8 pt-6">
              <div className="flex justify-between items-center">
                <span className="font-playfair text-2xl font-bold text-nubia-black">
                  {t('checkout.order_summary', 'Total')}
                </span>
                <span className="font-playfair text-3xl font-bold text-nubia-gold">
                  {orderDetails.total.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No Order ID */}
        {!orderId && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8 text-center">
            <p className="text-yellow-800">
              {t('merci.no_order_id', 'Aucun numéro de commande fourni.')}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push(`/${locale}/catalogue`)}
            className="px-8 py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-all"
          >
            {t('merci.back_to_catalog', 'Retour au Catalogue')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/commandes`)}
            className="px-8 py-4 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all"
          >
            {t('merci.view_orders', 'Voir mes commandes')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-nubia-gold" size={40} />
        </div>
      }>
        <ThankYouContent />
      </Suspense>
      <Footer />
    </div>
  );
}
