'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { StarRating } from './StarRating';
import { User, MessageSquare, ChevronDown, Send } from 'lucide-react';

interface Review {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    created_at: string;
    users: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    } | null;
}

interface ReviewStats {
    total: number;
    average: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

interface ProductReviewsProps {
    productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formRating, setFormRating] = useState(5);
    const [formTitle, setFormTitle] = useState('');
    const [formComment, setFormComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [hasReviewed, setHasReviewed] = useState(false);

    const fetchReviews = useCallback(async (pageNum: number = 1) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/reviews?productId=${productId}&page=${pageNum}&limit=5`);
            const data = await res.json();

            if (pageNum === 1) {
                setReviews(data.reviews || []);
            } else {
                setReviews(prev => [...prev, ...(data.reviews || [])]);
            }

            setStats(data.stats);
            setHasMore(pageNum < data.pagination.pages);

            // Vérifier si l'utilisateur a déjà laissé un avis
            if (user) {
                const userReview = data.reviews?.find((r: Review) => r.users?.id === user.id);
                setHasReviewed(!!userReview);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [productId, user]);

    useEffect(() => {
        fetchReviews(1);
    }, [fetchReviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) return;

        setSubmitting(true);
        setSubmitError(null);

        try {
            const token = localStorage.getItem('sb-auth-token');
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({
                    productId,
                    rating: formRating,
                    title: formTitle || undefined,
                    comment: formComment || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors de la soumission');
            }

            // Réinitialiser le formulaire et recharger les avis
            setFormRating(5);
            setFormTitle('');
            setFormComment('');
            setShowForm(false);
            setHasReviewed(true);
            await fetchReviews(1);

        } catch (error: any) {
            setSubmitError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchReviews(nextPage);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="mt-12 border-t border-nubia-gold/20 pt-12">
            <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-8">
                {t('reviews.title', 'Avis clients')}
            </h2>

            {/* Stats Section */}
            {stats && stats.total > 0 && (
                <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-nubia-cream/30 rounded-xl">
                    {/* Average Rating */}
                    <div className="text-center sm:text-left">
                        <div className="text-5xl font-bold text-nubia-gold mb-2">
                            {stats.average.toFixed(1)}
                        </div>
                        <StarRating rating={stats.average} size={24} />
                        <p className="text-sm text-nubia-black/70 mt-2">
                            {stats.total} {stats.total === 1 ? 'avis' : 'avis'}
                        </p>
                    </div>

                    {/* Distribution */}
                    <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = stats.distribution[star as keyof typeof stats.distribution];
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-sm w-8">{star}★</span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-nubia-black/50 w-8">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Write Review Button/Form */}
            <div className="mb-8">
                {!isAuthenticated ? (
                    <p className="text-nubia-black/70 text-center py-4 bg-nubia-cream/20 rounded-lg">
                        {t('reviews.login_required', 'Connectez-vous pour laisser un avis')}
                    </p>
                ) : hasReviewed ? (
                    <p className="text-green-600 text-center py-4 bg-green-50 rounded-lg">
                        ✓ {t('reviews.already_reviewed', 'Vous avez déjà laissé un avis pour ce produit')}
                    </p>
                ) : !showForm ? (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all flex items-center justify-center gap-2"
                    >
                        <MessageSquare size={20} />
                        {t('reviews.write_review', 'Écrire un avis')}
                    </button>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 bg-nubia-cream/20 rounded-xl space-y-4">
                        <h3 className="font-semibold text-lg mb-4">
                            {t('reviews.write_review', 'Écrire un avis')}
                        </h3>

                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('reviews.rating', 'Note')} *
                            </label>
                            <StarRating
                                rating={formRating}
                                interactive
                                onChange={setFormRating}
                                size={32}
                            />
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('reviews.review_title', 'Titre (optionnel)')}
                            </label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                maxLength={100}
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                                placeholder="Résumez votre avis..."
                            />
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('reviews.comment', 'Votre avis (optionnel)')}
                            </label>
                            <textarea
                                value={formComment}
                                onChange={(e) => setFormComment(e.target.value)}
                                maxLength={1000}
                                rows={4}
                                className="w-full px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold resize-none"
                                placeholder="Partagez votre expérience..."
                            />
                        </div>

                        {submitError && (
                            <p className="text-red-600 text-sm">{submitError}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-2 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-all"
                            >
                                {t('common.cancel', 'Annuler')}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? '...' : (
                                    <>
                                        <Send size={18} />
                                        {t('reviews.submit', 'Soumettre')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Reviews List */}
            {loading && reviews.length === 0 ? (
                <div className="text-center py-8 text-nubia-black/50">
                    {t('reviews.loading', 'Chargement des avis...')}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-nubia-black/50">
                    {t('reviews.no_reviews', 'Aucun avis pour le moment. Soyez le premier à donner votre avis !')}
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b border-nubia-gold/10 pb-6 last:border-0">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-nubia-gold/20 flex items-center justify-center flex-shrink-0">
                                    {review.users?.avatar_url ? (
                                        <img
                                            src={review.users.avatar_url}
                                            alt=""
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User size={20} className="text-nubia-gold" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">
                                            {review.users?.name || 'Client vérifié'}
                                        </span>
                                        <span className="text-sm text-nubia-black/50">
                                            • {formatDate(review.created_at)}
                                        </span>
                                    </div>

                                    <StarRating rating={review.rating} size={16} />

                                    {review.title && (
                                        <h4 className="font-medium mt-2">{review.title}</h4>
                                    )}

                                    {review.comment && (
                                        <p className="text-nubia-black/70 mt-2">{review.comment}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Load More */}
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="w-full py-3 text-nubia-gold font-medium hover:bg-nubia-gold/10 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronDown size={20} />
                            {loading ? 'Chargement...' : t('common.load_more', 'Voir plus d\'avis')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProductReviews;
