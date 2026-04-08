'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import { Heart, Trash2, ShoppingBag, Loader } from 'lucide-react';

export default function WishlistPage() {
  const { t, locale } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, loading, removeFromWishlist } = useWishlist();

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-nubia-gold" size={40} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Heart className="mx-auto mb-4 text-nubia-gold/30" size={48} />
            <h1 className="font-playfair text-2xl font-bold text-nubia-black mb-2">
              {t('common.wishlist.title', 'Liste de souhaits')}
            </h1>
            <p className="text-nubia-black/60 mb-6">
              {t('common.wishlist.loginRequired', 'Connectez-vous pour voir vos favoris')}
            </p>
            <Link
              href={`/${locale}/auth/login`}
              className="px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-colors inline-block"
            >
              {t('auth.login_button', 'Se connecter')}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="flex items-center gap-3 mb-8">
            <Heart className="text-nubia-gold" size={28} />
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-nubia-black">
              {t('common.wishlist.title', 'Liste de souhaits')}
            </h1>
            {items.length > 0 && (
              <span className="text-sm text-nubia-black/50">
                ({items.length} {items.length === 1 ? 'article' : 'articles'})
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-nubia-gold" size={32} />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="mx-auto mb-4 text-nubia-gold/20" size={64} />
              <p className="text-nubia-black/50 text-lg mb-2">
                {t('common.wishlist.empty', 'Votre liste de souhaits est vide')}
              </p>
              <p className="text-nubia-black/40 text-sm mb-6">
                {t('common.wishlist.emptyDesc', 'Explorez notre catalogue et ajoutez vos articles préférés')}
              </p>
              <Link
                href={`/${locale}/catalogue`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-colors"
              >
                <ShoppingBag size={20} />
                {t('common.wishlist.browseCatalogue', 'Voir le catalogue')}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(item => {
                const product = item.products;
                if (!product) return null;

                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    <Link href={`/${locale}/produit/${product.slug || product.id}`}>
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                        <OptimizedImage
                          src={product.image || '/images/placeholder.jpg'}
                          alt={product.name}
                          width={300}
                          height={400}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-white text-nubia-black px-3 py-1 rounded-full text-sm font-semibold">
                              {t('common.outOfStock', 'Rupture de stock')}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-4">
                      <Link href={`/${locale}/produit/${product.slug || product.id}`}>
                        <h3 className="font-medium text-nubia-black text-sm line-clamp-2 mb-2 hover:text-nubia-gold transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-nubia-gold font-bold">
                        {Number(product.price).toLocaleString('fr-FR')} XOF
                      </p>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                        {t('common.wishlist.remove', 'Retirer')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
