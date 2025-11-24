'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Truck, Package, Eye, Edit2, Save, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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
  order_items?: OrderItem[];
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
  const { locale, t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingOrder>({});
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const subscriptionRef = useRef<any>(null);
  const selectedOrderRef = useRef<string | null>(null);

  // Normalize order data to ensure all fields are properly mapped
  // IMPORTANT: Preserve exact values from database, don't convert to null
  const normalizeOrder = (order: any): Order => {
    return {
      id: order.id ?? '',
      order_number: order.order_number ?? '',
      user_id: order.user_id ?? '',
      total: typeof order.total === 'string' ? parseFloat(order.total) : (order.total ?? 0),
      status: order.status ?? 'pending',
      payment_status: order.payment_status ?? 'pending',
      shipping_method: order.shipping_method ?? '',
      shipping_address: order.shipping_address ?? {},
      delivery_duration_days: order.delivery_duration_days ?? 3,
      // Preserve exact values - only use null if truly undefined, not if empty string
      shipped_at: order.shipped_at !== undefined ? order.shipped_at : null,
      estimated_delivery_date: order.estimated_delivery_date !== undefined ? order.estimated_delivery_date : null,
      delivered_at: order.delivered_at !== undefined ? order.delivered_at : null,
      tracking_number: order.tracking_number !== undefined ? order.tracking_number : null,
      carrier: order.carrier !== undefined ? order.carrier : null,
      created_at: order.created_at ?? new Date().toISOString(),
      updated_at: order.updated_at ?? new Date().toISOString(),
      order_items: order.order_items || [],
    };
  };

  // Keep ref in sync with state
  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    loadOrders();

    // Set up Supabase Realtime subscription to listen for order updates
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      console.log('[Realtime] Setting up subscription for orders table');

      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            console.log('[Realtime] Order updated:', payload);
            console.log('[Realtime] New delivered_at:', payload.new.delivered_at);
            console.log('[Realtime] Old delivered_at:', payload.old?.delivered_at);

            // Update the order in local state
            setOrders((prevOrders) => {
              const orderIndex = prevOrders.findIndex(o => o.id === payload.new.id);
              if (orderIndex === -1) {
                console.log('[Realtime] Order not found in local state, reloading...');
                // Order not in local state, reload all orders
                setTimeout(() => loadOrders(), 100);
                return prevOrders;
              }

              // Create a completely new array and new order object to force React to detect the change
              const updatedOrders = prevOrders.map((order, index) => {
                if (index === orderIndex) {
                  // Normalize the payload data and merge with existing order
                  const payloadOrder = normalizeOrder(payload.new);

                  // Create a completely new object with all fields properly mapped
                  const updatedOrder: Order = {
                    ...order, // Keep existing fields
                    ...payloadOrder, // Override with normalized new values from database
                    // Explicitly ensure all date fields are properly set
                    delivered_at: payloadOrder.delivered_at,
                    shipped_at: payloadOrder.shipped_at,
                    estimated_delivery_date: payloadOrder.estimated_delivery_date,
                    tracking_number: payloadOrder.tracking_number,
                    carrier: payloadOrder.carrier,
                    delivery_duration_days: payloadOrder.delivery_duration_days,
                    // Ensure updated_at is set
                    updated_at: payloadOrder.updated_at || order.updated_at,
                  };

                  console.log('[Realtime] Order before update:', {
                    id: order.id,
                    delivered_at: order.delivered_at,
                    shipped_at: order.shipped_at,
                    updated_at: order.updated_at,
                  });
                  console.log('[Realtime] Payload new (raw):', {
                    id: payload.new.id,
                    delivered_at: payload.new.delivered_at,
                    shipped_at: payload.new.shipped_at,
                  });
                  console.log('[Realtime] Payload new (normalized):', {
                    id: payloadOrder.id,
                    delivered_at: payloadOrder.delivered_at,
                    shipped_at: payloadOrder.shipped_at,
                  });
                  console.log('[Realtime] Order after update:', {
                    id: updatedOrder.id,
                    delivered_at: updatedOrder.delivered_at,
                    shipped_at: updatedOrder.shipped_at,
                    updated_at: updatedOrder.updated_at,
                  });

                  return updatedOrder;
                }
                return { ...order }; // Create new object for other orders too
              });

              return updatedOrders;
            });

            // Force re-render
            setForceUpdate(prev => prev + 1);

            // If the updated order is currently selected, keep it selected
            // Use ref to get the current value
            if (selectedOrderRef.current === payload.new.id) {
              // Force re-render of the selected section
              setSelectedOrder(null);
              setTimeout(() => {
                setSelectedOrder(payload.new.id);
              }, 50);
            }
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] Successfully subscribed to orders changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[Realtime] Channel error - Realtime may not be enabled for orders table');
          }
        });

      subscriptionRef.current = channel;

      return () => {
        console.log('[Realtime] Cleaning up subscription');
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
        }
      };
    } else {
      console.warn('[Realtime] Supabase environment variables not found, Realtime disabled');
    }
    // Always return a cleanup function or undefined on all code paths to satisfy TypeScript
    return () => { };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('No admin token found');
      }

      // Force no cache - multiple cache busting techniques
      const cacheBuster = Date.now();
      let url = `/api/admin/orders/list?t=${cacheBuster}&_=${cacheBuster}`;

      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }

      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store', // Next.js cache control
      });

      if (!response.ok) {
        throw new Error('Failed to load orders');
      }

      const data = await response.json();
      console.log('[loadOrders] Raw response from API:', {
        success: data.success,
        ordersCount: data.orders?.length,
      });

      // Log specific order to debug
      const debugOrder = data.orders?.find((o: any) => o.id === 'aa86dcc2-f684-4fe6-a205-46a3f21edcaa');
      if (debugOrder) {
        console.log('[loadOrders] DEBUG ORDER from API:', {
          id: debugOrder.id,
          delivered_at: debugOrder.delivered_at,
          shipped_at: debugOrder.shipped_at,
          updated_at: debugOrder.updated_at,
          raw: debugOrder,
        });
      }

      // Normalize all orders to ensure proper mapping
      const normalizedOrders = (data.orders || []).map((order: any) => {
        const normalized = normalizeOrder(order);
        // Log normalization for debug order
        if (order.id === 'aa86dcc2-f684-4fe6-a205-46a3f21edcaa') {
          console.log('[loadOrders] DEBUG ORDER after normalization:', {
            id: normalized.id,
            delivered_at: normalized.delivered_at,
            shipped_at: normalized.shipped_at,
            updated_at: normalized.updated_at,
          });
        }
        return normalized;
      });

      if (normalizedOrders.length > 0) {
        console.log('[loadOrders] First order after normalization:', {
          id: normalizedOrders[0].id,
          delivered_at: normalizedOrders[0].delivered_at,
          shipped_at: normalizedOrders[0].shipped_at,
          tracking_number: normalizedOrders[0].tracking_number,
        });
      }

      // Create completely new array with explicit object creation to force React update
      const freshOrders = normalizedOrders.map((o: Order) => ({
        id: o.id,
        order_number: o.order_number,
        user_id: o.user_id,
        total: o.total,
        status: o.status,
        payment_status: o.payment_status,
        shipping_method: o.shipping_method,
        shipping_address: o.shipping_address,
        delivery_duration_days: o.delivery_duration_days,
        shipped_at: o.shipped_at,
        estimated_delivery_date: o.estimated_delivery_date,
        delivered_at: o.delivered_at,
        tracking_number: o.tracking_number,
        carrier: o.carrier,
        created_at: o.created_at,
        updated_at: o.updated_at,
        order_items: o.order_items,
      }));

      console.log('[loadOrders] Setting orders state, count:', freshOrders.length);
      const debugOrderInState = freshOrders.find((o: Order) => o.id === 'aa86dcc2-f684-4fe6-a205-46a3f21edcaa');
      if (debugOrderInState) {
        console.log('[loadOrders] DEBUG ORDER in state being set:', {
          id: debugOrderInState.id,
          delivered_at: debugOrderInState.delivered_at,
          shipped_at: debugOrderInState.shipped_at,
          updated_at: debugOrderInState.updated_at,
        });
      }

      // Force state update and re-render
      setOrders(freshOrders);
      setForceUpdate(prev => prev + 1);
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

      const responseData = await response.json();
      console.log('[handleSave] response data:', responseData);
      console.log('[handleSave] response order delivered_at:', responseData.order?.delivered_at);

      // Clear editing state first
      setEditing((prev) => {
        const newEditing = { ...prev };
        delete newEditing[orderId];
        return newEditing;
      });

      // Close the section temporarily to force re-render
      const wasOpen = selectedOrder === orderId;
      if (wasOpen) {
        setSelectedOrder(null);
      }

      // Reload orders to ensure we have the latest data (with cache busting)
      console.log('[handleSave] Reloading orders with cache busting...');
      const token = localStorage.getItem('admin_token');
      const reloadResponse = await fetch(`/api/admin/orders/list?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json();
        console.log('[handleSave] Reloaded orders (raw):', reloadData.orders);
        if (reloadData.orders) {
          // Normalize all orders to ensure proper mapping
          const normalizedOrders = reloadData.orders.map((o: any) => normalizeOrder(o));

          // Find the updated order in the reloaded data to verify
          const updatedOrderInReload = normalizedOrders.find((o: Order) => o.id === orderId);
          console.log('[handleSave] Updated order in reloaded data (normalized):', updatedOrderInReload);
          console.log('[handleSave] delivered_at value:', updatedOrderInReload?.delivered_at);
          console.log('[handleSave] updated_at value:', updatedOrderInReload?.updated_at);

          // CRITICAL: Create completely new objects with all properties explicitly set
          // This ensures React detects the change even if values are the same
          const freshOrders = normalizedOrders.map((o: Order) => ({
            id: o.id,
            order_number: o.order_number,
            user_id: o.user_id,
            total: o.total,
            status: o.status,
            payment_status: o.payment_status,
            shipping_method: o.shipping_method,
            shipping_address: o.shipping_address,
            delivery_duration_days: o.delivery_duration_days,
            shipped_at: o.shipped_at,
            estimated_delivery_date: o.estimated_delivery_date,
            delivered_at: o.delivered_at,
            tracking_number: o.tracking_number,
            carrier: o.carrier,
            created_at: o.created_at,
            updated_at: o.updated_at,
            order_items: o.order_items,
          }));

          console.log('[handleSave] Setting new orders state, count:', freshOrders.length);
          console.log('[handleSave] Order to update in state:', freshOrders.find((o: Order) => o.id === orderId));

          // Update state with fresh normalized data
          setOrders(freshOrders);

          // Force multiple re-renders to ensure UI updates
          setForceUpdate(prev => prev + 1);

          // Verify the update was successful by checking state after a delay
          setTimeout(() => {
            setOrders((currentOrders) => {
              const verifyOrder = currentOrders.find(o => o.id === orderId);
              console.log('[handleSave] Verification - Order in state after update:', {
                id: verifyOrder?.id,
                delivered_at: verifyOrder?.delivered_at,
                updated_at: verifyOrder?.updated_at,
              });

              // If the order still has old data, force a complete reload
              if (verifyOrder && updatedOrderInReload) {
                const stateUpdatedAt = verifyOrder.updated_at;
                const dbUpdatedAt = updatedOrderInReload.updated_at;
                if (stateUpdatedAt !== dbUpdatedAt) {
                  console.warn('[handleSave] State mismatch detected, forcing complete reload');
                  setTimeout(() => loadOrders(), 100);
                }
              }

              return currentOrders;
            });

            setForceUpdate(prev => prev + 1);
            if (wasOpen) {
              setSelectedOrder(null);
              setTimeout(() => {
                setSelectedOrder(orderId);
                setForceUpdate(prev => prev + 1);
              }, 100);
            }
          }, 200);
        }
      } else {
        // Fallback: update with response data if reload fails
        if (responseData.order) {
          console.log('[handleSave] Fallback: Updating local state with returned order data');
          const normalizedOrder = normalizeOrder(responseData.order);

          setOrders((prevOrders) => {
            const updatedOrders = prevOrders.map((order) => {
              if (order.id === orderId) {
                const updated = { ...order, ...normalizedOrder };
                console.log('[handleSave] Order before update:', {
                  delivered_at: order.delivered_at,
                  updated_at: order.updated_at,
                });
                console.log('[handleSave] Order after update:', {
                  delivered_at: updated.delivered_at,
                  updated_at: updated.updated_at,
                });
                return updated;
              }
              return { ...order }; // Create new object for other orders
            });
            return updatedOrders;
          });

          // Force re-render by updating forceUpdate counter
          setForceUpdate(prev => prev + 1);

          if (wasOpen) {
            setTimeout(() => {
              setSelectedOrder(orderId);
              setForceUpdate(prev => prev + 1);
            }, 100);
          }
        }
      }

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <button
              onClick={() => router.push(`/${locale}/admin/dashboard`)}
              className="p-2 hover:bg-nubia-gold/10 rounded-lg transition-colors w-fit"
            >
              <ArrowLeft size={24} className="text-nubia-gold" />
            </button>
            <div>
              <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-nubia-black">
                {t('admin.orders.title', 'Gestion des Commandes')}
              </h1>
              <p className="text-nubia-black/60 mt-1 text-sm sm:text-base">
                {t('admin.orders.subtitle', 'Suivi et gestion de la livraison des commandes')}
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-lg border border-nubia-gold/20 mb-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder={t('admin.orders.search_placeholder', 'Rechercher une commande...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                  className="w-full pl-4 pr-10 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold text-sm"
                />
                <button
                  onClick={() => loadOrders()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-nubia-gold hover:text-nubia-black"
                >
                  <Eye size={18} />
                </button>
              </div>

              <button
                onClick={() => loadOrders()}
                className="text-sm text-nubia-gold hover:underline flex items-center gap-1 justify-center sm:justify-start whitespace-nowrap"
              >
                <Edit2 size={14} /> {t('admin.orders.apply_filters', 'Appliquer les filtres / Rafraîchir')}
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === status
                    ? 'bg-nubia-gold text-nubia-black'
                    : 'bg-nubia-gold/5 text-nubia-black/60 hover:bg-nubia-gold/10'
                  }`}
                >
                  {status === 'all' ? t('admin.orders.filter_all', 'Toutes') : getStatusLabel(status)}
                </button>
              ))}
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
              <p className="text-nubia-black/70">{t('admin.orders.loading', 'Chargement des commandes...')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={`${order.id}-${order.updated_at}-${forceUpdate}`}
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
                                  : t('admin.orders.not_shipped', 'Non expédiée')}
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
                              <div
                                key={`delivered-at-${order.id}-${order.updated_at}-${forceUpdate}`}
                                className="text-lg text-nubia-black"
                              >
                                {(() => {
                                  // CRITICAL: Always read from current state, not from the order prop
                                  const currentOrder = orders.find(o => o.id === order.id);
                                  if (!currentOrder) {
                                    console.warn('[Display] Order not found in state:', order.id);
                                    return <span>Non livrée</span>;
                                  }

                                  const deliveredAtValue = currentOrder.delivered_at;

                                  // Debug logging for specific order
                                  if (order.id === 'aa86dcc2-f684-4fe6-a205-46a3f21edcaa' || order.id === selectedOrder) {
                                    console.log('[Display] Rendering delivered_at:', {
                                      orderId: order.id,
                                      orderPropDeliveredAt: order.delivered_at,
                                      stateDeliveredAt: currentOrder.delivered_at,
                                      deliveredAtValue: deliveredAtValue,
                                      updated_at: currentOrder.updated_at,
                                      forceUpdate: forceUpdate,
                                    });
                                  }

                                  if (deliveredAtValue) {
                                    try {
                                      const date = new Date(deliveredAtValue);
                                      if (isNaN(date.getTime())) {
                                        console.error('[Display] Invalid date:', deliveredAtValue, 'for order:', order.id);
                                        return <span>Date invalide: {String(deliveredAtValue)}</span>;
                                      }
                                      const formatted = date.toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      });

                                      if (order.id === 'aa86dcc2-f684-4fe6-a205-46a3f21edcaa' || order.id === selectedOrder) {
                                        console.log('[Display] Formatted date:', formatted, 'from value:', deliveredAtValue);
                                      }

                                      return <span>{formatted}</span>;
                                    } catch (e) {
                                      console.error('[Display] Date parsing error:', e, deliveredAtValue, 'for order:', order.id);
                                      return <span>Erreur: {String(deliveredAtValue)}</span>;
                                    }
                                  }
                                  return <span>Non livrée</span>;
                                })()}
                              </div>
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
                                placeholder={t('admin.tracking_placeholder', 'Ex: TRACK123456')}
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                              />
                            ) : (
                              <p className="text-lg text-nubia-black">
                                {order.tracking_number || t('admin.orders.not_provided', 'Non fourni')}
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
                                <option value="">{t('orders.select_carrier', 'Sélectionner un transporteur')}</option>
                                <option value="DHL">DHL</option>
                                <option value="FedEx">FedEx</option>
                                <option value="UPS">UPS</option>
                                <option value="Senegal Post">Senegal Post</option>
                                <option value="Local">Local</option>
                              </select>
                            ) : (
                              <p className="text-lg text-nubia-black">
                                {order.carrier || t('admin.orders.not_specified', 'Non spécifié')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Management */}
                      <div className="bg-nubia-gold/5 p-4 rounded-lg border border-nubia-gold/20 mt-6">
                        <h3 className="font-semibold text-nubia-black mb-3">Statut de la commande</h3>
                        <div className="flex flex-wrap gap-2">
                          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                if (editing[order.id]?.status === status || (!editing[order.id]?.status && order.status === status)) return;
                                handleEdit(order.id, 'status', status);
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${(editing[order.id]?.status || order.status) === status
                                ? getStatusColor(status) + ' ring-2 ring-offset-2 ring-nubia-gold/50'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              {getStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                        {editing[order.id]?.status && editing[order.id]?.status !== order.status && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleSave(order.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-nubia-gold text-nubia-black rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all text-sm font-bold"
                            >
                              <Save size={16} />
                              Confirmer le changement de statut
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="border-t border-nubia-gold/20 pt-6 mt-6">
                        <h3 className="font-semibold text-nubia-black mb-4 flex items-center gap-2">
                          <Package size={20} className="text-nubia-gold" />
                          Articles commandés ({order.order_items?.length || 0})
                        </h3>
                        <div className="space-y-3">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                              {item.products?.image_url && (
                                <div className="w-12 h-12 bg-white rounded border border-gray-200 overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.products.image_url}
                                    alt={item.products.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-nubia-black">{item.products?.name || 'Produit inconnu'}</p>
                                <p className="text-sm text-gray-500">Qté: {item.quantity} × {item.price.toLocaleString('fr-FR')} FCFA</p>
                              </div>
                              <p className="font-bold text-nubia-black">
                                {(item.quantity * item.price).toLocaleString('fr-FR')} FCFA
                              </p>
                            </div>
                          ))}
                          {(!order.order_items || order.order_items.length === 0) && (
                            <p className="text-gray-500 italic">Aucun article trouvé pour cette commande.</p>
                          )}
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
                              {t('admin.save_button', 'Enregistrer')}
                            </button>
                            <button
                              onClick={() => handleCancel(order.id)}
                              className="flex-1 flex items-center justify-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                            >
                              <X size={20} />
                              {t('admin.cancel_button', 'Annuler')}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => toggleEditMode(order.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-nubia-gold text-nubia-black px-6 py-3 rounded-lg hover:bg-nubia-gold/90 transition-colors font-semibold"
                          >
                            <Edit2 size={20} />
                            {t('admin.edit_button', 'Modifier')}
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
