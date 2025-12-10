'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShoppingBag, ArrowLeft, Filter, Loader } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  order_items: any[];
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('sb-auth-token') : null;
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/orders', {
          headers,
        });
        if (!response.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.total.toString().includes(searchTerm)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
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
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <section className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={40} />
            <p className="text-nubia-black/70">Chargement des commandes...</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/client/dashboard"
              className="inline-flex items-center gap-2 text-nubia-gold hover:underline mb-4"
            >
              <ArrowLeft size={20} />
              Retour au tableau de bord
            </Link>
            <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-2">
              Mes Commandes
            </h1>
            <p className="text-nubia-black/70">
              {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4 md:space-y-0 md:flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('orders.search_placeholder', 'Rechercher par numéro ou montant...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-nubia-gold" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En traitement</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-12 text-center">
              <ShoppingBag className="text-nubia-gold/30 mx-auto mb-4" size={48} />
              <p className="text-nubia-black/70 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Aucune commande ne correspond à vos critères'
                  : 'Vous n\'avez pas encore de commandes'}
              </p>
              <Link
                href="/catalogue"
                className="inline-block px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all"
              >
                Commencer vos achats
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/client/orders/${order.id}`}
                  className="block border border-nubia-gold/20 rounded-lg p-6 hover:shadow-lg transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="font-semibold text-nubia-black">
                        {order.order_number}
                      </p>
                      <p className="text-sm text-nubia-black/70">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-nubia-black/70">Articles</p>
                      <p className="font-semibold text-nubia-black">
                        {order.order_items?.length || 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-nubia-black/70">Montant</p>
                      <p className="font-bold text-nubia-gold">
                        {order.total.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      <div className="text-nubia-gold">→</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
