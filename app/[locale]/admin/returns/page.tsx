'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Return {
  id: string;
  order_id: string;
  order_number: string;
  user_id: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  hours_since_delivery: number | null;
  is_returnable: boolean;
}

export default function AdminReturnsPage() {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    loadReturns();
  }, [locale, router]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error(t('admin.auth.no_token', 'Session admin introuvable'));
      }

      const response = await fetch('/api/admin/returns/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('admin.returns.load_error', 'Impossible de charger les retours'));
      }

      const data = await response.json();
      setReturns(data.returns || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading returns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) {
        throw new Error(t('admin.returns.approve_error', 'Impossible d approuver le retour'));
      }

      await loadReturns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (returnId: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        throw new Error(t('admin.returns.reject_error', 'Impossible de rejeter le retour'));
      }

      await loadReturns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('admin.returns.status.pending', 'En attente'),
      approved: t('admin.returns.status.approved', 'Approuve'),
      rejected: t('admin.returns.status.rejected', 'Rejete'),
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-yellow-600" />;
    }
  };

  const filteredReturns = returns.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

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
                {t('admin.returns.title', 'Gestion des Retours')}
              </h1>
              <p className="text-nubia-black/60 mt-1">
                {t('admin.returns.subtitle', 'Retours dans les 72h apres livraison')}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filter === status
                    ? 'bg-nubia-gold text-nubia-black'
                    : 'bg-nubia-gold/10 text-nubia-black hover:bg-nubia-gold/20'
                }`}
              >
                {status === 'all'
                  ? t('admin.returns.filter_all', 'Tous')
                  : status === 'pending'
                  ? t('admin.returns.filter_pending', 'En attente')
                  : status === 'approved'
                  ? t('admin.returns.filter_approved', 'Approuves')
                  : t('admin.returns.filter_rejected', 'Rejetes')}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">{t('admin.returns.loading', 'Chargement des retours...')}</p>
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-12 bg-nubia-gold/5 rounded-lg border-2 border-nubia-gold/20">
              <RotateCcw size={48} className="mx-auto text-nubia-gold/40 mb-4" />
              <p className="text-nubia-black/70">{t('admin.returns.empty', 'Aucun retour trouve')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((ret) => (
                <div
                  key={ret.id}
                  className="bg-white border-2 border-nubia-gold/20 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(ret.status)}
                        <div>
                          <p className="font-semibold text-nubia-black">
                            {ret.order_number}
                          </p>
                          <p className="text-sm text-nubia-black/60">
                            {t('admin.returns.requested_on', 'Demande le')}{' '}
                            {new Date(ret.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-nubia-black/60 mb-1">
                            {t('admin.returns.reason', 'Raison du retour')}
                          </p>
                          <p className="text-nubia-black">{ret.reason}</p>
                        </div>

                        {ret.delivered_at && (
                          <div>
                            <p className="text-sm text-nubia-black/60 mb-1">
                              {t('admin.returns.delivered_on', 'Livre le')}
                            </p>
                            <p className="text-nubia-black">
                              {new Date(ret.delivered_at).toLocaleDateString(
                                'fr-FR'
                              )}
                            </p>
                          </div>
                        )}

                        {ret.hours_since_delivery !== null && (
                          <div>
                            <p className="text-sm text-nubia-black/60 mb-1">
                              {t('admin.returns.elapsed_since_delivery', 'Temps ecoule depuis la livraison')}
                            </p>
                            <p className="text-nubia-black">
                              {Math.floor(ret.hours_since_delivery / 24)}j{' '}
                              {ret.hours_since_delivery % 24}h
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-nubia-black/60 mb-1">
                            {t('admin.returns.status_label', 'Statut')}
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                              ret.status
                            )}`}
                          >
                            {getStatusLabel(ret.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {ret.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(ret.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
                        >
                          {t('admin.returns.approve', 'Approuver')}
                        </button>
                        <button
                          onClick={() => handleReject(ret.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold whitespace-nowrap"
                        >
                          {t('admin.returns.reject', 'Rejeter')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
