'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader, Palette, Ruler, Search, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useProductsFromDB } from '@/hooks/useProductsFromDB';
import { withImageParams } from '@/lib/image-formats';
import type { Product } from '@/lib/types';

interface Category {
  slug: string;
  name: string;
  name_fr: string;
  name_en: string;
}

const inspirationHeroImages: Record<string, string> = {
  'robes-mariage': '/images/banners/category/robes-mariage.png',
  'robes-ceremonie': '/images/banners/category/robes-ceremonie.png',
  'costumes-africains': '/images/banners/category/costumes-africains.png',
};

const getPrimaryProductImage = (product: Product) => {
  const sortedProductImages = product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0
    ? [...product.product_images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    : [];

  return sortedProductImages[0]?.url || product.image || product.image_url || '';
};

const getProductName = (product: Product, locale: string) => (
  (locale === 'fr' ? product.name_fr : product.name_en) || product.name
);

const getProductDescription = (product: Product, locale: string) => (
  locale === 'fr'
    ? (product.description_fr || product.description || 'Piece de mode premium')
    : (product.description_en || product.description || 'Premium fashion piece')
);

function CategoryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const categorySlug = params.category as string;
  const isInspiration = searchParams.get('inspiration') === 'true';
  const [category, setCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const categoryFilters = useMemo(() => [categorySlug], [categorySlug]);

  useEffect(() => {
    let mounted = true;

    const loadCategory = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        const categories = data.data || data.categories || [];
        const foundCategory = categories.find((cat: Category) => cat.slug === categorySlug);
        if (mounted) {
          setCategory(foundCategory || null);
        }
      } catch (err) {
        console.error('[CategoryPage] Error loading category:', err);
      }
    };

    loadCategory();
    return () => {
      mounted = false;
    };
  }, [categorySlug]);

  const { products, loading, error } = useProductsFromDB({
    categories: categoryFilters,
    search: searchTerm || undefined,
  });

  const filteredProducts = useMemo(() => products.filter((product) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = getProductName(product, locale);
    const description = getProductDescription(product, locale);
    return name.toLowerCase().includes(searchLower) || description.toLowerCase().includes(searchLower);
  }), [products, searchTerm, locale]);

  const categoryName = category
    ? (locale === 'en' ? category.name_en : category.name_fr)
    : t(`categories.${categorySlug}`, categorySlug);
  const inspirationHeroImage = inspirationHeroImages[categorySlug] || '/images/banners/category/robes-ceremonie.png';
  const inspirationCtaLabel = locale === 'fr' ? 'Demarrer une creation' : 'Start a custom piece';
  const inspirationBackLabel = locale === 'fr' ? 'Retour au sur-mesure' : 'Back to custom orders';
  const resultLabel = filteredProducts.length > 1
    ? t('catalog.products_found_plural', 'produits trouves')
    : t('catalog.products_found', 'produit trouve');

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className={`relative overflow-hidden text-nubia-white ${isInspiration ? 'bg-nubia-black py-14 md:py-20' : 'bg-gradient-to-r from-nubia-black to-nubia-dark py-12'}`}>
        {isInspiration && (
          <>
            <img
              src={inspirationHeroImage}
              alt=""
              className="absolute inset-y-0 right-0 hidden h-full w-[52%] object-cover opacity-35 md:block"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.92)_48%,rgba(5,5,5,0.54)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-nubia-gold/60 to-transparent" />
          </>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={isInspiration ? `/${locale}/sur-mesure` : `/${locale}/catalogue`}
            className="mb-5 inline-flex items-center gap-2 text-nubia-white/78 transition-colors hover:text-nubia-white"
          >
            <ArrowLeft size={20} aria-hidden="true" />
            <span>{isInspiration ? inspirationBackLabel : t('common.back', 'Retour au catalogue')}</span>
          </Link>

          <div className="max-w-3xl">
            {isInspiration && (
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-nubia-gold/45 bg-nubia-gold/15 px-4 py-2 text-sm font-bold text-nubia-gold">
                <Sparkles size={16} aria-hidden="true" />
                <span>{locale === 'fr' ? 'Inspiration sur mesure' : 'Custom inspiration'}</span>
              </div>
            )}
            <h1 className="font-playfair text-4xl md:text-6xl font-bold leading-tight mb-4">{categoryName}</h1>
            <p className="max-w-2xl text-lg leading-8 text-nubia-white/80">
              {isInspiration
                ? t('common.inspiration_banner', 'Use these models as a starting point for your custom creation.')
                : t('catalog.category_description', `Decouvrez notre collection de ${categoryName.toLowerCase()}`)}
            </p>

            {isInspiration && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={`/${locale}/sur-mesure#custom-form`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-nubia-gold px-6 py-3.5 font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white focus:outline-none focus:ring-4 focus:ring-nubia-gold/25"
                >
                  {inspirationCtaLabel}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-[0.12em] text-nubia-white/76 sm:flex">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2">
                    <Ruler size={14} className="text-nubia-gold" aria-hidden="true" />
                    {locale === 'fr' ? 'Mesures guidees' : 'Guided fit'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2">
                    <Palette size={14} className="text-nubia-gold" aria-hidden="true" />
                    {locale === 'fr' ? 'Style adaptable' : 'Adaptable style'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isInspiration && (
        <section className="bg-nubia-gold/10 border-b border-nubia-gold/35 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="flex items-center justify-center gap-2 text-center text-sm font-bold text-nubia-black md:text-base">
              <CheckCircle2 className="h-5 w-5 text-nubia-gold" aria-hidden="true" />
              {t('common.inspiration_note', 'Choose a model as a base, then send your measurements and preferences.')}
            </p>
          </div>
        </section>
      )}

      <section className="bg-nubia-white border-b border-nubia-gold/20 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={isInspiration ? 'grid gap-4 md:grid-cols-[1fr_auto] md:items-center' : ''}>
            {isInspiration && (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-nubia-gold">
                  {locale === 'fr' ? 'Selection' : 'Selection'}
                </p>
                <p className="mt-1 text-sm text-nubia-black/62">
                  {locale === 'fr' ? 'Affinez les modeles avant de lancer votre demande.' : 'Refine the models before starting your request.'}
                </p>
              </div>
            )}
            <div className={`relative ${isInspiration ? 'md:min-w-[420px]' : ''}`}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nubia-gold" size={20} aria-hidden="true" />
              <input
                type="text"
                aria-label={t('catalog.search_placeholder', 'Rechercher un produit...')}
                placeholder={t('catalog.search_placeholder', 'Rechercher un produit...')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-nubia-gold/30 bg-nubia-white py-3 pl-12 pr-4 text-nubia-black shadow-sm transition-all focus:border-nubia-gold focus:outline-none focus:ring-4 focus:ring-nubia-gold/10"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`flex-1 ${isInspiration ? 'bg-gradient-to-b from-nubia-white to-nubia-cream/35 py-10 md:py-14' : 'py-12'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={40} />
              <p className="text-nubia-black/70">{t('catalog.loading', 'Chargement des produits...')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Link href={`/${locale}/catalogue`} className="text-nubia-gold hover:underline">
                {t('common.back', 'Retour au catalogue')}
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70 mb-4">
                {searchTerm
                  ? t('catalog.no_search_results', 'Aucun produit trouve pour votre recherche')
                  : t('catalog.no_category_products', 'Aucun produit trouve dans cette categorie')}
              </p>
              <Link href={`/${locale}/catalogue`} className="text-nubia-gold hover:underline">
                {t('common.back', 'Retour au catalogue')}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-nubia-black/70">
                  {filteredProducts.length} {resultLabel}
                </p>
                {isInspiration && (
                  <p className="text-sm font-medium text-nubia-black/56">
                    {locale === 'fr' ? 'Cliquez sur un modele pour commencer votre brief.' : 'Choose a model to start your brief.'}
                  </p>
                )}
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isInspiration ? 'gap-6 lg:grid-cols-2' : 'gap-8 lg:grid-cols-3'}`}>
                {filteredProducts.map((product) => {
                  const productName = getProductName(product, locale);
                  const productDescription = getProductDescription(product, locale);
                  const imageUrl = getPrimaryProductImage(product);

                  return (
                    <div
                      key={product.id}
                      className={`group flex flex-col overflow-hidden rounded-lg border bg-nubia-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                        isInspiration
                          ? 'min-h-[560px] border-nubia-gold/25 hover:border-nubia-gold/70'
                          : 'min-h-[600px] border-nubia-gold/20 hover:border-nubia-gold/60'
                      }`}
                    >
                      <div className={`relative w-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 ${isInspiration ? 'h-[340px] sm:h-[410px]' : 'h-64 sm:h-80 md:h-96 lg:h-[420px]'}`}>
                        {imageUrl ? (
                          <img
                            src={withImageParams('catalog', imageUrl)}
                            alt={productName}
                            className={`h-full w-full transition-transform duration-700 group-hover:scale-105 ${isInspiration ? 'object-contain' : 'object-cover'}`}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm font-semibold text-nubia-black/45">
                            {t('catalog.no_image', 'Image indisponible')}
                          </div>
                        )}
                        {isInspiration && (
                          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                            <span className="rounded-full bg-nubia-black/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-nubia-white backdrop-blur">
                              {locale === 'fr' ? 'Inspiration' : 'Inspiration'}
                            </span>
                            {product.rating > 0 && (
                              <span className="rounded-full bg-nubia-gold px-3 py-1 text-xs font-black text-nubia-black shadow-lg">
                                {Number(product.rating).toFixed(1)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={`flex flex-1 flex-col ${isInspiration ? 'p-5 md:p-6' : 'p-4'}`}>
                        <div className="flex-1">
                          <h3 className={`font-playfair font-bold text-nubia-black transition-colors duration-300 group-hover:text-nubia-gold ${isInspiration ? 'text-2xl leading-tight' : 'text-lg line-clamp-1'}`}>
                            {productName}
                          </h3>
                          <p className={`mt-2 text-nubia-black/62 transition-colors duration-300 group-hover:text-nubia-black/80 ${isInspiration ? 'text-sm leading-6 line-clamp-2' : 'text-xs line-clamp-1'}`}>
                            {productDescription}
                          </p>
                        </div>

                        <div className="mt-5">
                          {!isInspiration && (
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xl font-bold text-nubia-gold group-hover:scale-105 transition-transform duration-300 origin-left">
                                {Number(product.price).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                              </span>
                              {product.rating > 0 && (
                                <span className="text-xs text-nubia-white bg-nubia-gold px-2 py-0.5 rounded-full">
                                  {Number(product.rating).toFixed(1)}
                                </span>
                              )}
                            </div>
                          )}

                          {isInspiration ? (
                            <Link
                              href={`/${locale}/sur-mesure#custom-form`}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-nubia-gold bg-nubia-gold px-4 py-3 text-sm font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white focus:outline-none focus:ring-4 focus:ring-nubia-gold/15"
                            >
                              {locale === 'fr' ? 'Utiliser ce style' : 'Use this style'}
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                          ) : (
                            <Link
                              href={`/${locale}/produit/${(product.slug || product.name.toLowerCase().replace(/\s+/g, '-'))}`}
                              className="block w-full py-2 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 text-center text-sm group-hover:shadow-lg group-hover:scale-105"
                            >
                              {t('common.view_details', 'Voir les details')}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-nubia-white flex items-center justify-center">
        <Loader className="animate-spin text-nubia-gold" size={40} />
      </div>
    }>
      <CategoryContent />
    </Suspense>
  );
}
