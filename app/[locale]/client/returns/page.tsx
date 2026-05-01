'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Loader, Package, RotateCcw, XCircle } from 'lucide-react';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'shipped' | 'received' | 'refunded';
type ReturnFilter = 'all' | ReturnStatus;

interface ReturnRequest {
  id: string;
  return_number: string;
  order_id: string;
  reason: string;
  status: ReturnStatus;
  created_at: string;
  items?: unknown[];
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

const filters: ReturnFilter[] = ['all', 'pending', 'approved', 'rejected', 'refunded'];

export default function ClientReturnsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReturnFilter>('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/returns`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  const fetchReturns = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      const query = filter === 'all' ? 'limit=50' : `status=${filter}&limit=50`;
      const response = await fetch(`/api/returns?${query}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();

      if (response.status === 401) {
        router.push(`/${locale}/auth/login?callbackUrl=/${locale}/client/returns`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || t('returns.errors.load'));
      }

      setReturns(data.returns || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || t('returns.errors.load'));
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [filter, isAuthenticated, user, router, locale, t]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const stats = useMemo(() => {
    const active = returns.filter((request) => ['pending', 'approved', 'shipped', 'received'].includes(request.status)).length;
    const refunded = returns.filter((request) => request.status === 'refunded').length;
    return { active, refunded, total: returns.length };
  }, [returns]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (isLoading || (!isAuthenticated && !user)) {
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

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href={`/${locale}/client/dashboard`}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-nubia-gold transition-colors hover:text-nubia-black"
              >
                <ArrowLeft size={18} />
                {t('returns.back_to_account')}
              </Link>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-nubia-gold">
                {t('returns.eyebrow')}
              </p>
              <h1 className="font-playfair text-4xl font-bold text-nubia-black sm:text-5xl">
                {t('returns.title')}
              </h1>
              <p className="mt-3 max-w-2xl text-nubia-black/70">
                {t('returns.subtitle')}
              </p>
            </div>

            <Link
              href={`/${locale}/client/orders`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-nubia-gold bg-nubia-gold px-5 py-3 font-semibold text-nubia-black transition-all hover:bg-nubia-white"
            >
              <Package size={18} />
              {t('returns.view_orders')}
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: t('returns.stats.total'), value: stats.total },
              { label: t('returns.stats.active'), value: stats.active },
              { label: t('returns.stats.refunded'), value: stats.refunded },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-nubia-gold/20 bg-nubia-cream/30 p-5">
                <p className="text-sm font-medium text-nubia-black/60">{item.label}</p>
                <p className="mt-2 font-playfair text-3xl font-bold text-nubia-black">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {filters.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                  filter === option
                    ? 'border-nubia-gold bg-nubia-gold text-nubia-black'
                    : 'border-nubia-gold/30 bg-nubia-white text-nubia-black/70 hover:border-nubia-gold hover:text-nubia-black'
                }`}
              >
                {t(`returns.filters.${option}`)}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-nubia-gold/20 bg-nubia-cream/20 py-16">
              <Loader className="animate-spin text-nubia-gold" size={36} />
            </div>
          ) : returns.length === 0 ? (
            <div className="rounded-lg border border-nubia-gold/20 bg-nubia-cream/30 px-6 py-14 text-center">
              <RotateCcw className="mx-auto mb-4 text-nubia-gold/50" size={48} />
              <h2 className="font-playfair text-2xl font-bold text-nubia-black">
                {t('returns.empty.title')}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-nubia-black/70">
                {t('returns.empty.subtitle')}
              </p>
              <Link
                href={`/${locale}/client/orders`}
                className="mt-6 inline-flex items-center justify-center rounded-lg border-2 border-nubia-gold bg-nubia-gold px-6 py-3 font-semibold text-nubia-black transition-all hover:bg-nubia-white"
              >
                {t('returns.empty.cta')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {returns.map((returnRequest) => (
                <Link
                  key={returnRequest.id}
                  href={`/${locale}/client/returns/${returnRequest.id}`}
                  className="group block rounded-lg border border-nubia-gold/20 bg-nubia-white p-5 transition-all hover:-translate-y-0.5 hover:border-nubia-gold hover:shadow-gold"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-playfair text-xl font-bold text-nubia-black">
                          {returnRequest.return_number}
                        </h2>
                        {getStatusBadge(returnRequest.status)}
                      </div>
                      <p className="mt-2 text-sm text-nubia-black/60">
                        {t('returns.order_label')} {returnRequest.order_id}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-nubia-black/60">
                      {formatDate(returnRequest.created_at)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <p className="text-sm font-semibold text-nubia-black/60">
                        {t('returns.reason')}
                      </p>
                      <p className="mt-1 line-clamp-2 text-nubia-black">
                        {returnRequest.reason}
                      </p>
                    </div>
                    <div className="inline-flex items-center text-sm font-semibold text-nubia-gold transition-colors group-hover:text-nubia-black">
                      {t('returns.view_details')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
