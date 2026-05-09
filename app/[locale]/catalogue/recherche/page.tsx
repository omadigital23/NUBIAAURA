'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Loader } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PriceFilter } from '@/components/PriceFilter';
import { SearchBar } from '@/components/SearchBar';
import { SortSelect } from '@/components/SortSelect';
import { useProductsFromDB } from '@/hooks/useProductsFromDB';
import { useTranslation } from '@/hooks/useTranslation';
import { CUSTOM_ONLY_CATEGORIES } from '@/lib/custom-categories';
import { withImageParams } from '@/lib/image-formats';

function getPrimaryProductImage(product: any) {
  const sortedProductImages = product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0
    ? [...product.product_images].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    : [];

  return sortedProductImages[0]?.url || product.image || product.image_url || '';
}

function CatalogueSearchResultsContent() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'rating';
  const categories = useMemo(() => (searchParams.get('cat') || '').split(',').filter(Boolean), [searchParams]);
  const priceMin = searchParams.get('min') || '';
  const priceMax = searchParams.get('max') || '';

  const priceMinNum = priceMin ? Number(priceMin) : undefined;
  const priceMaxNum = priceMax ? Number(priceMax) : undefined;

  const { products, loading, error } = useProductsFromDB({
    search,
    sort: sort as any,
    categories: categories.length ? categories : undefined,
    priceMin: priceMinNum,
    priceMax: priceMaxNum,
    excludeCategories: CUSTOM_ONLY_CATEGORIES as any,
  });

  const groupedProducts = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const product of products) {
      const category = (product as any).category || t('catalog.uncategorized', 'Non catégorisé');
      if (!map.has(category)) map.set(category, [] as any);
      (map.get(category) as any).push(product);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products, t]);

  const resultCount = products.length;
  const searchQuery = search || categories.map((category) => t(`categories.${category}`, category)).join(', ');

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark py-10 text-nubia-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
            {t('catalog.search', 'Recherche')}
          </p>
          <h1 className="font-playfair text-3xl font-bold md:text-5xl">
            {search || categories.length
              ? `${t('catalog.results_for', 'Résultats pour')} : ${searchQuery}`
              : t('catalog.all_products', 'Tous les produits')}
          </h1>
          <p className="mt-3 text-nubia-white/72">
            {loading
              ? t('common.loading', 'Chargement...')
              : resultCount === 0
                ? t('catalog.no_results', 'Aucun produit trouvé')
                : `${resultCount} produit${resultCount > 1 ? 's' : ''} trouvé${resultCount > 1 ? 's' : ''}`}
          </p>
        </div>
      </section>

      <section className="border-b border-nubia-gold/20 bg-nubia-white/95 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full flex-1">
              <SearchBar initialSearch={search} />
            </div>
            <PriceFilter />
            <SortSelect />
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader className="animate-spin text-nubia-gold" size={32} />
            <span className="ml-2 text-nubia-black">{t('common.loading', 'Chargement...')}</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-600">{error}</div>
        ) : groupedProducts.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <h2 className="font-playfair text-2xl font-bold text-nubia-black">
              {t('catalog.no_results', 'Aucun produit trouvé')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-nubia-black/65">
              {t('catalog.no_results_help', 'Essayez une autre recherche ou revenez au catalogue complet.')}
            </p>
            <Link
              href={`/${locale}/catalogue`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-nubia-gold px-5 py-3 font-bold text-nubia-black transition-colors hover:bg-nubia-white hover:shadow-lg"
            >
              {t('nav.catalog', 'Catalogue')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedProducts.map(([category, categoryProducts]) => (
              <section key={category}>
                <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
                  {t(`categories.${category}`, category)}
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryProducts.map((product) => {
                    const productName = (locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name;
                    const productDescription = locale === 'fr'
                      ? (product as any).description_fr || (product as any).description || ''
                      : (product as any).description_en || (product as any).description || '';
                    const imageUrl = getPrimaryProductImage(product);

                    return (
                      <Link
                        key={product.id}
                        href={`/${locale}/produit/${product.slug || product.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="group flex flex-col overflow-hidden rounded-lg border border-nubia-gold/20 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-nubia-gold/60 hover:shadow-2xl"
                      >
                        <div className="relative aspect-[4/5] w-full overflow-hidden bg-nubia-cream/35">
                          {imageUrl ? (
                            <img
                              src={withImageParams('catalog', imageUrl as string)}
                              alt={productName}
                              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm font-semibold text-nubia-black/45">
                              {t('catalog.no_image', 'Image indisponible')}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <h3 className="font-playfair font-bold text-lg text-nubia-black mb-1 line-clamp-2 transition-colors group-hover:text-nubia-gold">
                              {productName}
                            </h3>
                            <p className="text-sm text-nubia-black/60 line-clamp-2">
                              {productDescription}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-lg font-bold text-nubia-gold">
                              {Number(product.price).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-nubia-gold">
                              {t('common.view_details', 'Voir les détails')}
                              <ArrowRight size={14} aria-hidden="true" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
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
