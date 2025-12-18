import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema de validation pour soumettre un avis
const ReviewSchema = z.object({
    productId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    title: z.string().max(100).optional(),
    comment: z.string().max(1000).optional(),
});

// GET: Récupérer les avis d'un produit
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!productId) {
            return NextResponse.json(
                { error: 'productId requis' },
                { status: 400 }
            );
        }

        const offset = (page - 1) * limit;

        // Récupérer les avis avec les infos utilisateur
        const { data: reviews, error, count } = await supabase
            .from('product_reviews')
            .select(`
        id,
        rating,
        title,
        comment,
        created_at,
        users:user_id (
          id,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching reviews:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des avis' },
                { status: 500 }
            );
        }

        // Calculer les statistiques
        const { data: stats } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('product_id', productId);

        const totalReviews = stats?.length || 0;
        const averageRating = totalReviews > 0
            ? stats!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        // Distribution des notes
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats?.forEach(r => {
            distribution[r.rating as keyof typeof distribution]++;
        });

        return NextResponse.json({
            reviews: reviews || [],
            stats: {
                total: totalReviews,
                average: Math.round(averageRating * 10) / 10,
                distribution,
            },
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });

    } catch (error) {
        console.error('Reviews GET error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// POST: Soumettre un avis
export async function POST(request: NextRequest) {
    try {
        // Récupérer le token d'authentification
        const authHeader = request.headers.get('cookie');
        const accessToken = authHeader?.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1];

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Authentification requise' },
                { status: 401 }
            );
        }

        // Décoder le token pour obtenir l'utilisateur
        let tokenData;
        try {
            const decoded = JSON.parse(decodeURIComponent(accessToken));
            tokenData = decoded;
        } catch {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 401 }
            );
        }

        const userId = tokenData?.user?.id;
        if (!userId) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const parsed = ReviewSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const { productId, rating, title, comment } = parsed.data;

        // Vérifier si l'utilisateur a déjà laissé un avis
        const { data: existing } = await supabase
            .from('product_reviews')
            .select('id')
            .eq('product_id', productId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Vous avez déjà laissé un avis pour ce produit' },
                { status: 400 }
            );
        }

        // Créer l'avis
        const { data: review, error } = await supabase
            .from('product_reviews')
            .insert({
                product_id: productId,
                user_id: userId,
                rating,
                title: title || null,
                comment: comment || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating review:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la création de l\'avis' },
                { status: 500 }
            );
        }

        // Mettre à jour les stats du produit
        const { data: allReviews } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('product_id', productId);

        if (allReviews && allReviews.length > 0) {
            const avgRating = Math.round(
                allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            );

            await supabase
                .from('products')
                .update({ rating: avgRating, reviews: allReviews.length })
                .eq('id', productId);
        }

        return NextResponse.json({
            success: true,
            review,
        });

    } catch (error) {
        console.error('Reviews POST error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// DELETE: Supprimer son propre avis
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('id');

        if (!reviewId) {
            return NextResponse.json(
                { error: 'ID de l\'avis requis' },
                { status: 400 }
            );
        }

        // Récupérer le token
        const authHeader = request.headers.get('cookie');
        const accessToken = authHeader?.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1];

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Authentification requise' },
                { status: 401 }
            );
        }

        let tokenData;
        try {
            tokenData = JSON.parse(decodeURIComponent(accessToken));
        } catch {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 401 }
            );
        }

        const userId = tokenData?.user?.id;

        // Vérifier que l'avis appartient à l'utilisateur
        const { data: review } = await supabase
            .from('product_reviews')
            .select('id, user_id, product_id')
            .eq('id', reviewId)
            .single();

        if (!review) {
            return NextResponse.json(
                { error: 'Avis non trouvé' },
                { status: 404 }
            );
        }

        if (review.user_id !== userId) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 403 }
            );
        }

        // Supprimer l'avis
        await supabase
            .from('product_reviews')
            .delete()
            .eq('id', reviewId);

        // Mettre à jour les stats du produit
        const { data: remainingReviews } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('product_id', review.product_id);

        if (remainingReviews && remainingReviews.length > 0) {
            const avgRating = Math.round(
                remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length
            );

            await supabase
                .from('products')
                .update({ rating: avgRating, reviews: remainingReviews.length })
                .eq('id', review.product_id);
        } else {
            await supabase
                .from('products')
                .update({ rating: null, reviews: 0 })
                .eq('id', review.product_id);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Reviews DELETE error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
