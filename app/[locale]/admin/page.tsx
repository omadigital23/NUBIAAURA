"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

function useAdminToken() {
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("admin_token") || "";
    setToken(t);
    setIsAuthenticated(!!t);
  }, []);

  const save = (t: string) => {
    localStorage.setItem("admin_token", t);
    setToken(t);
    setIsAuthenticated(!!t);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    setToken("");
    setIsAuthenticated(false);
  };

  return { token, setToken: save, isAuthenticated, logout };
}

export default function AdminPage() {
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const { token, isAuthenticated, logout } = useAdminToken();
  const { t } = useTranslation();
  const username = typeof window !== 'undefined' ? localStorage.getItem("admin_username") : null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nubia-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-4">{t('admin.access_denied', 'Accès Refusé')}</h1>
          <p className="text-nubia-black/60 mb-6">{t('admin.please_login', 'Veuillez vous connecter via la page de login')}</p>
          <a href="/admin/login" className="bg-nubia-gold text-nubia-black px-6 py-2 rounded-lg hover:bg-nubia-gold/90">
            {t('admin.go_to_login', 'Aller à la connexion')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nubia-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-nubia-black">{t('admin.dashboard_title', 'Tableau de Bord Admin')}</h1>
            <p className="text-nubia-black/60 text-sm mt-1">{t('admin.logged_as', 'Connecté en tant que:')} {username}</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            {t('admin.logout', 'Déconnexion')}
          </button>
        </div>

        {/* Statistics Cards */}
        <StatsCards token={token} />

        <div className="flex gap-3 mb-6">
          <button
            className={`px-4 py-2 rounded border ${tab === "orders" ? "bg-nubia-gold border-nubia-gold text-nubia-black" : "border-nubia-gold/40"}`}
            onClick={() => setTab("orders")}
          >
            {t('admin.tab_orders', 'Commandes')}
          </button>
          <button
            className={`px-4 py-2 rounded border ${tab === "products" ? "bg-nubia-gold border-nubia-gold text-nubia-black" : "border-nubia-gold/40"}`}
            onClick={() => setTab("products")}
          >
            {t('admin.tab_products', 'Produits')}
          </button>
        </div>

        {tab === "orders" ? <OrdersPanel token={token} /> : <ProductsPanel token={token} />}
      </div>
    </div>
  );
}

