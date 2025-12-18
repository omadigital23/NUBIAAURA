import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Recherche de produits avec autocomplétion
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.trim() || '';
        const limit = parseInt(searchParams.get('limit') || '10');
        const locale = searchParams.get('locale') || 'fr';

        if (!query || query.length < 2) {
            return NextResponse.json({ suggestions: [] });
        }

        // Recherche ILIKE sur plusieurs colonnes
        const searchPattern = `%${query}%`;

        const { data: products, error } = await supabase
            .from('products')
            .select(`
        id,
        slug,
        name,
        name_fr,
        name_en,
        price,
        image,
        image_url,
        category,
        "inStock"
      `)
            .or(`name.ilike.${searchPattern},name_fr.ilike.${searchPattern},name_en.ilike.${searchPattern},description.ilike.${searchPattern},description_fr.ilike.${searchPattern},description_en.ilike.${searchPattern},category.ilike.${searchPattern}`)
            .eq('"inStock"', true)
            .order('rating', { ascending: false, nullsFirst: false })
            .limit(limit);

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la recherche' },
                { status: 500 }
            );
        }

        // Formater les suggestions
        const suggestions = (products || []).map((product) => ({
            id: product.id,
            slug: product.slug,
            name: locale === 'fr'
                ? (product.name_fr || product.name)
                : (product.name_en || product.name),
            price: product.price,
            image: product.image || product.image_url,
            category: product.category,
        }));

        // Rechercher aussi les catégories correspondantes
        const categories = [...new Set(
            (products || [])
                .map(p => p.category)
                .filter(Boolean)
        )];

        return NextResponse.json({
            suggestions,
            categories,
            total: suggestions.length,
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
