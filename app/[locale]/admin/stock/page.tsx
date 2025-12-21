'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, AlertCircle, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface StockItem {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  stock: number;
  inStock: boolean;
  reserved: number;
  available: number;
  category: string;
}

interface Reservation {
  id: string;
  product_id: string;
  qty: number;
  status: 'active' | 'finalized' | 'released';
  expires_at: string;
  created_at: string;
}

export default function StockManagementPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'stocks' | 'reservations'>('stocks');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push(`/${locale}/admin/login`);
    } else {
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, [router, locale]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        router.push(`/${locale}/admin/login`);
        return;
      }

      // Charger les stocks
      const stockRes = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!stockRes.ok) {
        if (stockRes.status === 401) {
          router.push(`/${locale}/admin/login`);
          return;
        }
        throw new Error('Failed to load stocks');
      }
      const stockData = await stockRes.json();

      // Transformer les données - handle both 'data' and 'products' response formats
      const productsArray = stockData.data || stockData.products || [];
      const items: StockItem[] = productsArray.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name_fr: p.name_fr || p.name || 'Produit',
        name_en: p.name_en || p.name || 'Product',
        stock: p.stock || 0,
        inStock: p.inStock,
        reserved: 0, // À calculer
        available: (p.stock || 0), // À calculer
        category: p.category || 'N/A',
      }));

      setStocks(items);

      // Charger les réservations
      const resRes = await fetch('/api/admin/reservations', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      if (resRes.ok) {
        const resData = await resRes.json();
        setReservations(resData.reservations || []);

        // Calculer les stocks réservés
        const reservedByProduct = new Map<string, number>();
        (resData.reservations || []).forEach((r: any) => {
          if (r.status === 'active' || r.status === 'finalized') {
            reservedByProduct.set(r.product_id, (reservedByProduct.get(r.product_id) || 0) + r.qty);
          }
        });

        // Mettre à jour les stocks avec les réservations
        setStocks(items.map(item => ({
          ...item,
          reserved: reservedByProduct.get(item.id) || 0,
          available: item.stock - (reservedByProduct.get(item.id) || 0),
        })));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nubia-gold mx-auto mb-4"></div>
          <p>{t('common.loading', 'Chargement...')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-nubia-black">
            {t('admin.stock_management', 'Gestion du Stock')}
          </h1>
        </div>

        {/* Onglets */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setTab('stocks')}
            className={`px-4 py-2 font-medium transition ${tab === 'stocks'
              ? 'border-b-2 border-nubia-gold text-nubia-gold'
              : 'text-gray-600 hover:text-nubia-black'
              }`}
          >
            {t('admin.stocks', 'Stocks')} ({stocks.length})
          </button>
          <button
            onClick={() => setTab('reservations')}
            className={`px-4 py-2 font-medium transition ${tab === 'reservations'
              ? 'border-b-2 border-nubia-gold text-nubia-gold'
              : 'text-gray-600 hover:text-nubia-black'
              }`}
          >
            {t('admin.reservations', 'Réservations')} ({reservations.length})
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">{t('common.error', 'Erreur')}</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Bouton Rafraîchir */}
        <button
          onClick={loadData}
          disabled={loading}
          className="mb-6 px-4 py-2 bg-nubia-gold text-nubia-black rounded-lg hover:bg-nubia-gold/90 disabled:opacity-50 transition"
        >
          {loading ? t('common.loading', 'Chargement...') : t('common.refresh', 'Rafraîchir')}
        </button>

        {/* Contenu des onglets */}
        {tab === 'stocks' && (
          <div className="space-y-4">
            {stocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('admin.no_products', 'Aucun produit')}
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-nubia-cream">
                    <tr>
                      <th className="text-left p-3">Produit</th>
                      <th className="text-left p-3">Catégorie</th>
                      <th className="text-right p-3">Stock Total</th>
                      <th className="text-right p-3">Réservé</th>
                      <th className="text-right p-3">Disponible</th>
                      <th className="text-center p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">
                          <div>
                            <p className="text-nubia-black">{item.name_fr}</p>
                            <p className="text-xs text-gray-500">{item.slug}</p>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">{item.category}</td>
                        <td className="p-3 text-right font-semibold">{item.stock}</td>
                        <td className="p-3 text-right text-orange-600 font-semibold">{item.reserved}</td>
                        <td className={`p-3 text-right font-semibold ${item.available <= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                          {item.available}
                        </td>
                        <td className="p-3 text-center">
                          {item.available <= 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                              <TrendingDown className="w-3 h-3" />
                              Rupture
                            </span>
                          ) : item.available <= 5 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              Faible
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'reservations' && (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('admin.no_reservations', 'Aucune réservation')}
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-nubia-cream">
                    <tr>
                      <th className="text-left p-3">Produit</th>
                      <th className="text-right p-3">Quantité</th>
                      <th className="text-left p-3">Statut</th>
                      <th className="text-left p-3">Créée le</th>
                      <th className="text-left p-3">Expire le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res) => {
                      const product = stocks.find(s => s.id === res.product_id);
                      const isExpired = new Date(res.expires_at) < new Date();

                      return (
                        <tr key={res.id} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">
                            {product?.name_fr || 'Produit inconnu'}
                          </td>
                          <td className="p-3 text-right font-semibold">{res.qty}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${res.status === 'finalized' ? 'bg-green-100 text-green-700' :
                              res.status === 'released' ? 'bg-gray-100 text-gray-700' :
                                isExpired ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                              }`}>
                              {res.status === 'finalized' ? 'Finalisée' :
                                res.status === 'released' ? 'Libérée' :
                                  isExpired ? 'Expirée' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600 text-xs">
                            {new Date(res.created_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                          </td>
                          <td className="p-3 text-gray-600 text-xs">
                            {new Date(res.expires_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
