'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Truck, Package, Eye, Edit2, Save, X } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total: number;
  status: string;
  payment_status: string;
  shipping_method: string;
  shipping_address: any;
  delivery_duration_days: number;
  shipped_at: string | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
}

interface EditingOrder {
  [key: string]: {
    delivery_duration_days?: number;
    shipped_at?: string;
    estimated_delivery_date?: string;
    delivered_at?: string;
    tracking_number?: string;
    carrier?: string;
    status?: string;
  };
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingOrder>({});
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    loadOrders();
  }, [locale, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('No admin token found');
      }

      const response = await fetch('/api/admin/orders/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load orders');
      }

      const data = await response.json();
      console.log('[loadOrders] Received orders:', data.orders);
      if (data.orders && data.orders.length > 0) {
        console.log('[loadOrders] First order delivered_at:', data.orders[0].delivered_at);
        console.log('[loadOrders] First order shipped_at:', data.orders[0].shipped_at);
        console.log('[loadOrders] First order tracking_number:', data.orders[0].tracking_number);
      }
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (orderId: string, field: string, value: any) => {
    setEditing((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  const toggleEditMode = (orderId: string) => {
    if (editing[orderId]) {
      // Already in edit mode, cancel
      handleCancel(orderId);
    } else {
      // Enter edit mode with empty changes
      setEditing((prev) => ({
        ...prev,
        [orderId]: {},
      }));
    }
  };

  const handleSave = async (orderId: string) => {
    console.log('[handleSave] START - orderId:', orderId);
    console.log('[handleSave] editing state:', editing);
    
    try {
      const changes = editing[orderId];
      console.log('[handleSave] changes:', changes);
      
      if (!changes || Object.keys(changes).length === 0) {
        console.log('[handleSave] No changes, returning');
        setError(null);
        setSuccess('Aucune modification à enregistrer.');
        return;
      }

      setError(null);
      setSuccess(null);

      // Build payload - only send fields that were actually changed
      const payload: any = {};
      if (changes.delivery_duration_days !== undefined) payload.delivery_duration_days = changes.delivery_duration_days;
      if (changes.shipped_at !== undefined) payload.shipped_at = changes.shipped_at;
      if (changes.estimated_delivery_date !== undefined) payload.estimated_delivery_date = changes.estimated_delivery_date;
      if (changes.delivered_at !== undefined) payload.delivered_at = changes.delivered_at;
      if (changes.tracking_number !== undefined) payload.tracking_number = changes.tracking_number;
      if (changes.carrier !== undefined) payload.carrier = changes.carrier;
      if (changes.status !== undefined) payload.status = changes.status;

      console.log('[handleSave] payload to send:', payload);

      const response = await fetch(`/api/admin/orders/${orderId}/delivery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('[handleSave] response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      console.log('[handleSave] success, reloading orders...');
      
      // Reload orders
      await loadOrders();
      
      console.log('[handleSave] orders reloaded, closing and reopening section...');
      
      // Close and reopen section to force re-render
      setSelectedOrder(null);
      await new Promise(resolve => {
        setTimeout(() => resolve(true), 150);
      });
      setSelectedOrder(orderId);
      
      // Clear editing state
      setEditing((prev) => {
        const newEditing = { ...prev };
        delete newEditing[orderId];
        return newEditing;
      });

      console.log('[handleSave] showing success message');
      setSuccess('La livraison a été mise à jour avec succès.');
    } catch (err: any) {
      console.error('[handleSave] ERROR:', err);
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleCancel = (orderId: string) => {
    setEditing((prev) => {
      const newEditing = { ...prev };
      delete newEditing[orderId];
      return newEditing;
    });
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
                Gestion des Commandes
              </h1>
              <p className="text-nubia-black/60 mt-1">
                Suivi et gestion de la livraison des commandes
              </p>
            </div>
          </div>

          {/* Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">Chargement des commandes...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border-2 border-nubia-gold/20 rounded-lg overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-nubia-gold/5 px-6 py-4 border-b border-nubia-gold/20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Package className="text-nubia-gold" size={24} />
                      <div>
                        <p className="font-semibold text-nubia-black">
                          {order.order_number}
                        </p>
                        <p className="text-sm text-nubia-black/60">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      <button
                        onClick={() =>
                          setSelectedOrder(
                            selectedOrder === order.id ? null : order.id
                          )
                        }
                        className="p-2 hover:bg-nubia-gold/10 rounded-lg transition-colors"
                      >
                        <Eye size={20} className="text-nubia-gold" />
                      </button>
                    </div>
                  </div>

                  {/* Order Details */}
                  {selectedOrder === order.id && (
                    <div className="p-6 space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-nubia-black/60 mb-1">
                            Montant total
                          </p>
                          <p className="text-2xl font-bold text-nubia-gold">
                            {order.total.toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-nubia-black/60 mb-1">
                            Statut du paiement
                          </p>
                          <p className="text-lg font-semibold text-nubia-black">
                            {order.payment_status === 'paid'
                              ? 'Payée'
                              : 'En attente'}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Tracking */}
                      <div className="border-t border-nubia-gold/20 pt-6">
                        <h3 className="font-semibold text-nubia-black mb-4 flex items-center gap-2">
                          <Truck size={20} className="text-nubia-gold" />
                          Suivi de la livraison
                        </h3>

                        <div className="space-y-4">
                          {/* Duration */}
                          <div>
                            <label className="block text-sm font-semibold text-nubia-black mb-2">
                              Durée de livraison (jours)
                            </label>
                            {editing[order.id] ? (
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={
                                  editing[order.id]?.delivery_duration_days ??
                                  order.delivery_duration_days
                                }
                                onChange={(e) =>
                                  handleEdit(
                                    order.id,
                                    'delivery_duration_days',
                                    parseInt(e.target.value)
                                  )
                                }
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                              />
                            ) : (
                              <p className="text-lg text-nubia-black">
                                {order.delivery_duration_days} jours
                              </p>
                            )}
                          </div>

                          {/* Shipped At */}
                          <div>
                            <label className="block text-sm font-semibold text-nubia-black mb-2">
                              Date d'expédition
                            </label>
                            {editing[order.id] ? (
                              <input
                                type="datetime-local"
                                value={
                                  editing[order.id]?.shipped_at
                                    ? new Date(
                                        editing[order.id].shipped_at!
                                      )
                                        .toISOString()
                                        .slice(0, 16)
                                    : order.shipped_at
                                    ? new Date(order.shipped_at)
                                        .toISOString()
                                        .slice(0, 16)
                                    : ''
                                }
                                onChange={(e) =>
                                  handleEdit(
                                    order.id,
                                    'shipped_at',
                                    new Date(e.target.value).toISOString()
                                  )
                                }
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                              />
                            ) : (
                              <p className="text-lg text-nubia-black">
                                {order.shipped_at
                                  ? new Date(order.shipped_at).toLocaleDateString(
                                      'fr-FR',
                                      {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }
                                    )
                                  : 'Non expédiée'}
                              </p>
                            )}
                          </div>

                          {/* Estimated Delivery */}
                          <div>
                            <label className="block text-sm font-semibold text-nubia-black mb-2">
                              Date estimée de livraison
                            </label>
                            {editing[order.id] ? (
                              <input
                                type="date"
                                value={
                                  editing[order.id]?.estimated_delivery_date
                                    ? new Date(
                                        editing[order.id].estimated_delivery_date!
                                      )
                                        .toISOString()
                                        .split('T')[0]
                                    : order.estimated_delivery_date
                                    ? new Date(order.estimated_delivery_date)
                                        .toISOString()
                                        .split('T')[0]
                                    : ''
                                }
                                onChange={(e) =>
                                  handleEdit(
                                    order.id,
                                    'estimated_delivery_date',
                                    e.target.value ? new Date(e.target.value + 'T00:00:00').toISOString() : ''
                                  )
                                }
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                              />
                            ) : (
                              <p className="text-lg text-nubia-black">
                                {order.estimated_delivery_date
                                  ? new Date(
                                      order.estimated_delivery_date
                                    ).toLocaleDateString('fr-FR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })
                                  : 'À calculer'}
                              </p>
                            )}
                          </div>

                          {/* Delivered At */}
                          <div>
                            <label className="block text-sm font-semibold text-nubia-black mb-2">
                              Date de livraison réelle
                            </label>
                            {editing[order.id] ? (
                              <input
                                type="datetime-local"
                                value={
                                  editing[order.id]?.delivered_at
                                    ? new Date(
                                        editing[order.id].delivered_at!
                                      )
                                        .toISOString()
                                        .slice(0, 16)
                                    : order.delivered_at
                                    ? new Date(order.delivered_at)
                                        .toISOString()
                                        .slice(0, 16)
                                    : ''
                                }
                                onChange={(e) =>
                                  handleEdit(
                                    order.id,
                                    'delivered_at',
                                    new Date(e.target.value).toISOString()
                                  )
                                }
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                              />
                            ) : (
                              <p className="text-lg text-nubia-black">
                                {order.delivered_at
                                  ? new Date(order.delivered_at).toLocaleDateString(
                                      'fr-FR',
                                      {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }
                                    )
                                  : 'Non livrée'}
                              </p>
                            )}
                          </div>

                          {/* Tracking Number */}
                          <div>
                            <label className="block text-sm font-semibold text-nubia-black mb-2">
                              Numéro de suivi
                            </label>
                            {editing[order.id] ? (
                              <input
                                type="text"
                                value={
                                  editing[order.id]?.tracking_number ??
                                  order.tracking_number ??
                                  ''
                                }
                                onChange={(e) =>
                                  handleEdit(
                                    order.id,
                                    'tracking_number',
                                    e.target.value
                                  )
                                }
                                placeholder="Ex: TRACK123456"
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                              />
                            ) : (
                              <p className="text-lg text-nubia-black">
                                {order.tracking_number || 'Non fourni'}
                              </p>
                            )}
                          </div>

                          {/* Carrier */}
                          <div>
                            <label className="block text-sm font-semibold text-nubia-black mb-2">
                              Transporteur
                            </label>
                            {editing[order.id] ? (
                              <select
                                value={
                                  editing[order.id]?.carrier ??
                                  order.carrier ??
                                  ''
                                }
                                onChange={(e) =>
                                  handleEdit(order.id, 'carrier', e.target.value)
                                }
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                              >
                                <option value="">Sélectionner un transporteur</option>
                                <option value="DHL">DHL</option>
                                <option value="FedEx">FedEx</option>
                                <option value="UPS">UPS</option>
                                <option value="Senegal Post">Senegal Post</option>
                                <option value="Local">Local</option>
                              </select>
                            ) : (
                              <p className="text-lg text-nubia-black">
                                {order.carrier || 'Non spécifié'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-nubia-gold/20 pt-6 flex gap-4">
                        {editing[order.id] ? (
                          <>
                            <button
                              onClick={() => handleSave(order.id)}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                            >
                              <Save size={20} />
                              Enregistrer
                            </button>
                            <button
                              onClick={() => handleCancel(order.id)}
                              className="flex-1 flex items-center justify-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                            >
                              <X size={20} />
                              Annuler
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => toggleEditMode(order.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-nubia-gold text-nubia-black px-6 py-3 rounded-lg hover:bg-nubia-gold/90 transition-colors font-semibold"
                          >
                            <Edit2 size={20} />
                            Modifier
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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
