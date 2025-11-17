'use client';

export const dynamic = 'force-dynamic';

import { useProductsFromDB } from '@/hooks/useProductsFromDB';
import { useTranslation } from '@/hooks/useTranslation';
import { useSearchParams } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import { withImageParams } from '@/lib/image-formats';
import Link from 'next/link';
import { Loader } from 'lucide-react';

function CatalogueSearchResultsContent() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  
  // Récupérer les paramètres de recherche
  const search = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'rating';
  const categories = useMemo(() => (searchParams.get('cat') || '').split(',').filter(Boolean), [searchParams]);
  const priceMin = searchParams.get('min') || '';
  const priceMax = searchParams.get('max') || '';
  
  // Convertir les prix en nombres
  const priceMinNum = priceMin ? Number(priceMin) : undefined;
  const priceMaxNum = priceMax ? Number(priceMax) : undefined;

  // Récupérer les produits filtrés
  const { products, loading, error } = useProductsFromDB({
    search,
    sort: sort as any,
    categories: categories.length ? categories : undefined,
    priceMin: priceMinNum,
    priceMax: priceMaxNum
  });

  // Grouper les produits par catégorie pour l'affichage
  const groupedProducts = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const p of products) {
      const cat = (p as any).category || t('catalog.uncategorized', 'Non catégorisé');
      if (!map.has(cat)) map.set(cat, [] as any);
      (map.get(cat) as any).push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products, t]);

  // Afficher le nombre de résultats
  const resultCount = products.length;
  const searchQuery = search || categories.join(', ');

  return (
    <div className="min-h-screen bg-nubia-white">
      {/* En-tête des résultats */}
      <div className="bg-nubia-cream py-8 border-b border-nubia-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-2">
            {search || categories.length
              ? `Résultats pour : ${searchQuery}`
              : t('catalog.all_products', 'Tous les produits')}
          </h1>
          <p className="text-nubia-black/70">
            {resultCount === 0
              ? t('catalog.no_results', 'Aucun produit trouvé')
              : `${resultCount} produit${resultCount > 1 ? 's' : ''} trouvé${resultCount > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader className="animate-spin text-nubia-gold" size={32} />
            <span className="ml-2 text-nubia-black">{t('common.loading', 'Chargement...')}</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-600">{error}</div>
        ) : (
          <div className="space-y-12">
            {groupedProducts.map(([category, categoryProducts]) => (
              <div key={category} className="mb-12">
                <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
                  {t(`categories.${category}`, category)}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-nubia-gold/20 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-nubia-gold/60"
                    >
                      {/* Image du produit */}
                      <div className="relative w-full h-64 overflow-hidden">
                        {(() => {
                          // Priorité 1: Trier product_images par position et utiliser la première (position 0 = face)
                          const productImages = (product as any).product_images;
                          const sortedProductImages = productImages && Array.isArray(productImages) && productImages.length > 0
                            ? [...productImages].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                            : [];
                          const firstProductImage = sortedProductImages.length > 0 ? sortedProductImages[0].url : null;

                          // Priorité 2: Utiliser product.image ou product.image_url
                          const imageUrl = firstProductImage || product.image || (product as any).image_url;
                          
                          return imageUrl ? (
                            <img
                              src={withImageParams('catalog', imageUrl as string)}
                              alt={(locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          ) : null;
                        })()}
                      </div>

                      {/* Détails du produit */}
                      <div className="p-4">
                        <h3 className="font-playfair font-bold text-lg text-nubia-black mb-1 line-clamp-1">
                          {(locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name}
                        </h3>
                        <p className="text-sm text-nubia-black/60 mb-3 line-clamp-2">
                          {locale === 'fr'
                            ? (product as any).description_fr || (product as any).description || ''
                            : (product as any).description_en || (product as any).description || ''}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-nubia-gold">
                            {Number(product.price).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                          </span>
                          <Link
                            href={`/${locale}/produit/${product.slug || product.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="text-sm font-medium text-nubia-gold hover:underline"
                          >
                            {t('common.view_details', 'Voir les détails')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CatalogueSearchResults() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-nubia-white flex items-center justify-center">
        <Loader className="animate-spin text-nubia-gold" size={40} />
      </div>
    }>
      <CatalogueSearchResultsContent />
    </Suspense>
  );
}
