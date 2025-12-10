'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useProductsFromDB } from '@/hooks/useProductsFromDB';
import { withImageParams } from '@/lib/image-formats';
import { Loader } from 'lucide-react';

interface Category {
  slug: string;
  name: string;
  name_fr: string;
  name_en: string;
}

function CategoryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const categorySlug = params.category as string;
  const isInspiration = searchParams.get('inspiration') === 'true';
  const [category, setCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger la catégorie
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        const categories = data.data || [];
        const foundCategory = categories.find((cat: Category) => cat.slug === categorySlug);
        setCategory(foundCategory || null);
      } catch (err) {
        console.error('[CategoryPage] Error loading category:', err);
      }
    };
    loadCategory();
  }, [categorySlug]);

  // Charger les produits de la catégorie
  const { products, loading, error } = useProductsFromDB({
    categories: [categorySlug],
    search: searchTerm || undefined
  });

  // Filtrer les produits par recherche (filtrage côté client pour la recherche instantanée)
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = (locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name || '';
    const description = (locale === 'fr' ? (product as any).description_fr : (product as any).description_en) || (product as any).description || '';
    return name.toLowerCase().includes(searchLower) || description.toLowerCase().includes(searchLower);
  });

  const categoryName = category
    ? (locale === 'en' ? category.name_en : category.name_fr)
    : t(`categories.${categorySlug}`, categorySlug);

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/catalogue`}
            className="inline-flex items-center gap-2 text-nubia-white/80 hover:text-nubia-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{t('common.back', 'Retour au catalogue')}</span>
          </Link>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">{categoryName}</h1>
          <p className="text-lg text-nubia-white/80">
            {isInspiration
              ? t('common.inspiration_banner', 'Ces modèles vous serviront d\'inspiration pour votre création sur mesure.')
              : t('catalog.category_description', `Découvrez notre collection de ${categoryName.toLowerCase()}`)}
          </p>
        </div>
      </section>

      {/* Inspiration Banner */}
      {isInspiration && (
        <section className="bg-nubia-gold/10 border-b-2 border-nubia-gold py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-nubia-black font-semibold">
              💡 {t('common.inspiration_note', 'Inspirez-vous de ces modèles pour créer votre propre design unique.')}
            </p>
          </div>
        </section>
      )}

      {/* Search Section */}
      <section className="bg-nubia-white border-b border-nubia-gold/20 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-nubia-gold" size={20} />
            <input
              type="text"
              placeholder={t('catalog.search_placeholder', 'Rechercher un produit...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
            />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={40} />
              <p className="text-nubia-black/70">{t('catalog.loading', 'Chargement des produits...')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Link
                href={`/${locale}/catalogue`}
                className="text-nubia-gold hover:underline"
              >
                {t('common.back', 'Retour au catalogue')}
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70 mb-4">
                {searchTerm
                  ? t('catalog.no_search_results', 'Aucun produit trouvé pour votre recherche')
                  : t('catalog.no_category_products', 'Aucun produit trouvé dans cette catégorie')}
              </p>
              <Link
                href={`/${locale}/catalogue`}
                className="text-nubia-gold hover:underline"
              >
                {t('common.back', 'Retour au catalogue')}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-nubia-black/70 mb-6">
                {filteredProducts.length} {t('catalog.products_found', 'produit trouvé')}{filteredProducts.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-nubia-white border border-nubia-gold/20 rounded-lg overflow-hidden hover:shadow-2xl hover:border-nubia-gold/60 transition-all duration-300 transform hover:-translate-y-2 flex flex-col min-h-[600px]"
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
                        <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[420px] bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 overflow-hidden flex-shrink-0">
                          <img
                            src={withImageParams('catalog', imageUrl as string)}
                            alt={(locale === 'fr' ? (product as any).name_fr : (product as any).name_en) || product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : null;
                    })()}

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
                        {!isInspiration && (
                          <span className="text-xl font-bold text-nubia-gold group-hover:scale-110 transition-transform duration-300 origin-left">
                            {Number(product.price).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                          </span>
                        )}
                        <span className={`text-xs text-nubia-white bg-nubia-gold px-2 py-0.5 rounded-full group-hover:scale-110 transition-transform duration-300 ${isInspiration ? 'ml-auto' : ''}`}>
                          {'⭐'.repeat(Math.max(0, Math.min(5, Math.floor(product.rating || 0))))}
                        </span>
                      </div>

                      {isInspiration ? (
                        <div className="block w-full py-2 bg-nubia-gold/20 border-2 border-nubia-gold text-nubia-gold font-semibold rounded-lg text-center text-sm">
                          {t('common.inspiration_model', 'Modèle d\'inspiration')}
                        </div>
                      ) : (
                        <Link
                          href={`/${locale}/produit/${(product.slug || product.name.toLowerCase().replace(/\s+/g, '-'))}`}
                          className="block w-full py-2 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 text-center text-sm group-hover:shadow-lg group-hover:scale-105"
                        >
                          {t('common.view_details', 'Voir les détails')}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
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

