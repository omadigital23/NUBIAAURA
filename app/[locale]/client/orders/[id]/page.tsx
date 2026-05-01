'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReturnEligibilityBanner from '@/components/ReturnEligibilityBanner';
import ReturnRequestForm from '@/components/ReturnRequestForm';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft, AlertCircle, Loader, MapPin, Package, RotateCcw, Truck } from 'lucide-react';

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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
};

export default function OrderDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const formatDate = useCallback((date: string, withTime = false) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: withTime ? 'long' : undefined,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: withTime ? '2-digit' : undefined,
      minute: withTime ? '2-digit' : undefined,
    });
  }, [locale]);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/detail/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.status === 401) {
        router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/orders/${orderId}`);
        return;
      }

      if (!response.ok) {
        setError(response.status === 404 ? t('orders.not_found') : t('orders.error_loading'));
        return;
      }

      const data = await response.json();
      setOrder(data.order);
      setError('');
    } catch (err: any) {
      setError(err.message || t('orders.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [orderId, router, locale, t]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/orders/${orderId}`);
    }
  }, [isLoading, isAuthenticated, router, locale, orderId]);

  useEffect(() => {
    if (isAuthenticated && user && orderId) {
      fetchOrder();
    }
  }, [isAuthenticated, user, orderId, fetchOrder]);

  const orderItemsForReturn = useMemo(() => {
    return (order?.order_items || []).map((item) => ({
      product_id: item.product_id,
      product_name: item.products?.name || t('orders.items.product'),
      quantity: item.quantity,
    }));
  }, [order?.order_items, t]);

  const returnDeadlineIsOpen = Boolean(order?.return_deadline && new Date(order.return_deadline) > new Date());

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={40} />
            <p className="text-nubia-black/70">{t('common.loading')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={40} />
            <p className="text-red-700 mb-6">{error || t('orders.not_found')}</p>
            <Link
              href={`/${locale}/client/orders`}
              className="inline-flex items-center justify-center rounded-lg border-2 border-nubia-gold bg-nubia-gold px-6 py-3 font-semibold text-nubia-black transition-all hover:bg-nubia-white"
            >
              {t('orders.back_to_list')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusColor = statusColors[order.status] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href={`/${locale}/client/orders`}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-nubia-gold transition-colors hover:text-nubia-black"
            >
              <ArrowLeft size={18} />
              {t('orders.back_to_list')}
            </Link>

            <div className="rounded-lg border border-nubia-gold/20 bg-nubia-cream/30 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-nubia-gold">
                    {t('orders.detail.eyebrow')}
                  </p>
                  <h1 className="font-playfair text-4xl font-bold text-nubia-black">
                    {order.order_number}
                  </h1>
                  <p className="mt-2 text-nubia-black/70">
                    {formatDate(order.created_at, true)}
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${statusColor}`}>
                  {t(`orders.status.${order.status}`, order.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <ReturnEligibilityBanner
              orderId={order.id}
              onReturnClick={() => setShowReturnForm(true)}
            />
          </div>

          {showReturnForm && (
            <section className="mb-8 rounded-lg border border-nubia-gold/20 bg-nubia-white p-6 sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-playfair text-2xl font-bold text-nubia-black">
                    {t('returns.request.title')}
                  </h2>
                  <p className="mt-2 text-sm text-nubia-black/70">
                    {t('returns.request.subtitle')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReturnForm(false)}
                  className="text-sm font-semibold text-nubia-black/60 transition-colors hover:text-nubia-black"
                >
                  {t('common.cancel')}
                </button>
              </div>
              <ReturnRequestForm
                orderId={order.id}
                orderItems={orderItemsForReturn}
                onSuccess={() => router.push(`/${locale}/client/returns`)}
              />
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <section className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-6 sm:p-8">
              <h2 className="font-playfair text-2xl font-bold text-nubia-black">
                {t('orders.timeline.title')}
              </h2>
              <div className="mt-6 space-y-5">
                {order.status === 'pending' && (
                  <div className="flex gap-4">
                    <Package className="text-yellow-600 flex-shrink-0" size={24} />
                    <div>
                      <p className="font-semibold text-nubia-black">{t('orders.timeline.pending_title')}</p>
                      <p className="text-sm text-nubia-black/70">{t('orders.timeline.preparing_desc')}</p>
                    </div>
                  </div>
                )}

                {order.status === 'processing' && (
                  <div className="flex gap-4">
                    <Package className="text-blue-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-nubia-black">{t('orders.timeline.processing_title')}</p>
                      <p className="text-sm text-nubia-black/70">{t('orders.timeline.preparing_desc')}</p>
                      {order.estimated_delivery_date && (
                        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <p className="text-sm font-semibold text-blue-900">
                            {t('orders.timeline.estimated_in')} {order.delivery_duration_days} {t(order.delivery_duration_days > 1 ? 'common.days' : 'common.day')}
                          </p>
                          <p className="mt-1 text-sm text-blue-700">
                            {t('orders.timeline.expected_date')} {formatDate(order.estimated_delivery_date)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {['shipped', 'delivered'].includes(order.status) && (
                  <div className="flex gap-4">
                    <Truck className="text-purple-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-nubia-black">{t('orders.timeline.shipped_title')}</p>
                      {order.tracking_number && (
                        <p className="text-sm text-nubia-black/70">
                          {t('orders.tracking')}: {order.tracking_number}
                        </p>
                      )}
                      {order.estimated_delivery_date && (
                        <p className="text-sm text-nubia-black/70">
                          {t('orders.estimated')} {formatDate(order.estimated_delivery_date)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="flex gap-4">
                    <Package className="text-green-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-nubia-black">{t('orders.timeline.delivered_title')}</p>
                      <p className="text-sm text-nubia-black/70">{t('orders.timeline.delivered_desc')}</p>
                      {order.return_deadline && (
                        <div className={`mt-4 rounded-lg border p-4 ${returnDeadlineIsOpen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className={`text-sm font-semibold ${returnDeadlineIsOpen ? 'text-green-900' : 'text-red-900'}`}>
                            {t('orders.timeline.return_until')}
                          </p>
                          <p className={`mt-1 text-sm ${returnDeadlineIsOpen ? 'text-green-700' : 'text-red-700'}`}>
                            {formatDate(order.return_deadline)}
                          </p>
                          <p className={`mt-2 text-xs ${returnDeadlineIsOpen ? 'text-green-600' : 'text-red-600'}`}>
                            {returnDeadlineIsOpen ? t('orders.timeline.return_available') : t('orders.timeline.return_expired')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-6 sm:p-8">
                <h2 className="font-playfair text-2xl font-bold text-nubia-black">
                  {t('orders.summary')}
                </h2>
                <div className="mt-5 space-y-3">
                  <div className="flex justify-between text-nubia-black/70">
                    <span>{t('orders.subtotal')}</span>
                    <span>{order.total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-nubia-black/70">
                    <span>{t('orders.shipping')}</span>
                    <span>{order.shipping_method === 'express' ? t('checkout.shipping.express') : t('checkout.shipping.standard')}</span>
                  </div>
                  <div className="border-t border-nubia-gold/20 pt-3 flex justify-between font-bold">
                    <span>{t('orders.total')}</span>
                    <span className="text-lg text-nubia-gold">{order.total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-6 sm:p-8">
                <h2 className="font-playfair text-2xl font-bold text-nubia-black flex items-center gap-2">
                  <MapPin size={20} className="text-nubia-gold" />
                  {t('orders.shipping_address')}
                </h2>
                <div className="mt-5 space-y-2 text-nubia-black/70">
                  <p>{order.shipping_address?.firstName} {order.shipping_address?.lastName}</p>
                  <p>{order.shipping_address?.address}</p>
                  <p>{order.shipping_address?.zipCode} {order.shipping_address?.city}</p>
                  <p>{order.shipping_address?.country}</p>
                </div>
              </section>
            </aside>
          </div>

          <section className="mt-8 rounded-lg border border-nubia-gold/20 bg-nubia-white p-6 sm:p-8">
            <h2 className="font-playfair text-2xl font-bold text-nubia-black">
              {t('orders.items.title')}
            </h2>
            <div className="mt-6 space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 border-b border-nubia-gold/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold text-nubia-black">
                      {item.products?.name || t('orders.items.product')}
                    </p>
                    <p className="text-sm text-nubia-black/70">
                      {t('cart.quantity')}: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-nubia-gold">
                    {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href={`/${locale}/client/orders`}
              className="inline-flex items-center justify-center rounded-lg border-2 border-nubia-gold px-6 py-3 font-semibold text-nubia-black transition-all hover:bg-nubia-gold/10"
            >
              {t('orders.back_to_list')}
            </Link>
            <Link
              href={`/${locale}/client/returns`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-nubia-gold bg-nubia-gold px-6 py-3 font-semibold text-nubia-black transition-all hover:bg-nubia-white"
            >
              <RotateCcw size={18} />
              {t('returns.title')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
