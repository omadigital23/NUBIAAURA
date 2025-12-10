'use client';

import Link from 'next/link';
import { useCartContext } from '@/contexts/CartContext';
import { useTranslation } from '@/hooks/useTranslation';
 

export default function CartPage() {
  const { t, locale } = useTranslation();
  const { items, total, removeItem, updateQuantity, clearCart, loading } = useCartContext();
  

  // Show loading state while cart is being loaded
  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-nubia-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-8">
            {t('cart.title', 'Mon Panier')}
          </h1>

          <div className="text-center py-12">
            <p className="text-nubia-black/70 mb-6">{t('common.loading', 'Chargement...')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart only when not loading and items are actually empty
  if (!loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-nubia-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-8">
            {t('cart.title', 'Mon Panier')}
          </h1>

          <div className="text-center py-12">
            <p className="text-nubia-black/70 mb-6">{t('cart.empty', 'Votre panier est vide')}</p>
            <Link
              href={`/${locale}/catalogue`}
              className="inline-block px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300"
            >
              {t('cart.continue_shopping', 'Continuer les achats')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nubia-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-8">
          {t('cart.title', 'Mon Panier')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-nubia-cream/30 rounded-lg border border-nubia-gold/20"
                >
                  {/* Item Image */}
                  {item.image && (
                    <div className="w-24 h-24 flex-shrink-0 bg-nubia-gold/10 rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="flex-1">
                    <h3 className="font-playfair font-bold text-nubia-black mb-2">{item.name}</h3>
                    <p className="text-nubia-gold font-semibold mb-3">
                      {Number(item.price).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={loading}
                        className="px-2 py-1 border border-nubia-gold/30 rounded hover:bg-nubia-gold/10 disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="px-4 py-1 bg-nubia-gold/10 rounded min-w-12 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading}
                        className="px-2 py-1 border border-nubia-gold/30 rounded hover:bg-nubia-gold/10 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Item Total & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <p className="font-bold text-nubia-black">
                      {Number(item.price * item.quantity).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold disabled:opacity-50"
                    >
                      {t('cart.remove', 'Supprimer')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart */}
            <button
              onClick={clearCart}
              disabled={loading}
              className="mt-6 text-red-600 hover:text-red-700 font-semibold disabled:opacity-50"
            >
              {t('cart.clear', 'Vider le panier')}
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-nubia-cream/30 border border-nubia-gold/20 rounded-lg p-6 sticky top-4">
              <h2 className="font-playfair text-xl font-bold text-nubia-black mb-6">
                {t('cart.summary', 'Résumé de la commande')}
              </h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-nubia-gold/20">
                <div className="flex justify-between text-nubia-black/70">
                  <span>{t('cart.subtotal', 'Sous-total')}</span>
                  <span>{Number(total).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}</span>
                </div>
                <div className="flex justify-between text-nubia-black/70">
                  <span>{t('cart.shipping', 'Livraison')}</span>
                  <span>{t('cart.calculated_at_checkout', 'Calculée à la commande')}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg text-nubia-black mb-6">
                <span>{t('cart.total', 'Total')}</span>
                <span>{Number(total).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}</span>
              </div>

              {items.length > 0 ? (
                <Link
                  href={`/${locale}/checkout`}
                  className="block w-full px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 mb-3 text-center"
                >
                  {t('cart.checkout', 'Passer la commande')}
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full px-6 py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg border-2 border-nubia-gold opacity-60 cursor-not-allowed mb-3"
                >
                  {t('cart.checkout', 'Passer la commande')}
                </button>
              )}

              <Link
                href={`/${locale}/catalogue`}
                className="block w-full px-6 py-3 bg-nubia-white text-nubia-black font-semibold rounded-lg border-2 border-nubia-gold hover:bg-nubia-gold/10 transition-all duration-300 text-center"
              >
                {t('cart.continue_shopping', 'Continuer les achats')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
