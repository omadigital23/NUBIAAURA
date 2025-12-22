'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Users, ShoppingCart, Mail, Calendar, User, Search } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    created_at: string;
    orders_count: number;
    total_spent: number;
    last_order_at: string | null;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { t, locale } = useTranslation();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push(`/${locale}/admin/login`);
            return;
        }
        loadUsers();
    }, [locale, router]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');

            // Fetch users from the stats API (which already fetches users)
            const res = await fetch('/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error('Failed to load users');
            }

            const data = await res.json();
            setUsers(data.users || []);
            setError(null);
        } catch (err: any) {
            console.error('Error loading users:', err);
            setError(err.message || 'Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter((user) => {
        const search = searchTerm.toLowerCase();
        return (
            user.email.toLowerCase().includes(search) ||
            (user.full_name && user.full_name.toLowerCase().includes(search)) ||
            (user.phone && user.phone.includes(search))
        );
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('fr-FR') + ' FCFA';
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
                            <h1 className="font-playfair text-3xl font-bold text-nubia-black">
                                {t('admin.users_management', 'Gestion des Utilisateurs')}
                            </h1>
                            <p className="text-nubia-black/60">
                                {filteredUsers.length} {t('admin.users_count', 'utilisateur(s)')}
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-nubia-black/40" size={20} />
                            <input
                                type="text"
                                placeholder={t('admin.search_users', 'Rechercher par email, nom ou téléphone...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-nubia-gold/20 rounded-lg focus:outline-none focus:border-nubia-gold"
                            />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Users className="text-blue-600" size={24} />
                                <div>
                                    <p className="text-sm text-blue-800">{t('admin.total_users', 'Total Utilisateurs')}</p>
                                    <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="text-green-600" size={24} />
                                <div>
                                    <p className="text-sm text-green-800">{t('admin.with_orders', 'Avec Commandes')}</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {users.filter(u => u.orders_count > 0).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <User className="text-purple-600" size={24} />
                                <div>
                                    <p className="text-sm text-purple-800">{t('admin.new_this_month', 'Nouveaux ce mois')}</p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {users.filter(u => {
                                            const thirtyDaysAgo = new Date();
                                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                            return new Date(u.created_at) > thirtyDaysAgo;
                                        }).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Mail className="text-orange-600" size={24} />
                                <div>
                                    <p className="text-sm text-orange-800">{t('admin.total_revenue', 'CA Total')}</p>
                                    <p className="text-xl font-bold text-orange-900">
                                        {formatCurrency(users.reduce((sum, u) => sum + u.total_spent, 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-nubia-gold border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-nubia-black/60">{t('common.loading', 'Chargement...')}</p>
                        </div>
                    ) : (
                        /* Users Table */
                        <div className="bg-white border border-nubia-gold/10 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-nubia-gold/10">
                                        <tr>
                                            <th className="text-left p-4 font-semibold text-nubia-black">
                                                {t('admin.user', 'Utilisateur')}
                                            </th>
                                            <th className="text-left p-4 font-semibold text-nubia-black">
                                                {t('admin.contact', 'Contact')}
                                            </th>
                                            <th className="text-center p-4 font-semibold text-nubia-black">
                                                {t('admin.orders', 'Commandes')}
                                            </th>
                                            <th className="text-right p-4 font-semibold text-nubia-black">
                                                {t('admin.total_spent', 'Total Dépensé')}
                                            </th>
                                            <th className="text-left p-4 font-semibold text-nubia-black">
                                                {t('admin.registration', 'Inscription')}
                                            </th>
                                            <th className="text-left p-4 font-semibold text-nubia-black">
                                                {t('admin.last_order', 'Dernière Commande')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-nubia-black/60">
                                                    {searchTerm
                                                        ? t('admin.no_users_found', 'Aucun utilisateur trouvé')
                                                        : t('admin.no_users', 'Aucun utilisateur enregistré')}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr key={user.id} className="border-t border-nubia-gold/10 hover:bg-nubia-gold/5">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-nubia-gold/20 rounded-full flex items-center justify-center">
                                                                <User size={20} className="text-nubia-gold" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-nubia-black">
                                                                    {user.full_name || t('admin.no_name', 'Non renseigné')}
                                                                </p>
                                                                <p className="text-sm text-nubia-black/60">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Mail size={14} className="text-nubia-black/40" />
                                                                <span>{user.email}</span>
                                                            </div>
                                                            {user.phone && (
                                                                <div className="flex items-center gap-2 text-sm text-nubia-black/60">
                                                                    <span>📱 {user.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${user.orders_count > 0
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {user.orders_count}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className={`font-semibold ${user.total_spent > 0 ? 'text-nubia-gold' : 'text-nubia-black/40'
                                                            }`}>
                                                            {formatCurrency(user.total_spent)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar size={14} className="text-nubia-black/40" />
                                                            <span>{formatDate(user.created_at)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {user.last_order_at ? (
                                                            <span className="text-sm">{formatDate(user.last_order_at)}</span>
                                                        ) : (
                                                            <span className="text-sm text-nubia-black/40">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
