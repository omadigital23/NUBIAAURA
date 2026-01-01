'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Package, AlertCircle, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Product {
    id: string;
    slug: string;
    name: string;
    name_fr: string;
    name_en: string;
    price: number;
    stock: number;
    inStock: boolean;
    image?: string;
    image_url?: string;
    category?: string;
}

export default function AdminProductsPage() {
    const router = useRouter();
    const { locale } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // État pour l'édition inline
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [saving, setSaving] = useState(false);

    // État pour la confirmation de suppression
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push(`/${locale}/admin/login`);
            return;
        }
        loadProducts();
    }, [locale, router]);

    const loadProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Erreur de chargement');

            const data = await res.json();
            setProducts(data.products || data.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setEditForm({
            name_fr: product.name_fr || product.name,
            price: product.price,
            stock: product.stock,
            inStock: product.inStock
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'update',
                    id: editingId,
                    name: editForm.name_fr,
                    name_fr: editForm.name_fr,
                    price: editForm.price,
                    stock: editForm.stock,
                    inStock: editForm.inStock
                })
            });

            if (!res.ok) throw new Error('Erreur de sauvegarde');

            setSuccess('Produit modifié avec succès !');
            setTimeout(() => setSuccess(null), 3000);

            // Mise à jour locale
            setProducts(products.map(p =>
                p.id === editingId
                    ? { ...p, ...editForm, name: editForm.name_fr || p.name }
                    : p
            ));

            cancelEdit();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'delete',
                    id
                })
            });

            if (!res.ok) throw new Error('Erreur de suppression');

            setSuccess('Produit supprimé !');
            setTimeout(() => setSuccess(null), 3000);

            // Suppression locale
            setProducts(products.filter(p => p.id !== id));
            setDeleteConfirm(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const updateStock = async (id: string, newStock: number) => {
        try {
            const token = localStorage.getItem('admin_token');
            const product = products.find(p => p.id === id);

            await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'stock',
                    id,
                    slug: product?.slug,
                    stock: newStock
                })
            });

            // Mise à jour locale
            setProducts(products.map(p =>
                p.id === id ? { ...p, stock: newStock } : p
            ));
        } catch (err) {
            console.error('Stock update error:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nubia-gold mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des produits...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header simple */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/${locale}/admin/dashboard`}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    📦 Mes Produits
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {products.length} produit(s)
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/${locale}/admin/products/new`}
                            className="flex items-center gap-2 px-4 py-2 bg-nubia-gold text-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition"
                        >
                            <Plus size={20} />
                            Ajouter un produit
                        </Link>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="max-w-6xl mx-auto px-4 pt-4">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X size={16} />
                        </button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                        <Check size={20} />
                        {success}
                    </div>
                )}
            </div>

            {/* Liste des produits */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {products.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border">
                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">Aucun produit pour le moment</p>
                        <Link
                            href={`/${locale}/admin/products/new`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-nubia-gold text-black rounded-lg"
                        >
                            <Plus size={20} />
                            Ajouter mon premier produit
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-gray-700">Produit</th>
                                    <th className="text-right p-4 font-semibold text-gray-700">Prix (FCFA)</th>
                                    <th className="text-center p-4 font-semibold text-gray-700">Stock</th>
                                    <th className="text-center p-4 font-semibold text-gray-700">Statut</th>
                                    <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-b hover:bg-gray-50">
                                        {/* Produit */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {(product.image || product.image_url) ? (
                                                    <img
                                                        src={product.image || product.image_url}
                                                        alt={product.name}
                                                        className="w-12 h-12 object-cover rounded-lg border"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <Package size={20} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    {editingId === product.id ? (
                                                        <input
                                                            type="text"
                                                            value={editForm.name_fr || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, name_fr: e.target.value })}
                                                            className="border rounded px-2 py-1 w-full"
                                                        />
                                                    ) : (
                                                        <p className="font-medium text-gray-900">
                                                            {product.name_fr || product.name}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">{product.category || 'Sans catégorie'}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Prix */}
                                        <td className="p-4 text-right">
                                            {editingId === product.id ? (
                                                <input
                                                    type="number"
                                                    value={editForm.price || 0}
                                                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                    className="border rounded px-2 py-1 w-24 text-right"
                                                />
                                            ) : (
                                                <span className="font-semibold">
                                                    {product.price?.toLocaleString('fr-FR')}
                                                </span>
                                            )}
                                        </td>

                                        {/* Stock */}
                                        <td className="p-4 text-center">
                                            {editingId === product.id ? (
                                                <input
                                                    type="number"
                                                    value={editForm.stock || 0}
                                                    onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                                    className="border rounded px-2 py-1 w-20 text-center"
                                                    min={0}
                                                />
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={product.stock || 0}
                                                    onChange={(e) => updateStock(product.id, Number(e.target.value))}
                                                    className="border rounded px-2 py-1 w-20 text-center hover:border-nubia-gold focus:border-nubia-gold focus:outline-none"
                                                    min={0}
                                                />
                                            )}
                                        </td>

                                        {/* Statut */}
                                        <td className="p-4 text-center">
                                            {editingId === product.id ? (
                                                <label className="flex items-center justify-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.inStock || false}
                                                        onChange={(e) => setEditForm({ ...editForm, inStock: e.target.checked })}
                                                        className="w-5 h-5"
                                                    />
                                                    <span className="text-sm">En stock</span>
                                                </label>
                                            ) : (
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${product.inStock
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {product.inStock ? '✓ En stock' : '✗ Épuisé'}
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {editingId === product.id ? (
                                                    <>
                                                        <button
                                                            onClick={saveEdit}
                                                            disabled={saving}
                                                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                                                            title="Enregistrer"
                                                        >
                                                            <Save size={18} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                                            title="Annuler"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : deleteConfirm === product.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => deleteProduct(product.id)}
                                                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                                        >
                                                            Confirmer
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                                                        >
                                                            Annuler
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(product)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="Modifier"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(product.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Aide */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">💡 Aide rapide</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Modifier le stock</strong> : Cliquez directement sur le nombre dans la colonne "Stock"</li>
                        <li>• <strong>Modifier un produit</strong> : Cliquez sur l'icône crayon ✏️</li>
                        <li>• <strong>Supprimer</strong> : Cliquez sur la corbeille 🗑️ puis confirmez</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
