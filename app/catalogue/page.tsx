'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { withImageParams } from '@/lib/image-formats';

interface Category {
  slug: string;
  name: string;
  name_fr: string;
  name_en: string;
}

export default function CataloguePage() {
  const { locale, t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data.data || []);
        console.log('[Catalogue] Categories loaded:', data.data?.length);
      } catch (err) {
        console.error('[Catalogue] Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Charger tous les produits
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data.data || []);
        console.log('[Catalogue] Products loaded:', data.data?.length);
      } catch (err) {
        console.error('[Catalogue] Error loading products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Filtrer les produits par recherche
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">{t('catalog.title')}</h1>
          <p className="text-lg text-nubia-white/80">{t('catalog.subtitle')}</p>
        </div>
      </section>

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

      {/* Categories Section */}
      <section className="bg-nubia-white border-b border-nubia-gold/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-8">{t('catalog.browse_by_category')}</h2>
          
          {/* Category Cards with Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {categories.map((category) => {
              // Fallback images pour les catégories
              const categoryImages: Record<string, string> = {
                'chemises-wax': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=300&fit=crop',
                'costumes-africains': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=300&fit=crop',
                'robes-mariage': 'https://images.unsplash.com/photo-1595777707802-221b2eef5ffd?w=500&h=300&fit=crop',
                'robes-ceremonie': 'https://images.unsplash.com/photo-1595777707802-221b2eef5ffd?w=500&h=300&fit=crop',
                'robes-soiree': 'https://images.unsplash.com/photo-1595777707802-221b2eef5ffd?w=500&h=300&fit=crop',
                'robes-ville': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=300&fit=crop',
                'robes-wax': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=300&fit=crop',
                'super100': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=300&fit=crop',
              };
              
              const imageUrl = categoryImages[category.slug] || 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=300&fit=crop';
              
              return (
                <Link
                  key={category.slug}
                  href={`/catalogue/${category.slug}`}
                  className="group relative h-48 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg block"
                >
                  <img
                    src={imageUrl}
                    alt={locale === 'fr' ? category.name_fr : category.name_en}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
                    <div className="w-full p-4 bg-gradient-to-t from-black to-transparent">
                      <p className="font-playfair text-lg font-bold text-nubia-white">
                        {locale === 'fr' ? category.name_fr : category.name_en}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">{t('catalog.loading')}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">{t('catalog.no_products')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-nubia-white border border-nubia-gold/20 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col min-h-[500px] md:min-h-[550px] lg:min-h-[600px]"
              >
                {/* Image */}
                <div className="relative w-full h-56 sm:h-64 md:h-72 bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 overflow-hidden flex-shrink-0 group-hover:shadow-inner transition-shadow duration-300">
                  {(() => {
                    const productImages = (product as any).product_images;
                    // Utiliser product_images avec position 0 comme sur la landing page
                    const mainImage = productImages && productImages.length > 0
                      ? productImages.find((img: any) => img.position === 0 || img.position === null || productImages.indexOf(img) === 0)?.url
                      : null;
                    const imageUrl = mainImage || product.image_url || product.image || '/placeholder-evening-dress.svg';

                    return (
                      <img
                        src={withImageParams('catalog', imageUrl)}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    );
                  })()}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-playfair text-base sm:text-lg md:text-xl font-bold text-nubia-black mb-2 line-clamp-2">
                      {locale === 'en' && product.name_en ? product.name_en : product.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-nubia-black/70 mb-4 line-clamp-3">
                      {locale === 'en' && product.description_en ? product.description_en : product.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-nubia-gold">
                        {product.price.toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-xs sm:text-sm text-nubia-white bg-nubia-gold px-2 sm:px-3 py-1 rounded-full">
                        {'⭐'.repeat(product.rating)}
                      </span>
                    </div>

                    <Link 
                      href={`/produit/${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="block w-full py-2.5 sm:py-3 md:py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 text-center text-sm sm:text-base"
                    >
                      Voir les détails
                    </Link>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
