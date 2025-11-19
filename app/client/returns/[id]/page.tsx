'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader, ArrowLeft, CheckCircle, Clock, XCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

interface Return {
  id: string;
  return_number: string;
  order_id: string;
  reason: string;
  comments?: string;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'received' | 'refunded';
  created_at: string;
  updated_at: string;
  items: any[];
  order?: any;
}

export default function ReturnDetailsPage() {
  const params = useParams();
  const { t } = useTranslation();
  const [returnRequest, setReturnRequest] = useState<Return | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReturnDetails();
  }, [params.id]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/returns/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors du chargement');
        return;
      }

      setReturnRequest(data.return);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement du retour');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      shipped: Package,
      received: CheckCircle,
      refunded: CheckCircle,
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600',
      approved: 'text-blue-600',
      rejected: 'text-red-600',
      shipped: 'text-purple-600',
      received: 'text-blue-600',
      refunded: 'text-green-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      shipped: 'Expédié',
      received: 'Reçu',
      refunded: 'Remboursé',
    };
    return labels[status] || status;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-gold-600" />
      </div>
    );
  }

  if (error || !returnRequest) {
    return (
      <div className="space-y-6">
        <Link
          href="/client/returns"
          className="flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux retours
        </Link>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error || t('returns.not_found', 'Retour non trouvé')}</p>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(returnRequest.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link
        href="/client/returns"
        className="flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux retours
      </Link>

      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Status Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {returnRequest.return_number}
            </h1>
            <p className="text-gray-600">
              Commande: <span className="font-medium">{returnRequest.order_id}</span>
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(returnRequest.status)} bg-opacity-10`}>
            <StatusIcon className="w-5 h-5" />
            <span className="font-semibold">
              {getStatusLabel(returnRequest.status)}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Raison du retour</h3>
            <p className="text-lg text-gray-900">{returnRequest.reason}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Date de création</h3>
            <p className="text-lg text-gray-900">
              {formatDate(returnRequest.created_at)}
            </p>
          </div>

          {returnRequest.comments && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Commentaires</h3>
              <p className="text-gray-900">{returnRequest.comments}</p>
            </div>
          )}
        </div>

        {/* Items */}
        {returnRequest.items && returnRequest.items.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles à retourner</h3>
            <div className="space-y-2">
              {returnRequest.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Produit ID: {item.product_id}
                    </p>
                    {item.reason && (
                      <p className="text-sm text-gray-600">Raison: {item.reason}</p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">
                    Quantité: {item.quantity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-gold-600 rounded-full"></div>
                <div className="w-0.5 h-12 bg-gray-200"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Demande créée</p>
                <p className="text-sm text-gray-600">
                  {formatDate(returnRequest.created_at)}
                </p>
              </div>
            </div>

            {returnRequest.status !== 'pending' && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    returnRequest.status !== 'rejected' ? 'bg-gold-600' : 'bg-red-600'
                  }`}></div>
                  {returnRequest.status !== 'refunded' && (
                    <div className="w-0.5 h-12 bg-gray-200"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {returnRequest.status === 'rejected' ? 'Demande rejetée' : 'Demande approuvée'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(returnRequest.updated_at)}
                  </p>
                </div>
              </div>
            )}

            {returnRequest.status === 'refunded' && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Remboursement traité</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(returnRequest.updated_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900">
          <span className="font-semibold">Note:</span> Vous recevrez des mises à jour par email et WhatsApp à chaque changement de statut de votre retour.
        </p>
      </div>
    </div>
  );
}
