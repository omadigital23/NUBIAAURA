'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Star, Trash2, User, Package, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    products: {
        id: string;
        name_fr: string;
        name_en: string;
        slug: string;
        image_url: string | null;
    } | null;
    users: {
        id: string;
        email: string;
        full_name: string | null;
    } | null;
}

export default function AdminReviewsPage() {
    const router = useRouter();
    const { t, locale } = useTranslation();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('admin_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    useEffect(() => {
        loadReviews(page);
        // loadReviews is scoped to filter changes here; pagination calls it explicitly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus, filterRating]);

    const loadReviews = async (pageNum: number = page) => {
        setLoading(true);
        try {
            let url = `/api/admin/reviews?page=${pageNum}&limit=${limit}&t=${Date.now()}`;
            if (filterStatus !== 'all') {
                url += `&status=${filterStatus}`;
            }

            const res = await fetch(url, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            
            // Si on a un filterRating local, on le gère côté client
            // Le backend ne filtre pas encore par note
            setReviews(data.reviews || []);
            setTotalCount(data.count || 0);
        } catch (error) {
            console.error('Error loading reviews:', error);
            setError(t('admin.reviews.error_loading', 'Erreur lors du chargement des avis'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
                setSuccess(t('admin.reviews.status_updated', 'Statut mis à jour'));
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(t('admin.reviews.error_update', 'Erreur lors de la mise à jour'));
            }
        } catch (error) {
            console.error('Error updating review status:', error);
            setError(t('admin.reviews.error_update', 'Erreur lors de la mise à jour'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.')) return;

        try {
            const res = await fetch(`/api/admin/reviews?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                setReviews(reviews.filter(r => r.id !== id));
                setSuccess(t('admin.reviews.deleted', 'Avis supprimé avec succès'));
                setTimeout(() => setSuccess(null), 3000);
                setTotalCount(prev => prev - 1);
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            setError(t('admin.reviews.error_delete', 'Erreur lors de la suppression'));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        );
    };

    const filteredReviews = filterRating
        ? reviews.filter(r => r.rating === filterRating)
        : reviews;

    const ratingStats = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0';

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.push(`/${locale}/admin/dashboard`)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-nubia-black">{t('admin.reviews.title', 'Gestion des Avis')}</h1>
                            <p className="text-gray-600 mt-1">{t('admin.reviews.subtitle', 'Modérez les avis clients sur vos produits')}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-6">
                        {['all', 'pending', 'approved', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => {
                                    setFilterStatus(status);
                                    setPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filterStatus === status 
                                    ? 'bg-nubia-gold text-black' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {status === 'all' && t('admin.reviews.status_all', 'Tous')}
                                {status === 'pending' && t('admin.reviews.status_pending', 'En attente')}
                                {status === 'approved' && t('admin.reviews.status_approved', 'Approuvés')}
                                {status === 'rejected' && t('admin.reviews.status_rejected', 'Rejetés')}
                            </button>
                        ))}
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                            <AlertCircle size={20} />
                            {error}
                            <button onClick={() => setError(null)} className="ml-auto underline">Fermer</button>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                            {success}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-xl shadow-sm col-span-2">
                            <div className="text-3xl font-bold text-nubia-gold">{averageRating}</div>
                            <div className="flex items-center gap-1 mt-1">
                                {renderStars(Math.round(Number(averageRating)))}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">{reviews.length} avis au total</div>
                        </div>
                        {[5, 4, 3, 2].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                                className={`bg-white p-4 rounded-xl shadow-sm text-center transition-all ${filterRating === rating ? 'ring-2 ring-nubia-gold' : ''
                                    }`}
                            >
                                <div className="text-2xl font-bold">{ratingStats[rating as keyof typeof ratingStats]}</div>
                                <div className="flex justify-center mt-1">{renderStars(rating)}</div>
                            </button>
                        ))}
                    </div>

                    {/* Reviews List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nubia-gold"></div>
                            <p className="mt-4 text-gray-600">Chargement...</p>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">
                                {filterRating ? `Aucun avis avec ${filterRating} étoile(s)` : 'Aucun avis pour le moment'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredReviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            {/* Product Info */}
                                            <div className="flex items-center gap-3 mb-3">
                                                {review.products?.image_url ? (
                                                    <img
                                                        src={review.products.image_url}
                                                        alt={review.products.name_fr}
                                                        className="w-12 h-12 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <Package size={20} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {locale === 'fr' ? review.products?.name_fr : review.products?.name_en}
                                                    </h3>
                                                    {renderStars(review.rating)}
                                                </div>
                                            </div>

                                            {/* Review Content */}
                                            {review.title && (
                                                <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>
                                            )}
                                            {review.comment && (
                                                <p className="text-gray-600 mb-3">{review.comment}</p>
                                            )}

                                            {/* User & Date */}
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {review.users?.full_name || review.users?.email || 'Anonyme'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {formatDate(review.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                {review.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                                                        className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        {t('admin.reviews.approve', 'Approuver')}
                                                    </button>
                                                )}
                                                {review.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(review.id, 'rejected')}
                                                        className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        {t('admin.reviews.reject', 'Rejeter')}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(review.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('admin.reviews.delete', 'Supprimer')}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {!loading && totalCount > limit && (
                        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
                            <div className="text-sm text-gray-500">
                                {t('admin.orders.showing', 'Affichage')} {((page - 1) * limit) + 1} - {Math.min(page * limit, totalCount)} {t('admin.orders.of', 'sur')} {totalCount} {t('admin.orders.results', 'résultats')}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => {
                                        setPage(p => p - 1);
                                        loadReviews(page - 1);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('admin.orders.prev', 'Précédent')}
                                </button>
                                <button
                                    disabled={page * limit >= totalCount}
                                    onClick={() => {
                                        setPage(p => p + 1);
                                        loadReviews(page + 1);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('admin.orders.next', 'Suivant')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filter indicator */}
                    {filterRating && (
                        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-nubia-black text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                            <span>Filtré: {filterRating} étoile(s)</span>
                            <button
                                onClick={() => setFilterRating(null)}
                                className="ml-2 p-1 hover:bg-white/20 rounded-full"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
