'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useProductsFromDB } from '@/hooks/useProductsFromDB';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { withImageParams } from '@/lib/image-formats';
import { getProductImageUrl } from '@/lib/media';
import { SearchBar } from '@/components/SearchBar';
import { PriceFilter } from '@/components/PriceFilter';
import { SortSelect } from '@/components/SortSelect';
import OptimizedImage from '@/components/OptimizedImage';
import { CUSTOM_ONLY_CATEGORIES } from '@/lib/custom-categories';

function CatalogueContent() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'rating';
  const categories = useMemo(() => (searchParams.get('cat') || '').split(',').filter(Boolean), [searchParams]);
  const priceMin = searchParams.get('min') || '';
  const priceMax = searchParams.get('max') || '';
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Load categories from API
  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) {
          console.error('Failed to fetch categories:', res.statusText);
          return;
        }

        const { categories } = await res.json();

        if (mounted) {
          // ⚠️ Exclure les catégories réservées au Sur-Mesure
          const filteredCategories = (categories || []).filter((cat: string) => !CUSTOM_ONLY_CATEGORIES.includes(cat as any));
          setAllCategories(filteredCategories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    loadCategories();
    return () => { mounted = false; };
  }, []);

  // Rediriger vers la page de résultats lorsque les filtres changent
  useEffect(() => {
    const params = new URLSearchParams();

    if (search) params.set('q', search);
    if (sort && sort !== 'rating') params.set('sort', sort);
    if (categories.length) params.set('cat', categories.join(','));
    if (priceMin) params.set('min', priceMin);
    if (priceMax) params.set('max', priceMax);

    // Si nous avons des filtres actifs, rediriger vers la page de résultats
    if (search || categories.length || priceMin || priceMax || (sort && sort !== 'rating')) {
      router.push(`/catalogue/recherche?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, categories.join(','), priceMin, priceMax]);

  const sortOption = useMemo(() => {
    if (sort === 'price_asc' || sort === 'price_desc' || sort === 'newest' || sort === 'rating') return sort as any;
    return 'rating';
  }, [sort]);

  const priceMinNum = priceMin ? Number(priceMin) : undefined;
  const priceMaxNum = priceMax ? Number(priceMax) : undefined;

  // ⚠️ Exclure les catégories réservées au Sur-Mesure
  const { products, loading, error } = useProductsFromDB({
    search,
    sort: sortOption,
    categories,
    priceMin: priceMinNum,
    priceMax: priceMaxNum,
    excludeCategories: CUSTOM_ONLY_CATEGORIES as any
  });

  // Image params handled centrally via lib/image-formats

  // Group products by category for sectioned rendering
  const grouped = useMemo(() => {
    const map = new Map<string, typeof products>();

    // Si des catégories sont sélectionnées, ne montrer que ces catégories
    const categoriesToShow = categories.length > 0 ? categories : allCategories;

    // D'abord ajouter les catégories sélectionnées (même si vides)
    categoriesToShow.forEach(cat => {
      map.set(cat, []);
    });

    // Puis ajouter les produits dans leurs catégories
    products.forEach((product) => {
      const cat = (product as any).category || t('catalog.uncategorized', 'Non catégorisé');
      if (!map.has(cat) && !categories.length) {
        map.set(cat, []);
      }
      if (map.has(cat)) {
        map.get(cat)?.push(product);
      }
    });

    // Filtrer les catégories vides si une recherche est active
    const filteredEntries = Array.from(map.entries())
      .filter(([_, categoryProducts]) => categoryProducts.length > 0 || categories.length > 0);

    // Trier les catégories par ordre alphabétique
    return filteredEntries.sort(([a], [b]) => a.localeCompare(b));
  }, [products, t, categories, allCategories]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = useMemo(() =>
    !!search || categories.length > 0 || !!priceMin || !!priceMax || (sort && sort !== 'rating'),
    [search, categories.length, priceMin, priceMax, sort]
  );

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-2">{t('catalog.title', 'Notre Catalogue')}</h1>
              <p className="text-lg text-nubia-white/80">
                {hasActiveFilters
                  ? t('catalog.filtered_results', 'Résultats de votre recherche')
                  : t('catalog.description', 'Découvrez notre collection complète de créations')}
              </p>
            </div>

            {hasActiveFilters && (
              <Link
                href="/catalogue"
                className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-nubia-black bg-nubia-gold hover:bg-nubia-gold/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nubia-gold"
              >
                {t('catalog.clear_filters', 'Effacer les filtres')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {allCategories.length > 0 && (
        <section className="bg-nubia-white py-12 border-b border-nubia-gold/20">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-playfair text-3xl font-bold text-nubia-black mb-8 text-center">{t('catalog.categories_title', 'Nos Catégories')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {allCategories.map((cat) => (
                <Link
                  key={cat}
                  href={`/${locale}/catalogue/${cat}`}
                  className="group relative overflow-hidden rounded-xl h-48 cursor-pointer hover:shadow-lg transition-all duration-300 block"
                >
                  {/* Banner Image */}
                  <OptimizedImage
                    src={getProductImageUrl(`images/banners/category/${cat}.png`)}
                    alt={t(`categories.${cat}`, cat)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
                    className="group-hover:scale-110 transition-transform duration-300"
                    objectFit="cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-nubia-black/40 group-hover:bg-nubia-black/50 transition-colors duration-300" />

                  {/* Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-playfair text-xl font-bold text-white text-center px-4">
                      {t(`categories.${cat}`, cat)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search & Filter Bar */}
      <section className="bg-nubia-white border-b border-nubia-gold/20 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full">
              <SearchBar initialSearch={search} />
            </div>

            {/* Price Filter */}
            <PriceFilter />

            {/* Sort */}
            <SortSelect />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="flex-1 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-[360px] rounded-lg bg-nubia-cream/40 animate-pulse" />
              ))}
            </div>
          )}
          {error && !loading && (
            <div className="py-16 text-center text-red-600">{error}</div>
          )}
          {!loading && !error && products.length === 0 && (
            <div className="py-16 text-center text-nubia-black">{t('catalog.no_results', 'Aucun produit trouvé')}</div>
          )}
          {!loading && !error && grouped.map(([cat, list]) => (
            <div key={cat} className="mb-8 sm:mb-12">
              <h2 className="font-playfair text-xl sm:text-2xl md:text-3xl font-bold text-nubia-black mb-4 sm:mb-6">
                {t(`categories.${cat}`, cat)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 justify-center justify-items-center">
                {list.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-nubia-white border border-nubia-gold/20 rounded-lg overflow-hidden hover:shadow-2xl hover:border-nubia-gold/60 transition-all duration-300 transform hover:-translate-y-2 flex flex-col min-h-[500px] sm:min-h-[550px] md:min-h-[600px] lg:min-h-[650px]"
                  >
                    {/* Image */}
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
                        <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[480px] bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <OptimizedImage
                            src={withImageParams('catalog', imageUrl as string)}
                            alt={(locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="group-hover:scale-110 transition-transform duration-500"
                            objectFit="contain"
                          />
                        </div>
                      ) : null;
                    })()}

                    {/* Content */}
                    <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-playfair text-base sm:text-lg font-bold text-nubia-black mb-1 line-clamp-2 group-hover:text-nubia-gold transition-colors duration-300">
                          {(locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-nubia-black/60 mb-2 line-clamp-2 group-hover:text-nubia-black/80 transition-colors duration-300">
                          {locale === 'fr'
                            ? ((product as any).description_fr || (product as any).description || 'Pièce de mode premium')
                            : ((product as any).description_en || 'Premium fashion piece')}
                        </p>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-lg sm:text-xl font-bold text-nubia-gold group-hover:scale-110 transition-transform duration-300 origin-left">
                            {Number(product.price).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                          </span>
                          <span className="text-xs text-nubia-white bg-nubia-gold px-2 py-0.5 rounded-full group-hover:scale-110 transition-transform duration-300">
                            {'⭐'.repeat(Math.max(0, Math.min(5, Math.floor(product.rating || 0))))}
                          </span>
                        </div>

                        <Link
                          href={`/${locale}/produit/${(product.slug || product.name.toLowerCase().replace(/\s+/g, '-'))}`}
                          className="block w-full py-2 sm:py-2.5 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 text-center text-sm group-hover:shadow-lg group-hover:scale-105"
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
      </section>

      <Footer />
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-nubia-white flex items-center justify-center">
        <Loader className="animate-spin text-nubia-gold" size={40} />
      </div>
    }>
      <CatalogueContent />
    </Suspense>
  );
}