function StatsCards({ token }: { token: string }) {
  const [stats, setStats] = useState({ revenue: 0, stockValue: 0, ordersCount: 0, productsCount: 0 });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load orders for revenue
        const ordersRes = await fetch("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ordersData = await ordersRes.json();
        const orders = ordersData.orders || [];

        // Calculate revenue from paid/delivered orders
        const revenue = orders
          .filter((o: any) => o.payment_status === 'paid' || o.status === 'delivered')
          .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        // Load products for stock value
        const productsRes = await fetch("/api/admin/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const productsData = await productsRes.json();
        const products = productsData.products || [];

        // Calculate stock value (price * stock)
        const stockValue = products.reduce((sum: number, p: any) => {
          const stock = p.stock || 0;
          const price = p.price || 0;
          return sum + (stock * price);
        }, 0);

        setStats({
          revenue,
          stockValue,
          ordersCount: orders.length,
          productsCount: products.length,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) loadStats();
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-nubia-gold/20 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Revenue Card */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-800">💰 {t('admin.stats.revenue', 'Chiffre d\'Affaires')}</span>
        </div>
        <div className="text-2xl font-bold text-green-900">
          {stats.revenue.toLocaleString("fr-FR")} <span className="text-lg">FCFA</span>
        </div>
        <p className="text-xs text-green-700 mt-1">{stats.ordersCount} {t('admin.stats.total_orders', 'commande(s)')}</p>
      </div>

      {/* Stock Value Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">📦 {t('admin.stats.stock_value', 'Valeur du Stock')}</span>
        </div>
        <div className="text-2xl font-bold text-blue-900">
          {stats.stockValue.toLocaleString("fr-FR")} <span className="text-lg">FCFA</span>
        </div>
        <p className="text-xs text-blue-700 mt-1">{stats.productsCount} {t('admin.stats.total_products', 'produit(s)')}</p>
      </div>

      {/* Orders Count Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-800">🛍️ {t('admin.stats.orders', 'Commandes')}</span>
        </div>
        <div className="text-2xl font-bold text-purple-900">
          {stats.ordersCount}
        </div>
        <p className="text-xs text-purple-700 mt-1">{t('admin.stats.total_orders', 'Total commandes')}</p>
      </div>

      {/* Products Count Card */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-orange-800">👕 {t('admin.stats.products', 'Produits')}</span>
        </div>
        <div className="text-2xl font-bold text-orange-900">
          {stats.productsCount}
        </div>
        <p className="text-xs text-orange-700 mt-1">{t('admin.stats.total_products', 'Total produits')}</p>
      </div>
    </div>
  );
}

function OrdersPanel({ token }: { token: string }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Force no-cache par les headers
      const res = await fetch("/api/admin/orders", {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store'
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error (${res.status}): ${errorText}`);
      }
      const data = await res.json();
      console.log('Orders loaded:', data);
      setOrders(data.orders || []);
      if (!data.orders || data.orders.length === 0) {
        setError(t('admin.orders.no_orders', 'Aucune commande trouvée'));
      } else {
        setError(null); // Effacer l'erreur si les données sont là
      }
    } catch (e: any) {
      console.error('Error loading orders:', e);
      setError(e.message || t('admin.orders.error_loading', 'Erreur lors du chargement des commandes'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify({ action: "update_status", id, status }),
    });
    if (res.ok) {
      await load(); // Recharger immédiatement
    }
    else {
      const errorText = await res.text();
      setError(`Erreur: ${errorText}`);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm(t('admin.orders.confirm_delete', 'Êtes-vous sûr de vouloir supprimer cette commande ?'))) {
      return;
    }
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (res.ok) {
      // Recharger IMMÉDIATEMENT après suppression
      await load();
    }
    else {
      const errorText = await res.text();
      setError(`Erreur: ${errorText}`);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {loading ? `⏳ ${t('admin.orders.loading', 'Chargement...')}` : `${t('admin.orders.total', 'Total:')} ${orders.length} ${t('admin.stats.total_orders', 'commande(s)')}`}
          </span>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          title={t('admin.orders.refresh_data', 'Rafraîchir les données')}
        >
          {loading ? `⏳ ${t('admin.orders.loading', 'Chargement...')}` : `🔄 ${t('admin.orders.refresh', 'Rafraîchir')}`}
        </button>
      </div>

      {loading && <div className="py-10 text-center">⏳ {t('admin.orders.loading_orders', 'Chargement des commandes...')}</div>}
      {error && <div className="py-4 bg-red-100 text-red-800 rounded p-3 mb-4">{error}</div>}
      {!loading && orders.length === 0 && !error && <div className="py-10 text-center text-gray-500">{t('admin.orders.no_orders_available', 'Aucune commande disponible')}</div>}
      {!loading && orders.length > 0 && (
        <div>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-nubia-cream">
                <tr>
                  <th className="text-left p-3">{t('admin.orders.table.order_number', 'Commande #')}</th>
                  <th className="text-left p-3">{t('admin.orders.table.status', 'Statut')}</th>
                  <th className="text-left p-3">{t('admin.orders.table.payment', 'Paiement')}</th>
                  <th className="text-left p-3">{t('admin.orders.table.total', 'Total')}</th>
                  <th className="text-left p-3">Délai</th>
                  <th className="text-left p-3">Livraison est.</th>
                  <th className="text-left p-3">Retour jusqu'au</th>
                  <th className="text-left p-3">{t('admin.orders.table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{o.order_number || 'N/A'}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{o.status || 'unknown'}</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{o.payment_status || 'pending'}</span></td>
                    <td className="p-3">{o.total ? o.total.toLocaleString("fr-FR") + " FCFA" : 'N/A'}</td>
                    <td className="p-3">
                      {o.delivery_duration_days ? (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{o.delivery_duration_days}j</span>
                      ) : '-'}
                    </td>
                    <td className="p-3">
                      {o.estimated_delivery_date ? (
                        <span className="text-xs">
                          {new Date(o.estimated_delivery_date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {o.return_deadline ? (
                        <span className={`text-xs ${new Date(o.return_deadline) > new Date()
                          ? 'text-green-700'
                          : 'text-red-700'
                          }`}>
                          {new Date(o.return_deadline).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 flex gap-1 flex-wrap">
                      <button className="px-2 py-1 border border-blue-300 bg-blue-50 rounded text-xs hover:bg-blue-100" onClick={() => updateStatus(o.id, "processing")}>{t('admin.orders.action.process', 'Traiter')}</button>
                      <button className="px-2 py-1 border border-orange-300 bg-orange-50 rounded text-xs hover:bg-orange-100" onClick={() => updateStatus(o.id, "shipped")}>{t('admin.orders.action.ship', 'Expédier')}</button>
                      <button className="px-2 py-1 border border-green-300 bg-green-50 rounded text-xs hover:bg-green-100" onClick={() => updateStatus(o.id, "delivered")}>{t('admin.orders.action.complete', 'Terminer')}</button>
                      <button className="px-2 py-1 border border-red-300 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100" onClick={() => updateStatus(o.id, "cancelled")}>{t('admin.orders.action.cancel', 'Annuler')}</button>
                      <button className="px-2 py-1 border border-red-500 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200" onClick={() => deleteOrder(o.id)}>{t('admin.orders.action.delete', 'Supprimer')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsPanel({ token }: { token: string }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, {
    price?: number;
    originalPrice?: number;
    stock?: number;
    inStock?: boolean;
    category?: string;
    sizes?: string;
    colors?: string;
    description_fr?: string;
    description_en?: string;
    name_fr?: string;
    name_en?: string;
    slug?: string;
    material_fr?: string;
    material_en?: string;
    care_fr?: string;
    care_en?: string;
  }>>({})

  const authHeader = useMemo(() => {
    if (!token) return {} as Record<string, string>;
    if (token.includes(':')) {
      const b64 = typeof window !== 'undefined' ? window.btoa(token) : Buffer.from(token).toString('base64');
      return { Authorization: `Basic ${b64}` } as Record<string, string>;
    }
    return { Authorization: `Bearer ${token}` } as Record<string, string>;
  }, [token]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        headers: { ...authHeader },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProducts(data.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const setEdit = (id: string, field: "price" | "originalPrice" | "stock" | "inStock" | "category" | "sizes" | "colors" | "description_fr" | "description_en" | "name_fr" | "name_en" | "slug" | "material_fr" | "material_en" | "care_fr" | "care_en", value: any) => {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const save = async (p: any) => {
    const changes = editing[p.id];
    if (!changes) return;
    // Update price/inStock/descriptions if provided
    if (
      typeof changes.price === 'number' ||
      typeof changes.originalPrice === 'number' ||
      typeof changes.inStock === 'boolean' ||
      typeof changes.category === 'string' ||
      typeof changes.sizes === 'string' ||
      typeof changes.colors === 'string' ||
      typeof changes.description_fr === 'string' ||
      typeof changes.description_en === 'string' ||
      typeof changes.name_fr === 'string' ||
      typeof changes.name_en === 'string' ||
      typeof changes.slug === 'string' ||
      typeof changes.material_fr === 'string' ||
      typeof changes.material_en === 'string' ||
      typeof changes.care_fr === 'string' ||
      typeof changes.care_en === 'string'
    ) {
      const payload: any = { action: "update", id: p.id };
      if (typeof changes.price === 'number') payload.price = changes.price;
      if (typeof changes.originalPrice === 'number') payload.originalPrice = changes.originalPrice;
      if (typeof changes.inStock === 'boolean') payload.inStock = changes.inStock;
      if (typeof changes.category === 'string') payload.category = changes.category;
      if (typeof changes.sizes === 'string') payload.sizes = changes.sizes;
      if (typeof changes.colors === 'string') payload.colors = changes.colors;
      if (typeof changes.description_fr === 'string') payload.description_fr = changes.description_fr;
      if (typeof changes.description_en === 'string') payload.description_en = changes.description_en;
      if (typeof changes.name_fr === 'string') payload.name_fr = changes.name_fr;
      if (typeof changes.name_en === 'string') payload.name_en = changes.name_en;
      if (typeof changes.slug === 'string') payload.slug = changes.slug;
      if (typeof changes.material_fr === 'string') payload.material_fr = changes.material_fr;
      if (typeof changes.material_en === 'string') payload.material_en = changes.material_en;
      if (typeof changes.care_fr === 'string') payload.care_fr = changes.care_fr;
      if (typeof changes.care_en === 'string') payload.care_en = changes.care_en;
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });
    }
    // Update stock via variant helper if provided
    if (typeof changes.stock === 'number') {
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ action: "stock", id: p.id, slug: p.slug, stock: changes.stock }),
      });
    }
    load();
  };

  const onUpload = async (p: any, file: File, kind: "cover" | "gallery") => {
    const form = new FormData();
    form.append("file", file);
    form.append("productId", p.id);
    form.append("slug", p.slug);
    form.append("kind", kind);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { ...authHeader },
      body: form,
    });
    if (res.ok) load();
  };

  return (
    <div>
      {loading && <div className="py-10">{t('admin.products.loading', 'Chargement...')}</div>}
      {error && <div className="py-4 text-red-600">{error}</div>}
      {!loading && (
        <div className="overflow-x-auto border rounded">
          <div className="p-4 border-b flex justify-between items-center bg-nubia-cream/40">
            <div className="font-semibold">{t('admin.products.title', 'Gestion des Produits')}</div>
            <a
              href={`/fr/admin/products/new`}
              className="px-4 py-2 bg-nubia-gold text-nubia-black rounded-lg hover:bg-nubia-gold/90 transition-colors flex items-center gap-2"
            >
              ➕ {t('admin.products.new.button', 'Nouveau Produit')}
            </a>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-nubia-cream">
              <tr>
                <th className="text-left p-3">{t('admin.products.table.name_fr', 'Nom FR')}</th>
                <th className="text-left p-3">{t('admin.products.table.name_en', 'Nom EN')}</th>
                <th className="text-left p-3">{t('admin.products.table.slug', 'Slug')}</th>
                <th className="text-left p-3">{t('admin.products.table.category', 'Catégorie')}</th>
                <th className="text-left p-3">{t('admin.products.table.price', 'Prix')}</th>
                <th className="text-left p-3">{t('admin.products.table.original', 'Original')}</th>
                <th className="text-left p-3">{t('admin.products.table.stock', 'Stock')}</th>
                <th className="text-left p-3">{t('admin.products.table.in_stock', 'En Stock')}</th>
                <th className="text-left p-3">{t('admin.products.table.desc_fr', 'Desc FR')}</th>
                <th className="text-left p-3">{t('admin.products.table.desc_en', 'Desc EN')}</th>
                <th className="text-left p-3">{t('admin.products.table.material_fr', 'Matière FR')}</th>
                <th className="text-left p-3">{t('admin.products.table.material_en', 'Matière EN')}</th>
                <th className="text-left p-3">{t('admin.products.table.care_fr', 'Entretien FR')}</th>
                <th className="text-left p-3">{t('admin.products.table.care_en', 'Entretien EN')}</th>
                <th className="text-left p-3">{t('admin.products.table.sizes', 'Tailles')}</th>
                <th className="text-left p-3">{t('admin.products.table.colors', 'Couleurs')}</th>
                <th className="text-left p-3">{t('admin.products.table.images', 'Images')}</th>
                <th className="text-left p-3">{t('admin.products.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 w-56"><input className="border px-2 py-1 rounded w-full" defaultValue={p.name_fr || ''} onChange={(e) => setEdit(p.id, "name_fr", e.target.value)} /></td>
                  <td className="p-3 w-56"><input className="border px-2 py-1 rounded w-full" defaultValue={p.name_en || ''} onChange={(e) => setEdit(p.id, "name_en", e.target.value)} /></td>
                  <td className="p-3 w-48"><input className="border px-2 py-1 rounded w-full" defaultValue={p.slug} onChange={(e) => setEdit(p.id, "slug", e.target.value)} /></td>
                  <td className="p-3 w-48">
                    <input className="border px-2 py-1 rounded w-full" list="categories-list" defaultValue={p.category || ''} onChange={(e) => setEdit(p.id, "category", e.target.value)} />
                  </td>
                  <td className="p-3">
                    <input type="number" className="border px-2 py-1 rounded w-28" defaultValue={p.price} onChange={(e) => setEdit(p.id, "price", Number(e.target.value))} />
                  </td>
                  <td className="p-3">
                    <input type="number" className="border px-2 py-1 rounded w-28" defaultValue={p.originalPrice ?? ''} onChange={(e) => setEdit(p.id, "originalPrice", Number(e.target.value))} />
                  </td>
                  <td className="p-3">
                    <input type="number" className="border px-2 py-1 rounded w-24" defaultValue={p.stock ?? 0} onChange={(e) => setEdit(p.id, "stock", Number(e.target.value))} />
                  </td>
                  <td className="p-3">
                    <input type="checkbox" defaultChecked={p.inStock} onChange={(e) => setEdit(p.id, "inStock", e.target.checked)} />
                  </td>
                  <td className="p-3 w-64">
                    <textarea className="border px-2 py-1 rounded w-full min-h-[72px]" defaultValue={p.description_fr || ''} onChange={(e) => setEdit(p.id, "description_fr", e.target.value)} />
                  </td>
                  <td className="p-3 w-64">
                    <textarea className="border px-2 py-1 rounded w-full min-h-[72px]" defaultValue={p.description_en || ''} onChange={(e) => setEdit(p.id, "description_en", e.target.value)} />
                  </td>
                  <td className="p-3 w-48">
                    <input className="border px-2 py-1 rounded w-full" defaultValue={p.material_fr || ''} onChange={(e) => setEdit(p.id, "material_fr", e.target.value)} />
                  </td>
                  <td className="p-3 w-48">
                    <input className="border px-2 py-1 rounded w-full" defaultValue={p.material_en || ''} onChange={(e) => setEdit(p.id, "material_en", e.target.value)} />
                  </td>
                  <td className="p-3 w-48">
                    <input className="border px-2 py-1 rounded w-full" defaultValue={p.care_fr || ''} onChange={(e) => setEdit(p.id, "care_fr", e.target.value)} />
                  </td>
                  <td className="p-3 w-48">
                    <input className="border px-2 py-1 rounded w-full" defaultValue={p.care_en || ''} onChange={(e) => setEdit(p.id, "care_en", e.target.value)} />
                  </td>
                  <td className="p-3 w-48">
                    <input className="border px-2 py-1 rounded w-full" placeholder={t('admin.products.form.sizes', 'S,M,L')} defaultValue={Array.isArray(p.sizes) ? p.sizes.join(',') : ''} onChange={(e) => setEdit(p.id, "sizes", e.target.value)} />
                  </td>
                  <td className="p-3 w-48">
                    <input className="border px-2 py-1 rounded w-full" placeholder={t('admin.products.form.colors', 'Noir,Or')} defaultValue={Array.isArray(p.colors) ? p.colors.join(',') : ''} onChange={(e) => setEdit(p.id, "colors", e.target.value)} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs">
                        {t('admin.products.upload.cover', 'Couverture')}
                        <input type="file" accept="image/*" className="block text-xs" onChange={(e) => e.target.files && onUpload(p, e.target.files[0], "cover")} />
                      </label>
                      <label className="text-xs">
                        {t('admin.products.upload.gallery', 'Galerie')}
                        <input type="file" accept="image/*" multiple className="block text-xs" onChange={async (e) => {
                          if (!e.target.files) return;
                          for (const f of Array.from(e.target.files)) await onUpload(p, f, "gallery");
                        }} />
                      </label>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 border rounded" onClick={() => save(p)}>{t('admin.products.save', 'Enregistrer')}</button>
                      <button className="px-3 py-1 border rounded text-red-600" onClick={async () => {
                        await fetch('/api/admin/products', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...authHeader },
                          body: JSON.stringify({ action: 'delete', id: p.id }),
                        });
                        load();
                      }}>{t('admin.products.delete', 'Supprimer')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
