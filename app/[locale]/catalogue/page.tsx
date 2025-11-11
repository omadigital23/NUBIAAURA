'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Loader } from 'lucide-react';
import { useProductsFromDB } from '@/hooks/useProductsFromDB';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { withImageParams } from '@/lib/image-formats';
import { getProductImageUrl } from '@/lib/media';

function CatalogueContent() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState<string>(searchParams.get('q') || '');
  const [sort, setSort] = useState<string>(searchParams.get('sort') || 'rating');
  const [categories, setCategories] = useState<string[]>(() => (searchParams.get('cat') || '').split(',').filter(Boolean));
  const [priceMin, setPriceMin] = useState<string>(searchParams.get('min') || '');
  const [priceMax, setPriceMax] = useState<string>(searchParams.get('max') || '');
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
          setAllCategories(categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    
    loadCategories();
    return () => { mounted = false; };
  }, []);

  // Keep URL in sync when controls change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('q', search); else params.delete('q');
    if (sort) params.set('sort', sort); else params.delete('sort');
    if (categories.length) params.set('cat', categories.join(',')); else params.delete('cat');
    if (priceMin) params.set('min', priceMin); else params.delete('min');
    if (priceMax) params.set('max', priceMax); else params.delete('max');
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, categories.join(','), priceMin, priceMax]);

  const sortOption = useMemo(() => {
    if (sort === 'price_asc' || sort === 'price_desc' || sort === 'newest' || sort === 'rating') return sort as any;
    return 'rating';
  }, [sort]);

  const priceMinNum = priceMin ? Number(priceMin) : undefined;
  const priceMaxNum = priceMax ? Number(priceMax) : undefined;

  const { products, loading, error } = useProductsFromDB({ search, sort: sortOption, categories, priceMin: priceMinNum, priceMax: priceMaxNum });

  // Image params handled centrally via lib/image-formats

  // Group products by category for sectioned rendering
  const grouped = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const p of products) {
      const cat = (p as any).category || t('catalog.uncategorized', 'Non catégorisé');
      if (!map.has(cat)) map.set(cat, [] as any);
      (map.get(cat) as any).push(p);
    }
    // Sort categories alphabetically for stable sections
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products, t]);

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">{t('catalog.title', 'Notre Catalogue')}</h1>
          <p className="text-lg text-nubia-white/80">{t('catalog.description', 'Découvrez notre collection complète de créations')}</p>
        </div>
      </section>

      {/* Categories Section */}
      {allCategories.length > 0 && (
        <section className="bg-nubia-white py-12 border-b border-nubia-gold/20">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-playfair text-3xl font-bold text-nubia-black mb-8 text-center">{t('catalog.categories_title', 'Nos Catégories')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategories((prev) =>
                      prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]
                    );
                  }}
                  className="group relative overflow-hidden rounded-xl h-48 cursor-pointer hover:shadow-lg transition-all duration-300"
                >
                  {/* Banner Image */}
                  <img
                    src={getProductImageUrl(`images/banners/category/${cat}.png`)}
                    alt={t(`categories.${cat}`, cat)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-nubia-black/40 group-hover:bg-nubia-black/50 transition-colors duration-300" />
                  
                  {/* Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-playfair text-xl font-bold text-white text-center px-4 ${
                      categories.includes(cat) ? 'bg-nubia-gold/80 px-6 py-2 rounded-lg' : ''
                    }`}>
                      {t(`categories.${cat}`, cat)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search & Sort Bar */}
      <section className="bg-nubia-white border-b border-nubia-gold/20 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-nubia-gold" size={20} />
              <input
                type="text"
                placeholder={t('catalog.search_placeholder', 'Rechercher...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
              />
            </div>

            {/* Price Filter */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder={t('catalog.min_price', 'Min')}
                className="w-24 px-3 py-2 border border-nubia-gold/30 rounded-lg"
              />
              <span>-</span>
              <input
                type="number"
                inputMode="numeric"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder={t('catalog.max_price', 'Max')}
                className="w-24 px-3 py-2 border border-nubia-gold/30 rounded-lg"
              />
              <span className="text-sm text-nubia-black/70">{t('common.currency', 'FCFA')}</span>
            </div>

            {/* Sort */}
            <select
              className="px-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label={t('catalog.sort_by', 'Trier par')}
            >
              <option value="rating">{t('catalog.sort_rating', 'Les mieux notés')}</option>
              <option value="newest">{t('catalog.newest', 'Plus récent')}</option>
              <option value="price_asc">{t('catalog.price_asc', 'Prix croissant')}</option>
              <option value="price_desc">{t('catalog.price_desc', 'Prix décroissant')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div key={cat} className="mb-12">
              <h2 className="font-playfair text-2xl md:text-3xl font-bold text-nubia-black mb-6">
                {t(`categories.${cat}`, cat)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {list.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-nubia-white border border-nubia-gold/20 rounded-lg overflow-hidden hover:shadow-2xl hover:border-nubia-gold/60 transition-all duration-300 transform hover:-translate-y-2 flex flex-col min-h-[600px]"
                  >
                    {/* Image */}
                    {(product.image || (product as any).image_url) && (
                      <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[420px] bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 overflow-hidden flex-shrink-0">
                        <img
                          src={withImageParams('catalog', (product.image || (product as any).image_url) as string)}
                          alt={(locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1 overflow-hidden">
                      <h3 className="font-playfair text-lg font-bold text-nubia-black mb-1 line-clamp-1 group-hover:text-nubia-gold transition-colors duration-300">
                        {(locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-nubia-black/60 mb-2 line-clamp-1 group-hover:text-nubia-black/80 transition-colors duration-300">
                        {locale === 'fr' 
                          ? ((product as any).description_fr || (product as any).description || 'Pièce de mode premium')
                          : ((product as any).description_en || 'Premium fashion piece')}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-nubia-gold group-hover:scale-110 transition-transform duration-300 origin-left">
                          {Number(product.price).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                        </span>
                        <span className="text-xs text-nubia-white bg-nubia-gold px-2 py-0.5 rounded-full group-hover:scale-110 transition-transform duration-300">
                          {'⭐'.repeat(Math.max(0, Math.min(5, Math.floor(product.rating || 0))))}
                        </span>
                      </div>

                      <Link 
                        href={`/${locale}/produit/${(product.slug || product.name.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="block w-full py-2 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 text-center text-sm group-hover:shadow-lg group-hover:scale-105"
                      >
                        {t('common.view_details', 'Voir les détails')}
                      </Link>
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


