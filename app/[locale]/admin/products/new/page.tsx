'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Upload, X, Plus, Package, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';

interface ProductFormData {
    slug: string;
    name_fr: string;
    name_en: string;
    description_fr: string;
    description_en: string;
    material_fr: string;
    material_en: string;
    care_fr: string;
    care_en: string;
    price: number;
    originalPrice: number | null;
    category: string;
    sizes: string[];
    colors: string[];
    stock: number;
    inStock: boolean;
}

interface UploadedImage {
    file: File;
    preview: string;
    type: 'cover' | 'gallery';
}

interface Category {
    id: string;
    slug: string;
    name: string;
    name_fr: string;
    name_en: string;
}

export default function AdminProductNewPage() {
    const router = useRouter();
    const { t, locale } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [formData, setFormData] = useState<ProductFormData>({
        slug: '',
        name_fr: '',
        name_en: '',
        description_fr: '',
        description_en: '',
        material_fr: '',
        material_en: '',
        care_fr: '',
        care_en: '',
        price: 0,
        originalPrice: null,
        category: '',
        sizes: [],
        colors: [],
        stock: 10,
        inStock: true,
    });

    const [images, setImages] = useState<UploadedImage[]>([]);
    const [sizeInput, setSizeInput] = useState('');
    const [colorInput, setColorInput] = useState('');
    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push(`/${locale}/admin/login`);
            return;
        }
        loadCategories();
    }, [locale, router]);

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleNameChange = (value: string, lang: 'fr' | 'en') => {
        setFormData(prev => ({
            ...prev,
            [`name_${lang}`]: value,
            ...(lang === 'fr' && !prev.slug ? { slug: generateSlug(value) } : {}),
        }));
    };

    const addSize = () => {
        if (sizeInput.trim() && !formData.sizes.includes(sizeInput.trim())) {
            setFormData(prev => ({
                ...prev,
                sizes: [...prev.sizes, sizeInput.trim()],
            }));
            setSizeInput('');
        }
    };

    const removeSize = (size: string) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.filter(s => s !== size),
        }));
    };

    const addColor = () => {
        if (colorInput.trim() && !formData.colors.includes(colorInput.trim())) {
            setFormData(prev => ({
                ...prev,
                colors: [...prev.colors, colorInput.trim()],
            }));
            setColorInput('');
        }
    };

    const removeColor = (color: string) => {
        setFormData(prev => ({
            ...prev,
            colors: prev.colors.filter(c => c !== color),
        }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery') => {
        const files = e.target.files;
        if (!files) return;

        const newImages: UploadedImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const preview = URL.createObjectURL(file);

            if (type === 'cover') {
                // Remove existing cover
                setImages(prev => prev.filter(img => img.type !== 'cover'));
            }

            newImages.push({ file, preview, type });
        }

        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('Non authentifié');

            // Validation
            if (!formData.slug) throw new Error('Le slug est requis');
            if (!formData.name_fr) throw new Error('Le nom en français est requis');
            if (!formData.price || formData.price <= 0) throw new Error('Le prix doit être supérieur à 0');
            if (!formData.category) throw new Error('La catégorie est requise');

            // 1. Create the product
            const createRes = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'create',
                    slug: formData.slug,
                    name: formData.name_fr,
                    name_fr: formData.name_fr,
                    name_en: formData.name_en,
                    price: formData.price,
                    inStock: formData.inStock,
                }),
            });

            if (!createRes.ok) {
                const errData = await createRes.json();
                throw new Error(errData.error || 'Erreur lors de la création du produit');
            }

            const { product } = await createRes.json();
            const productId = product.id;

            // 2. Update product with all fields
            const updateRes = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'update',
                    id: productId,
                    description_fr: formData.description_fr,
                    description_en: formData.description_en,
                    material_fr: formData.material_fr,
                    material_en: formData.material_en,
                    care_fr: formData.care_fr,
                    care_en: formData.care_en,
                    category: formData.category,
                    sizes: formData.sizes,
                    colors: formData.colors,
                    originalPrice: formData.originalPrice,
                }),
            });

            if (!updateRes.ok) {
                console.error('Update error:', await updateRes.text());
            }

            // 3. Set stock
            if (formData.stock > 0) {
                await fetch('/api/admin/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        action: 'stock',
                        id: productId,
                        slug: formData.slug,
                        stock: formData.stock,
                    }),
                });
            }

            // 4. Upload images
            for (const img of images) {
                const form = new FormData();
                form.append('file', img.file);
                form.append('productId', productId);
                form.append('slug', formData.slug);
                form.append('kind', img.type);

                await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: form,
                });
            }

            setSuccess(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push(`/${locale}/admin`);
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const coverImage = images.find(img => img.type === 'cover');
    const galleryImages = images.filter(img => img.type === 'gallery');

    return (
        <div className="min-h-screen bg-nubia-white flex flex-col">
            <Header />

            <main className="flex-1 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.push(`/${locale}/admin`)}
                            className="p-2 hover:bg-nubia-gold/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} className="text-nubia-gold" />
                        </button>
                        <div>
                            <h1 className="font-playfair text-3xl font-bold text-nubia-black">
                                {t('admin.products.new.title', 'Nouveau Produit')}
                            </h1>
                            <p className="text-nubia-black/60">
                                {t('admin.products.new.subtitle', 'Créer un nouveau produit dans le catalogue')}
                            </p>
                        </div>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                            <Package size={20} />
                            {t('admin.products.new.success', 'Produit créé avec succès ! Redirection...')}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="bg-white border border-nubia-gold/10 rounded-lg p-6">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Package size={20} className="text-nubia-gold" />
                                {t('admin.products.new.basic_info', 'Informations de base')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('admin.products.form.name_fr', 'Nom (Français)')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name_fr}
                                        onChange={(e) => handleNameChange(e.target.value, 'fr')}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('admin.products.form.name_en', 'Nom (Anglais)')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name_en}
                                        onChange={(e) => handleNameChange(e.target.value, 'en')}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('admin.products.form.slug', 'Slug (URL)')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold font-mono text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('admin.products.form.category', 'Catégorie')} *
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                        required
                                    >
                                        <option value="">Sélectionner...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.slug}>
                                                {locale === 'en' ? (cat.name_en || cat.name_fr) : cat.name_fr}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-white border border-nubia-gold/10 rounded-lg p-6">
                            <h2 className="font-semibold text-lg mb-4">💰 {t('admin.products.new.pricing', 'Prix et Stock')}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('admin.products.form.price', 'Prix (FCFA)')} *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                        min={0}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('admin.products.form.original_price', 'Prix barré (optionnel)')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.originalPrice || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value ? Number(e.target.value) : null }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {t('admin.products.form.stock', 'Stock initial')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                        min={0}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.inStock}
                                            onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                                            className="w-5 h-5 rounded border-nubia-gold/20"
                                        />
                                        <span className="text-sm font-medium">{t('admin.products.form.in_stock', 'En stock')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Sizes & Colors */}
                        <div className="bg-white border border-nubia-gold/10 rounded-lg p-6">
                            <h2 className="font-semibold text-lg mb-4">🎨 {t('admin.products.new.variants', 'Tailles et Couleurs')}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">{t('admin.products.form.sizes', 'Tailles')}</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={sizeInput}
                                            onChange={(e) => setSizeInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                                            placeholder="Ex: S, M, L, XL"
                                            className="flex-1 border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                        />
                                        <button
                                            type="button"
                                            onClick={addSize}
                                            className="px-3 py-2 bg-nubia-gold text-nubia-black rounded-lg hover:bg-nubia-gold/90"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.sizes.map((size) => (
                                            <span key={size} className="inline-flex items-center gap-1 px-3 py-1 bg-nubia-gold/10 text-nubia-black rounded-full text-sm">
                                                {size}
                                                <button type="button" onClick={() => removeSize(size)} className="hover:text-red-600">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">{t('admin.products.form.colors', 'Couleurs')}</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={colorInput}
                                            onChange={(e) => setColorInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                                            placeholder="Ex: Noir, Or, Blanc"
                                            className="flex-1 border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                        />
                                        <button
                                            type="button"
                                            onClick={addColor}
                                            className="px-3 py-2 bg-nubia-gold text-nubia-black rounded-lg hover:bg-nubia-gold/90"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.colors.map((color) => (
                                            <span key={color} className="inline-flex items-center gap-1 px-3 py-1 bg-nubia-gold/10 text-nubia-black rounded-full text-sm">
                                                {color}
                                                <button type="button" onClick={() => removeColor(color)} className="hover:text-red-600">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Descriptions */}
                        <div className="bg-white border border-nubia-gold/10 rounded-lg p-6">
                            <h2 className="font-semibold text-lg mb-4">📝 {t('admin.products.new.descriptions', 'Descriptions')}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('admin.products.form.desc_fr', 'Description (FR)')}</label>
                                    <textarea
                                        value={formData.description_fr}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description_fr: e.target.value }))}
                                        rows={4}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('admin.products.form.desc_en', 'Description (EN)')}</label>
                                    <textarea
                                        value={formData.description_en}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                                        rows={4}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('admin.products.form.material_fr', 'Matière (FR)')}</label>
                                    <input
                                        type="text"
                                        value={formData.material_fr}
                                        onChange={(e) => setFormData(prev => ({ ...prev, material_fr: e.target.value }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('admin.products.form.material_en', 'Matière (EN)')}</label>
                                    <input
                                        type="text"
                                        value={formData.material_en}
                                        onChange={(e) => setFormData(prev => ({ ...prev, material_en: e.target.value }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('admin.products.form.care_fr', 'Entretien (FR)')}</label>
                                    <input
                                        type="text"
                                        value={formData.care_fr}
                                        onChange={(e) => setFormData(prev => ({ ...prev, care_fr: e.target.value }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('admin.products.form.care_en', 'Entretien (EN)')}</label>
                                    <input
                                        type="text"
                                        value={formData.care_en}
                                        onChange={(e) => setFormData(prev => ({ ...prev, care_en: e.target.value }))}
                                        className="w-full border border-nubia-gold/20 rounded-lg px-3 py-2 focus:outline-none focus:border-nubia-gold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        <div className="bg-white border border-nubia-gold/10 rounded-lg p-6">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <ImageIcon size={20} className="text-nubia-gold" />
                                {t('admin.products.new.images', 'Images du produit')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cover Image */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">{t('admin.products.upload.cover', 'Image principale')} *</label>
                                    <input
                                        type="file"
                                        ref={coverInputRef}
                                        onChange={(e) => handleImageSelect(e, 'cover')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    {coverImage ? (
                                        <div className="relative">
                                            <img
                                                src={coverImage.preview}
                                                alt="Cover"
                                                className="w-full h-48 object-cover rounded-lg border border-nubia-gold/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(images.indexOf(coverImage))}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => coverInputRef.current?.click()}
                                            className="w-full h-48 border-2 border-dashed border-nubia-gold/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-nubia-gold hover:bg-nubia-gold/5 transition-colors"
                                        >
                                            <Upload size={32} className="text-nubia-gold/60" />
                                            <span className="text-sm text-nubia-black/60">Cliquer pour ajouter</span>
                                        </button>
                                    )}
                                </div>

                                {/* Gallery Images */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">{t('admin.products.upload.gallery', 'Galerie (2 images max)')}</label>
                                    <input
                                        type="file"
                                        ref={galleryInputRef}
                                        onChange={(e) => handleImageSelect(e, 'gallery')}
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        {galleryImages.map((img, idx) => (
                                            <div key={idx} className="relative">
                                                <img
                                                    src={img.preview}
                                                    alt={`Gallery ${idx + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border border-nubia-gold/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(images.indexOf(img))}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {galleryImages.length < 2 && (
                                            <button
                                                type="button"
                                                onClick={() => galleryInputRef.current?.click()}
                                                className="h-24 border-2 border-dashed border-nubia-gold/30 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-nubia-gold hover:bg-nubia-gold/5 transition-colors"
                                            >
                                                <Plus size={20} className="text-nubia-gold/60" />
                                                <span className="text-xs text-nubia-black/60">Ajouter</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.push(`/${locale}/admin`)}
                                className="px-6 py-3 border border-nubia-gold/30 text-nubia-black rounded-lg hover:bg-nubia-gold/10 transition-colors"
                            >
                                {t('common.cancel', 'Annuler')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-nubia-gold text-nubia-black rounded-lg hover:bg-nubia-gold/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-nubia-black border-t-transparent rounded-full animate-spin" />
                                        {t('admin.products.new.creating', 'Création...')}
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        {t('admin.products.new.create', 'Créer le produit')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
