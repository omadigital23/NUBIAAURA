"use client";

import { useEffect, useMemo, useState } from "react";

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
  const username = typeof window !== 'undefined' ? localStorage.getItem("admin_username") : null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nubia-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-4">Accès Refusé</h1>
          <p className="text-nubia-black/60 mb-6">Veuillez vous connecter via la page de login</p>
          <a href="/admin/login" className="bg-nubia-gold text-nubia-black px-6 py-2 rounded-lg hover:bg-nubia-gold/90">
            Aller à la connexion
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
            <h1 className="font-playfair text-3xl font-bold text-nubia-black">Admin Dashboard</h1>
            <p className="text-nubia-black/60 text-sm mt-1">Connecté en tant que: {username}</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Déconnexion
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            className={`px-4 py-2 rounded border ${tab === "orders" ? "bg-nubia-gold border-nubia-gold text-nubia-black" : "border-nubia-gold/40"}`}
            onClick={() => setTab("orders")}
          >
            Orders
          </button>
          <button
            className={`px-4 py-2 rounded border ${tab === "products" ? "bg-nubia-gold border-nubia-gold text-nubia-black" : "border-nubia-gold/40"}`}
            onClick={() => setTab("products")}
          >
            Products
          </button>
        </div>

        {tab === "orders" ? <OrdersPanel token={token} /> : <ProductsPanel token={token} />}
      </div>
    </div>
  );
}

function OrdersPanel({ token }: { token: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e: any) {
      setError(e.message || "Failed to load");
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "update_status", id, status }),
    });
    if (res.ok) load();
  };

  const deleteOrder = async (id: string) => {
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (res.ok) load();
  };

  return (
    <div>
      {loading && <div className="py-10">Loading...</div>}
      {error && <div className="py-4 text-red-600">{error}</div>}
      {!loading && (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-nubia-cream">
              <tr>
                <th className="text-left p-3">Order #</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Payment</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3">{o.order_number}</td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3">{o.payment_status}</td>
                  <td className="p-3">{o.total?.toLocaleString("fr-FR")}</td>
                  <td className="p-3 flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => updateStatus(o.id, "processing")}>Process</button>
                    <button className="px-2 py-1 border rounded" onClick={() => updateStatus(o.id, "shipped")}>Ship</button>
                    <button className="px-2 py-1 border rounded" onClick={() => updateStatus(o.id, "delivered")}>Complete</button>
                    <button className="px-2 py-1 border rounded text-red-600" onClick={() => updateStatus(o.id, "cancelled")}>Cancel</button>
                    <button className="px-2 py-1 border rounded text-red-700" onClick={() => deleteOrder(o.id)}>Delete</button>
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

function ProductsPanel({ token }: { token: string }) {
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
  }>>({});
  const [newProduct, setNewProduct] = useState<{ slug: string; price: number; category: string; name_fr?: string; name_en?: string }>({ slug: '', price: 0, category: '' });
  const [categories, setCategories] = useState<string[]>([]);

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
      setProducts(data.products || []);
      // Load categories (best-effort)
      try {
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const cats = await catRes.json();
          if (Array.isArray(cats.categories)) setCategories(cats.categories);
        }
      } catch {}
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
      {loading && <div className="py-10">Loading...</div>}
      {error && <div className="py-4 text-red-600">{error}</div>}
      {!loading && (
        <div className="overflow-x-auto border rounded">
          <div className="p-4 border-b flex flex-col gap-2 bg-nubia-cream/40">
            <div className="font-semibold">Create Product</div>
            <div className="flex flex-wrap gap-2 items-center">
              <input className="border px-2 py-1 rounded" placeholder="slug" value={newProduct.slug} onChange={(e) => setNewProduct(p => ({ ...p, slug: e.target.value }))} />
              <input type="number" className="border px-2 py-1 rounded w-28" placeholder="price" value={newProduct.price} onChange={(e) => setNewProduct(p => ({ ...p, price: Number(e.target.value) }))} />
              <input className="border px-2 py-1 rounded" placeholder="category" value={newProduct.category} onChange={(e) => setNewProduct(p => ({ ...p, category: e.target.value }))} list="categories-list" />
              <datalist id="categories-list">
                {categories.map((c) => (<option key={c} value={c} />))}
              </datalist>
              <input className="border px-2 py-1 rounded" placeholder="name_fr" value={newProduct.name_fr || ''} onChange={(e) => setNewProduct(p => ({ ...p, name_fr: e.target.value }))} />
              <input className="border px-2 py-1 rounded" placeholder="name_en" value={newProduct.name_en || ''} onChange={(e) => setNewProduct(p => ({ ...p, name_en: e.target.value }))} />
              <button className="px-3 py-1 border rounded bg-nubia-gold text-nubia-black" onClick={async () => {
                if (!newProduct.slug || !newProduct.price || !newProduct.category) return;
                await fetch('/api/admin/products', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authHeader },
                  body: JSON.stringify({ action: 'create', ...newProduct }),
                });
                setNewProduct({ slug: '', price: 0, category: '' });
                load();
              }}>Create</button>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-nubia-cream">
              <tr>
                <th className="text-left p-3">Name FR</th>
                <th className="text-left p-3">Name EN</th>
                <th className="text-left p-3">Slug</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Original</th>
                <th className="text-left p-3">Stock</th>
                <th className="text-left p-3">InStock</th>
                <th className="text-left p-3">Desc FR</th>
                <th className="text-left p-3">Desc EN</th>
                <th className="text-left p-3">Material FR</th>
                <th className="text-left p-3">Material EN</th>
                <th className="text-left p-3">Care FR</th>
                <th className="text-left p-3">Care EN</th>
                <th className="text-left p-3">Sizes</th>
                <th className="text-left p-3">Colors</th>
                <th className="text-left p-3">Images</th>
                <th className="text-left p-3">Actions</th>
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
                    <input className="border px-2 py-1 rounded w-full" placeholder="S,M,L" defaultValue={Array.isArray(p.sizes) ? p.sizes.join(',') : ''} onChange={(e) => setEdit(p.id, "sizes", e.target.value)} />
                  </td>
                  <td className="p-3 w-48">
                    <input className="border px-2 py-1 rounded w-full" placeholder="Noir,Or" defaultValue={Array.isArray(p.colors) ? p.colors.join(',') : ''} onChange={(e) => setEdit(p.id, "colors", e.target.value)} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs">
                        Cover
                        <input type="file" accept="image/*" className="block text-xs" onChange={(e) => e.target.files && onUpload(p, e.target.files[0], "cover")} />
                      </label>
                      <label className="text-xs">
                        Gallery
                        <input type="file" accept="image/*" multiple className="block text-xs" onChange={async (e) => {
                          if (!e.target.files) return;
                          for (const f of Array.from(e.target.files)) await onUpload(p, f, "gallery");
                        }} />
                      </label>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 border rounded" onClick={() => save(p)}>Save</button>
                      <button className="px-3 py-1 border rounded text-red-600" onClick={async () => {
                        await fetch('/api/admin/products', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...authHeader },
                          body: JSON.stringify({ action: 'delete', id: p.id }),
                        });
                        load();
                      }}>Delete</button>
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
