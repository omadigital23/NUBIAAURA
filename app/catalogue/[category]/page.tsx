'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { withImageParams } from '@/lib/image-formats';

interface Category {
  slug: string;
  name: string;
  name_fr: string;
  name_en: string;
}

export default function CategoryPage() {
  const params = useParams();
  const { locale, t } = useTranslation();
  const categorySlug = params.category as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const url = `/api/products?category=${categorySlug}`;
        const res = await fetch(url);
        const data = await res.json();
        setProducts(data.data || []);
        console.log('[CategoryPage] Products loaded:', data.data?.length, 'for category:', categorySlug);
      } catch (err) {
        console.error('[CategoryPage] Error loading products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [categorySlug]);

  // Filtrer les produits par recherche
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryName = category 
    ? (locale === 'en' ? category.name_en : category.name_fr)
    : categorySlug;

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/catalogue"
            className="inline-flex items-center gap-2 text-nubia-white/80 hover:text-nubia-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour au catalogue</span>
          </Link>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">{categoryName}</h1>
          <p className="text-lg text-nubia-white/80">Découvrez notre collection de {categoryName.toLowerCase()}</p>
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

      {/* Products Grid */}
      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">Chargement des produits...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-nubia-black/70">Aucun produit trouvé dans cette catégorie</p>
              <Link 
                href="/catalogue"
                className="mt-4 inline-block text-nubia-gold hover:underline"
              >
                Retour au catalogue
              </Link>
            </div>
          ) : (
            <>
              <p className="text-nubia-black/70 mb-6">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-nubia-white border border-nubia-gold/20 rounded-lg overflow-hidden hover:shadow-gold transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Image */}
                    <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-nubia-gold/10 to-nubia-gold/5 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                      <img
                        src={withImageParams('catalog', product.image)}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 flex flex-col flex-1">
                      <h3 className="font-playfair text-lg sm:text-xl font-bold text-nubia-black mb-2">
                        {locale === 'en' && product.name_en ? product.name_en : product.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-nubia-black/70 mb-3 sm:mb-4 line-clamp-2 flex-1">
                        {locale === 'en' && product.description_en ? product.description_en : product.description}
                      </p>

                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-xl sm:text-2xl font-bold text-nubia-gold">
                          {product.price.toLocaleString('fr-FR')} FCFA
                        </span>
                        <span className="text-xs sm:text-sm text-nubia-white bg-nubia-gold px-2 sm:px-3 py-1 rounded-full">
                          {'⭐'.repeat(product.rating)}
                        </span>
                      </div>

                      <Link 
                        href={`/produit/${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block w-full py-2 sm:py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 text-center text-sm sm:text-base"
                      >
                        Voir les détails
                      </Link>
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

