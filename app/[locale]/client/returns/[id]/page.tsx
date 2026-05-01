'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Loader, Package, RotateCcw, XCircle } from 'lucide-react';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'shipped' | 'received' | 'refunded';

interface ReturnItem {
  product_id?: string;
  quantity?: number;
  reason?: string;
}

interface ReturnRequest {
  id: string;
  return_number: string;
  order_id: string;
  reason: string;
  comments?: string;
  status: ReturnStatus;
  created_at: string;
  updated_at: string;
  items?: ReturnItem[];
}

type StatusConfig = {
  icon: LucideIcon;
  className: string;
};

const statusConfig: Record<ReturnStatus, StatusConfig> = {
  pending: {
    icon: Clock,
    className: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  },
  approved: {
    icon: CheckCircle,
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  rejected: {
    icon: XCircle,
    className: 'bg-red-50 text-red-800 border-red-200',
  },
  shipped: {
    icon: Package,
    className: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  received: {
    icon: CheckCircle,
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  refunded: {
    icon: CheckCircle,
    className: 'bg-green-50 text-green-800 border-green-200',
  },
};

export default function ClientReturnDetailsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const returnId = params.id as string;
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/returns/${returnId}`);
    }
  }, [isLoading, isAuthenticated, router, locale, returnId]);

  const fetchReturnDetails = useCallback(async () => {
    if (!isAuthenticated || !user || !returnId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/returns/${returnId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();

      if (response.status === 401) {
        router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/returns/${returnId}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || t('returns.errors.load_detail'));
      }

      setReturnRequest(data.return);
      setError(null);
    } catch (err: any) {
      setError(err.message || t('returns.errors.load_detail'));
      setReturnRequest(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, returnId, router, locale, t]);

  useEffect(() => {
    fetchReturnDetails();
  }, [fetchReturnDetails]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusBadge = (status: ReturnStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}>
        <Icon className="h-4 w-4" />
        {t(`returns.status.${status}`)}
      </span>
    );
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-nubia-gold" size={40} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (error || !returnRequest) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={40} />
            <p className="mb-6 text-red-700">{error || t('returns.not_found')}</p>
            <Link
              href={`/${locale}/client/returns`}
              className="inline-flex items-center justify-center rounded-lg border-2 border-nubia-gold bg-nubia-gold px-6 py-3 font-semibold text-nubia-black transition-all hover:bg-nubia-white"
            >
              {t('returns.back_to_returns')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/client/returns`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-nubia-gold transition-colors hover:text-nubia-black"
          >
            <ArrowLeft size={18} />
            {t('returns.back_to_returns')}
          </Link>

          <div className="mb-8 rounded-lg border border-nubia-gold/20 bg-nubia-cream/30 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-nubia-gold">
                  {t('returns.detail_eyebrow')}
                </p>
                <h1 className="font-playfair text-4xl font-bold text-nubia-black">
                  {returnRequest.return_number}
                </h1>
                <p className="mt-2 text-nubia-black/70">
                  {t('returns.order_label')} {returnRequest.order_id}
                </p>
              </div>
              {getStatusBadge(returnRequest.status)}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <section className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-6 sm:p-8">
              <h2 className="font-playfair text-2xl font-bold text-nubia-black">
                {t('returns.details.title')}
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-nubia-black/60">{t('returns.reason')}</p>
                  <p className="mt-1 text-nubia-black">{returnRequest.reason}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-nubia-black/60">{t('returns.created_at')}</p>
                  <p className="mt-1 text-nubia-black">{formatDate(returnRequest.created_at)}</p>
                </div>
                {returnRequest.comments && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-semibold text-nubia-black/60">{t('returns.comments')}</p>
                    <p className="mt-1 text-nubia-black">{returnRequest.comments}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-nubia-gold/10 pt-6">
                <h3 className="font-semibold text-nubia-black">{t('returns.items.title')}</h3>
                <div className="mt-4 space-y-3">
                  {(returnRequest.items || []).map((item, index) => (
                    <div
                      key={`${item.product_id || index}-${index}`}
                      className="rounded-lg border border-nubia-gold/10 bg-nubia-cream/20 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-nubia-black">
                            {item.product_id ? `${t('returns.items.product_id')} ${item.product_id}` : t('returns.items.product')}
                          </p>
                          {item.reason && (
                            <p className="mt-1 text-sm text-nubia-black/70">
                              {t('returns.reason')} {item.reason}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-nubia-black/70">
                          {t('cart.quantity')}: {item.quantity || 1}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!returnRequest.items || returnRequest.items.length === 0) && (
                    <p className="text-sm text-nubia-black/60">{t('returns.items.empty')}</p>
                  )}
                </div>
              </div>
            </section>

            <aside className="rounded-lg border border-nubia-gold/20 bg-nubia-cream/30 p-6 sm:p-8">
              <h2 className="font-playfair text-2xl font-bold text-nubia-black">
                {t('returns.timeline.title')}
              </h2>
              <div className="mt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="h-3 w-3 rounded-full bg-nubia-gold" />
                    <span className="mt-2 h-12 w-px bg-nubia-gold/20" />
                  </div>
                  <div>
                    <p className="font-semibold text-nubia-black">{t('returns.timeline.created')}</p>
                    <p className="text-sm text-nubia-black/60">{formatDate(returnRequest.created_at)}</p>
                  </div>
                </div>
                {returnRequest.status !== 'pending' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="h-3 w-3 rounded-full bg-nubia-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-nubia-black">
                        {returnRequest.status === 'rejected' ? t('returns.timeline.rejected') : t('returns.timeline.updated')}
                      </p>
                      <p className="text-sm text-nubia-black/60">{formatDate(returnRequest.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-lg border border-nubia-gold/20 bg-nubia-white p-4">
                <div className="flex gap-3">
                  <RotateCcw className="mt-1 h-5 w-5 flex-shrink-0 text-nubia-gold" />
                  <p className="text-sm text-nubia-black/70">
                    {t('returns.help_text')}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
