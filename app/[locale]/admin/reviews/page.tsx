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
    const { locale } = useTranslation();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [filterRating, setFilterRating] = useState<number | null>(null);

    const getAuthHeaders = () => {
        const credentials = btoa('nubiaaura:Paty2025!');
        return {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        };
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reviews', {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setReviews(data.reviews || []);
        } catch (error) {
            console.error('Error loading reviews:', error);
            setError('Erreur lors du chargement des avis');
        } finally {
            setLoading(false);
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
                setSuccess('Avis supprimé avec succès');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            setError('Erreur lors de la suppression');
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
                            <h1 className="text-3xl font-bold text-nubia-black">Modération des Avis</h1>
                            <p className="text-gray-600 mt-1">Gérez les avis clients sur vos produits</p>
                        </div>
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
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Supprimer cet avis"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
