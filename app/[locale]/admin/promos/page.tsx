'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight, Calendar, Percent, DollarSign, X, Save } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface PromoCode {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    max_discount: number | null;
    max_uses: number | null;
    current_uses: number;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
    description: string | null;
    created_at: string;
}

interface NewPromoCode {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    max_discount: number | null;
    max_uses: number | null;
    valid_until: string;
    description: string;
}

export default function AdminPromosPage() {
    const router = useRouter();
    const { locale } = useTranslation();
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [newPromo, setNewPromo] = useState<NewPromoCode>({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 0,
        max_discount: null,
        max_uses: null,
        valid_until: '',
        description: ''
    });

    const getAuthHeaders = () => {
        const credentials = btoa('nubiaaura:Paty2025!');
        return {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        };
    };

    useEffect(() => {
        loadPromoCodes();
    }, []);

    const loadPromoCodes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/promos', {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setPromoCodes(data.promoCodes || []);
        } catch (error) {
            console.error('Error loading promo codes:', error);
            setError('Erreur lors du chargement des codes promo');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newPromo.code) {
            setError('Le code est requis');
            return;
        }

        try {
            const res = await fetch('/api/admin/promos', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newPromo)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error === 'Code already exists' ? 'Ce code existe déjà' : data.error);
                return;
            }

            setPromoCodes([data.promoCode, ...promoCodes]);
            setShowCreateForm(false);
            setNewPromo({
                code: '',
                discount_type: 'percentage',
                discount_value: 10,
                min_order_amount: 0,
                max_discount: null,
                max_uses: null,
                valid_until: '',
                description: ''
            });
            setSuccess('Code promo créé avec succès');
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error creating promo:', error);
            setError('Erreur lors de la création');
        }
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const res = await fetch('/api/admin/promos', {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, is_active: !currentActive })
            });

            if (res.ok) {
                setPromoCodes(promoCodes.map(p =>
                    p.id === id ? { ...p, is_active: !currentActive } : p
                ));
            }
        } catch (error) {
            console.error('Error toggling promo:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) return;

        try {
            const res = await fetch(`/api/admin/promos?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                setPromoCodes(promoCodes.filter(p => p.id !== id));
                setSuccess('Code promo supprimé');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (error) {
            console.error('Error deleting promo:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const isExpired = (validUntil: string | null) => {
        if (!validUntil) return false;
        return new Date(validUntil) < new Date();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push(`/${locale}/admin/dashboard`)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-nubia-black">Gestion des Codes Promo</h1>
                                <p className="text-gray-600 mt-1">Créez et gérez vos codes de réduction</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 bg-nubia-gold text-nubia-black px-4 py-2 rounded-lg hover:bg-nubia-gold/90 transition-colors font-medium"
                        >
                            <Plus size={20} />
                            Nouveau Code
                        </button>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                            {error}
                            <button onClick={() => setError(null)} className="ml-4 underline">Fermer</button>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                            {success}
                        </div>
                    )}

                    {/* Create Form Modal */}
                    {showCreateForm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Nouveau Code Promo</h2>
                                    <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                                        <input
                                            type="text"
                                            value={newPromo.code}
                                            onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                                            placeholder="Ex: BIENVENUE20"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nubia-gold focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type de réduction</label>
                                            <select
                                                value={newPromo.discount_type}
                                                onChange={(e) => setNewPromo({ ...newPromo, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nubia-gold focus:border-transparent"
                                            >
                                                <option value="percentage">Pourcentage (%)</option>
                                                <option value="fixed">Montant fixe (FCFA)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur *</label>
                                            <input
                                                type="number"
                                                value={newPromo.discount_value}
                                                onChange={(e) => setNewPromo({ ...newPromo, discount_value: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nubia-gold focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Montant min. commande</label>
                                            <input
                                                type="number"
                                                value={newPromo.min_order_amount}
                                                onChange={(e) => setNewPromo({ ...newPromo, min_order_amount: Number(e.target.value) })}
                                                placeholder="0"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nubia-gold focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Réduction max.</label>
                                            <input
                                                type="number"
                                                value={newPromo.max_discount || ''}
                                                onChange={(e) => setNewPromo({ ...newPromo, max_discount: e.target.value ? Number(e.target.value) : null })}
                                                placeholder="Illimité"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nubia-gold focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Utilisations max.</label>
                                            <input
                                                type="number"
                                                value={newPromo.max_uses || ''}
                                                onChange={(e) => setNewPromo({ ...newPromo, max_uses: e.target.value ? Number(e.target.value) : null })}
                                                placeholder="Illimité"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nubia-gold focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                                            <input
                                                type="date"
                                                value={newPromo.valid_until}
                                                onChange={(e) => setNewPromo({ ...newPromo, valid_until: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nubia-gold focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={newPromo.description}
                                            onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                                            placeholder="Description interne du code"
                                            rows={2}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nubia-gold focus:border-transparent"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            onClick={() => setShowCreateForm(false)}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleCreate}
                                            className="flex items-center gap-2 bg-nubia-gold text-nubia-black px-4 py-2 rounded-lg hover:bg-nubia-gold/90 transition-colors font-medium"
                                        >
                                            <Save size={18} />
                                            Créer le Code
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Promo Codes List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nubia-gold"></div>
                            <p className="mt-4 text-gray-600">Chargement...</p>
                        </div>
                    ) : promoCodes.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                            <Percent size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">Aucun code promo</p>
                            <p className="text-gray-400 text-sm mt-1">Créez votre premier code promo</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réduction</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conditions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisations</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validité</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {promoCodes.map((promo) => (
                                        <tr key={promo.id} className={`hover:bg-gray-50 ${isExpired(promo.valid_until) ? 'opacity-60' : ''}`}>
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-bold text-lg bg-gray-100 px-3 py-1 rounded">
                                                    {promo.code}
                                                </span>
                                                {promo.description && (
                                                    <p className="text-xs text-gray-500 mt-1">{promo.description}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    {promo.discount_type === 'percentage' ? (
                                                        <><Percent size={16} className="text-nubia-gold" /> {promo.discount_value}%</>
                                                    ) : (
                                                        <><DollarSign size={16} className="text-nubia-gold" /> {promo.discount_value.toLocaleString()} FCFA</>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {promo.min_order_amount > 0 && (
                                                    <div>Min: {promo.min_order_amount.toLocaleString()} FCFA</div>
                                                )}
                                                {promo.max_discount && (
                                                    <div>Max: {promo.max_discount.toLocaleString()} FCFA</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-900">{promo.current_uses}</span>
                                                <span className="text-gray-400"> / {promo.max_uses || '∞'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Calendar size={14} />
                                                    {promo.valid_until ? formatDate(promo.valid_until) : 'Sans limite'}
                                                </div>
                                                {isExpired(promo.valid_until) && (
                                                    <span className="text-xs text-red-500 font-medium">Expiré</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(promo.id, promo.is_active)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${promo.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}
                                                >
                                                    {promo.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                    {promo.is_active ? 'Actif' : 'Inactif'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(promo.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
