'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Package, AlertCircle, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductImage {
    id?: string;
    url: string;
    position: number;
    alt?: string;
}

interface Product {
    id: string;
    slug: string;
    name: string;
    name_fr: string;
    name_en: string;
    description_fr?: string;
    description_en?: string;
    price: number;
    stock: number;
    inStock: boolean;
    image?: string;
    image_url?: string;
    category?: string;
    product_images?: ProductImage[];
}

interface EditFormData {
    name_fr: string;
    name_en: string;
    description_fr: string;
    description_en: string;
    price: number;
    stock: number;
    inStock: boolean;
}

export default function AdminProductsPage() {
    const router = useRouter();
    const { locale } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Modal d'édition
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({
        name_fr: '',
        name_en: '',
        description_fr: '',
        description_en: '',
        price: 0,
        stock: 0,
        inStock: true
    });
    const [saving, setSaving] = useState(false);

    // Images
    const [productImages, setProductImages] = useState<ProductImage[]>([]);
    const [uploadingImage, setUploadingImage] = useState<number | null>(null);
    const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    // Suppression
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

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            name_fr: product.name_fr || product.name || '',
            name_en: product.name_en || '',
            description_fr: product.description_fr || '',
            description_en: product.description_en || '',
            price: product.price || 0,
            stock: product.stock || 0,
            inStock: product.inStock ?? true
        });

        // Charger les images existantes
        const images: ProductImage[] = [];
        if (product.product_images && product.product_images.length > 0) {
            // Trier par position
            const sorted = [...product.product_images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            sorted.forEach((img, idx) => {
                if (idx < 3) {
                    images[idx] = { ...img, position: idx };
                }
            });
        }
        // Remplir les positions manquantes
        for (let i = 0; i < 3; i++) {
            if (!images[i]) {
                images[i] = { url: '', position: i };
            }
        }
        setProductImages(images);
    };

    const closeEditModal = () => {
        setEditingProduct(null);
        setEditForm({
            name_fr: '',
            name_en: '',
            description_fr: '',
            description_en: '',
            price: 0,
            stock: 0,
            inStock: true
        });
        setProductImages([]);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, position: number) => {
        const file = e.target.files?.[0];
        if (!file || !editingProduct) return;

        setUploadingImage(position);

        try {
            const token = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('productId', editingProduct.id);
            formData.append('slug', editingProduct.slug);
            formData.append('position', String(position));
            formData.append('kind', position === 0 ? 'cover' : 'gallery');

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Erreur upload');

            const data = await res.json();

            // Mettre à jour l'aperçu local
            const newImages = [...productImages];
            newImages[position] = {
                url: data.url || URL.createObjectURL(file),
                position,
                id: data.id
            };
            setProductImages(newImages);

            setSuccess('Image téléchargée !');
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: any) {
            setError('Erreur lors du téléchargement: ' + err.message);
        } finally {
            setUploadingImage(null);
        }
    };

    const saveEdit = async () => {
        if (!editingProduct) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');

            // Sauvegarder les infos du produit
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'update',
                    id: editingProduct.id,
                    name: editForm.name_fr,
                    name_fr: editForm.name_fr,
                    name_en: editForm.name_en,
                    description_fr: editForm.description_fr,
                    description_en: editForm.description_en,
                    price: editForm.price,
                    inStock: editForm.inStock
                })
            });

            if (!res.ok) throw new Error('Erreur de sauvegarde');

            // Mettre à jour le stock
            await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'stock',
                    id: editingProduct.id,
                    slug: editingProduct.slug,
                    stock: editForm.stock
                })
            });

            setSuccess('Produit modifié avec succès !');
            setTimeout(() => setSuccess(null), 3000);

            // Recharger les produits
            await loadProducts();
            closeEditModal();
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
                body: JSON.stringify({ action: 'delete', id })
            });

            if (!res.ok) throw new Error('Erreur de suppression');

            setSuccess('Produit supprimé !');
            setTimeout(() => setSuccess(null), 3000);

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

            setProducts(products.map(p =>
                p.id === id ? { ...p, stock: newStock } : p
            ));
        } catch (err) {
            console.error('Stock update error:', err);
        }
    };

    const getProductMainImage = (product: Product) => {
        if (product.product_images && product.product_images.length > 0) {
            const sorted = [...product.product_images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            return sorted[0]?.url;
        }
        return product.image || product.image_url;
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
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/${locale}/admin/dashboard`} className="p-2 hover:bg-gray-100 rounded-lg">
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">📦 Mes Produits</h1>
                                <p className="text-gray-500 text-sm">{products.length} produit(s)</p>
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
                        <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
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
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {getProductMainImage(product) ? (
                                                    <img
                                                        src={getProductMainImage(product)}
                                                        alt={product.name}
                                                        className="w-12 h-12 object-cover rounded-lg border"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <Package size={20} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{product.name_fr || product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.category || 'Sans catégorie'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-semibold">
                                            {product.price?.toLocaleString('fr-FR')}
                                        </td>
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                value={product.stock || 0}
                                                onChange={(e) => updateStock(product.id, Number(e.target.value))}
                                                className="border rounded px-2 py-1 w-20 text-center hover:border-nubia-gold focus:border-nubia-gold focus:outline-none"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {product.inStock ? '✓ En stock' : '✗ Épuisé'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {deleteConfirm === product.id ? (
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
                                                            onClick={() => openEditModal(product)}
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
                        <li>• <strong>Modifier le stock</strong> : Cliquez sur le nombre dans la colonne "Stock"</li>
                        <li>• <strong>Modifier un produit</strong> : Cliquez sur ✏️ pour ouvrir le formulaire complet</li>
                        <li>• <strong>Changer les images</strong> : Dans le formulaire, cliquez sur l'image à changer</li>
                        <li>• <strong>Supprimer</strong> : Cliquez sur 🗑️ puis confirmez</li>
                    </ul>
                </div>
            </div>

            {/* Modal d'édition */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header modal */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">✏️ Modifier le produit</h2>
                            <button onClick={closeEditModal} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Images */}
                            <div>
                                <label className="block font-semibold mb-3">📸 Images du produit</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[0, 1, 2].map((position) => (
                                        <div key={position} className="relative">
                                            <input
                                                type="file"
                                                ref={fileInputRefs[position]}
                                                onChange={(e) => handleImageUpload(e, position)}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRefs[position].current?.click()}
                                                disabled={uploadingImage === position}
                                                className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-nubia-gold transition-colors overflow-hidden relative group"
                                            >
                                                {productImages[position]?.url ? (
                                                    <>
                                                        <img
                                                            src={productImages[position].url}
                                                            alt={`Image ${position + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Upload className="text-white" size={24} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                        {uploadingImage === position ? (
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nubia-gold"></div>
                                                        ) : (
                                                            <>
                                                                <ImageIcon size={32} />
                                                                <span className="text-xs mt-1">Cliquer</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                            <p className="text-xs text-center text-gray-500 mt-1">
                                                {position === 0 ? 'Face' : position === 1 ? 'Dos' : 'Détail'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nom FR */}
                            <div>
                                <label className="block font-semibold mb-2">🇫🇷 Nom (Français) *</label>
                                <input
                                    type="text"
                                    value={editForm.name_fr}
                                    onChange={(e) => setEditForm({ ...editForm, name_fr: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 focus:border-nubia-gold focus:outline-none"
                                    placeholder="Nom du produit en français"
                                />
                            </div>

                            {/* Nom EN */}
                            <div>
                                <label className="block font-semibold mb-2">🇬🇧 Nom (Anglais)</label>
                                <input
                                    type="text"
                                    value={editForm.name_en}
                                    onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 focus:border-nubia-gold focus:outline-none"
                                    placeholder="Product name in English"
                                />
                            </div>

                            {/* Description FR */}
                            <div>
                                <label className="block font-semibold mb-2">🇫🇷 Description (Français)</label>
                                <textarea
                                    value={editForm.description_fr}
                                    onChange={(e) => setEditForm({ ...editForm, description_fr: e.target.value })}
                                    rows={3}
                                    className="w-full border rounded-lg px-4 py-2 focus:border-nubia-gold focus:outline-none resize-none"
                                    placeholder="Description du produit en français..."
                                />
                            </div>

                            {/* Description EN */}
                            <div>
                                <label className="block font-semibold mb-2">🇬🇧 Description (Anglais)</label>
                                <textarea
                                    value={editForm.description_en}
                                    onChange={(e) => setEditForm({ ...editForm, description_en: e.target.value })}
                                    rows={3}
                                    className="w-full border rounded-lg px-4 py-2 focus:border-nubia-gold focus:outline-none resize-none"
                                    placeholder="Product description in English..."
                                />
                            </div>

                            {/* Prix et Stock */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold mb-2">💰 Prix (FCFA)</label>
                                    <input
                                        type="number"
                                        value={editForm.price}
                                        onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                        className="w-full border rounded-lg px-4 py-2 focus:border-nubia-gold focus:outline-none"
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold mb-2">📦 Stock</label>
                                    <input
                                        type="number"
                                        value={editForm.stock}
                                        onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                        className="w-full border rounded-lg px-4 py-2 focus:border-nubia-gold focus:outline-none"
                                        min={0}
                                    />
                                </div>
                            </div>

                            {/* En stock */}
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.inStock}
                                        onChange={(e) => setEditForm({ ...editForm, inStock: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300"
                                    />
                                    <span className="font-semibold">✓ Produit disponible à la vente</span>
                                </label>
                            </div>
                        </div>

                        {/* Footer modal */}
                        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={closeEditModal}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="px-6 py-2 bg-nubia-gold text-black font-semibold rounded-lg hover:bg-nubia-gold/90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Enregistrer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
