'use client';

export const dynamic = 'force-dynamic';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, Package, Truck, MessageSquare, Loader } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

// Note: Metadata cannot be used in Client Components
// Metadata is defined in layout.tsx instead

function ThankYouContent() {
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('orderId');
    console.log('[ThankYou] Page mounted, orderId from searchParams:', id);
    setOrderId(id);
  }, [searchParams]);

  return (
    <section className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <CheckCircle className="text-green-600" size={80} />
            </div>
            <h1 className="font-playfair text-5xl font-bold text-nubia-black mb-4">{t('merci.title', 'Merci pour votre Commande !')}</h1>
            <p className="text-xl text-nubia-black/70 mb-2">{t('merci.subtitle', 'Votre commande a été confirmée avec succès')}</p>
            <p className="text-nubia-black/60">Nous vous remercions pour votre achat. Votre commande a été reçue et traitée avec succès.</p>
          </div>

          {/* Order ID Display */}
          {orderId && (
            <div className="text-center mb-12 bg-nubia-gold/10 rounded-lg p-6 inline-block w-full">
              <p className="text-nubia-black/70 mb-2">{t('merci.order_id', 'ID Commande')}:</p>
              <p className="font-playfair text-3xl font-bold text-nubia-gold">{orderId}</p>
            </div>
          )}

          {/* Order Details */}
          <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <p className="text-sm text-nubia-black/60 mb-2">Numéro de Commande</p>
                <p className="font-playfair text-2xl font-bold text-nubia-gold">#NA-2024-001</p>
              </div>
              <div>
                <p className="text-sm text-nubia-black/60 mb-2">Date de Commande</p>
                <p className="font-semibold text-nubia-black">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-nubia-black/60 mb-2">Montant Total</p>
                <p className="font-playfair text-2xl font-bold text-nubia-gold">95 000 FCFA</p>
              </div>
              <div>
                <p className="text-sm text-nubia-black/60 mb-2">Statut</p>
                <p className="font-semibold text-green-600">✓ Confirmée</p>
              </div>
            </div>

            {/* Order Status */}
            <div className="border-t border-nubia-gold/20 pt-8">
              <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">Statut de votre Commande</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-nubia-white rounded-full flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-nubia-black">Commande Confirmée</p>
                    <p className="text-sm text-nubia-black/70">Votre commande a été reçue</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-nubia-gold/30 text-nubia-black rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-nubia-black">En Traitement</p>
                    <p className="text-sm text-nubia-black/70">Nous préparons votre commande</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-nubia-gold/30 text-nubia-black rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-nubia-black">Expédiée</p>
                    <p className="text-sm text-nubia-black/70">Vous recevrez un lien de suivi</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-nubia-gold/30 text-nubia-black rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-nubia-black">Livrée</p>
                    <p className="text-sm text-nubia-black/70">Votre commande à votre porte</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8 text-center">
              <MessageSquare className="text-nubia-gold mx-auto mb-4" size={40} />
              <h3 className="font-playfair text-xl font-bold text-nubia-black mb-2">Email de Confirmation</h3>
              <p className="text-nubia-black/70 text-sm">Vous recevrez un email de confirmation avec les détails de votre commande</p>
            </div>

            <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8 text-center">
              <Truck className="text-nubia-gold mx-auto mb-4" size={40} />
              <h3 className="font-playfair text-xl font-bold text-nubia-black mb-2">Lien de Suivi</h3>
              <p className="text-nubia-black/70 text-sm">Nous vous enverrons un lien de suivi dès que votre colis sera expédié</p>
            </div>

            <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8 text-center">
              <Package className="text-nubia-gold mx-auto mb-4" size={40} />
              <h3 className="font-playfair text-xl font-bold text-nubia-black mb-2">Livraison Estimée</h3>
              <p className="text-nubia-black/70 text-sm">Livraison estimée dans 5 à 7 jours ouvrables</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8 mb-12">
            <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">Articles Commandés</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-nubia-gold/20">
                <div>
                  <p className="font-semibold text-nubia-black">Robe Traditionnelle Moderne</p>
                  <p className="text-sm text-nubia-black/70">Taille: M | Couleur: Noir</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-nubia-black">85 000 FCFA</p>
                  <p className="text-sm text-nubia-black/70">Quantité: 1</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-nubia-gold/20 pt-6">
              <div className="flex justify-between text-nubia-black/70">
                <span>Sous-total</span>
                <span>85 000 FCFA</span>
              </div>
              <div className="flex justify-between text-nubia-black/70">
                <span>Livraison</span>
                <span>Gratuit</span>
              </div>
              <div className="flex justify-between text-nubia-black/70">
                <span>Taxes</span>
                <span>10 000 FCFA</span>
              </div>
              <div className="flex justify-between font-playfair text-xl font-bold text-nubia-gold pt-4 border-t border-nubia-gold/20">
                <span>Total</span>
                <span>95 000 FCFA</span>
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white rounded-lg p-8 mb-12">
            <h2 className="font-playfair text-2xl font-bold mb-4">Besoin d'Aide ?</h2>
            <p className="mb-6">Si vous avez des questions concernant votre commande, n'hésitez pas à nous contacter.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a href="mailto:contact@nubiaaura.com" className="flex items-center gap-3 p-4 bg-nubia-white/10 rounded-lg hover:bg-nubia-white/20 transition-colors">
                <span className="text-nubia-gold">✉️</span>
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-sm text-nubia-white/80">contact@nubiaaura.com</p>
                </div>
              </a>

              <a href="tel:+221771234567" className="flex items-center gap-3 p-4 bg-nubia-white/10 rounded-lg hover:bg-nubia-white/20 transition-colors">
                <span className="text-nubia-gold">📞</span>
                <div>
                  <p className="font-semibold">Téléphone</p>
                  <p className="text-sm text-nubia-white/80">+221 77 123 45 67</p>
                </div>
              </a>

              <a href="https://wa.me/221771234567" className="flex items-center gap-3 p-4 bg-nubia-white/10 rounded-lg hover:bg-nubia-white/20 transition-colors">
                <span className="text-nubia-gold">💬</span>
                <div>
                  <p className="font-semibold">WhatsApp</p>
                  <p className="text-sm text-nubia-white/80">+221 77 123 45 67</p>
                </div>
              </a>
            </div>
          </div>

          {/* Special Offer */}
          <div className="bg-nubia-gold/10 border-2 border-nubia-gold rounded-lg p-8 mb-12 text-center">
            <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-2">Offre Spéciale</h2>
            <p className="text-nubia-black/70 mb-4">Recevez 10% de réduction sur votre prochaine commande</p>
            <p className="font-playfair text-3xl font-bold text-nubia-gold mb-4">MERCI10</p>
            <p className="text-sm text-nubia-black/60">Code valable pour votre prochain achat</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/catalogue`}
              className="px-8 py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all text-center"
            >
              {t('merci.back_to_catalog', 'Continuer vos Achats')}
            </Link>
            <Link
              href={`/${locale}`}
              className="px-8 py-4 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all text-center"
            >
              Retour à l'Accueil
            </Link>
          </div>
        </div>
      </section>
  );
}

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-nubia-gold" size={40} />
        </div>
      }>
        <ThankYouContent />
      </Suspense>
      <Footer />
    </div>
  );
}
