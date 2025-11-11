'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader, Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Return {
  id: string;
  return_number: string;
  order_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'received' | 'refunded';
  created_at: string;
  updated_at: string;
  items: any[];
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReturns();
  }, [filter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/returns' 
        : `/api/returns?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors du chargement');
        return;
      }

      setReturns(data.returns || []);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des retours');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'En attente',
      },
      approved: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: CheckCircle,
        label: 'Approuvé',
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Rejeté',
      },
      shipped: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: Package,
        label: 'Expédié',
      },
      received: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: CheckCircle,
        label: 'Reçu',
      },
      refunded: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Remboursé',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </div>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes retours</h1>
        <p className="text-gray-600 mt-1">
          Gérez vos demandes de retour et suivez leur statut
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Tous' },
          { value: 'pending', label: 'En attente' },
          { value: 'approved', label: 'Approuvés' },
          { value: 'rejected', label: 'Rejetés' },
          { value: 'refunded', label: 'Remboursés' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === option.value
                ? 'bg-gold-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-gold-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && returns.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun retour trouvé
          </h3>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas encore créé de demande de retour
          </p>
          <Link
            href="/client/orders"
            className="inline-block bg-gold-600 hover:bg-gold-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Voir mes commandes
          </Link>
        </div>
      )}

      {/* Returns List */}
      {!loading && returns.length > 0 && (
        <div className="space-y-4">
          {returns.map((returnRequest) => (
            <Link
              key={returnRequest.id}
              href={`/client/returns/${returnRequest.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {returnRequest.return_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Commande: {returnRequest.order_id}
                  </p>
                </div>
                {getStatusBadge(returnRequest.status)}
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-gray-700">
                  <span className="font-medium">Raison:</span> {returnRequest.reason}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Créé:</span> {formatDate(returnRequest.created_at)}
                </p>
                {returnRequest.items && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Articles:</span> {returnRequest.items.length}
                  </p>
                )}
              </div>

              <div className="text-sm text-gold-600 font-medium">
                Voir les détails →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
