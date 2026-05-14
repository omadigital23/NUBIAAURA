"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader, Package, Truck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface OrderDetails {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  shipping_address: any;
  shipping_method: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    name: string;
    image_url: string;
  };
}

/* ── Animated Gold Checkmark ──────────────────────────────────── */
function GoldCheckmark() {
  return (
    <motion.div
      className="relative w-28 h-28 mx-auto mb-8"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
    >
      {/* Outer ring */}
      <motion.svg
        viewBox="0 0 120 120"
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.circle
          cx="60" cy="60" r="56"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeDasharray="352"
          initial={{ strokeDashoffset: 352 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeInOut' }}
        />
      </motion.svg>
      {/* Inner glow */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-nubia-gold/20 to-nubia-gold/5" />
      {/* Checkmark path */}
      <motion.svg
        viewBox="0 0 120 120"
        className="absolute inset-0 w-full h-full"
      >
        <motion.path
          d="M35 60L52 77L85 44"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
        />
      </motion.svg>
    </motion.div>
  );
}

/* ── Floating Gold Particles ──────────────────────────────────── */
function GoldParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-nubia-gold/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${4 + Math.random() * 6}s`,
            animation: `float-particle ${4 + Math.random() * 6}s ease-in-out infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px) scale(1.5); opacity: 0.7; }
          50% { transform: translateY(-40px) translateX(-5px) scale(1); opacity: 0.4; }
          75% { transform: translateY(-15px) translateX(15px) scale(1.3); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('orderId');
    setOrderId(id);
    if (id) {
      fetchOrderDetails(id);
    } else {
      setLoading(false);
    }
  }, [searchParams, locale]);
  
  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.order);
      } else {
        setError('Unable to load order details');
      }
    } catch (err) {
      console.error('[ThankYou] Exception fetching order:', err);
      setError('Unable to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="flex-1 py-20 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-nubia-gold mx-auto mb-4" size={48} />
          <p className="text-nubia-black/70">{t('common.loading', 'Chargement...')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 py-16 md:py-20 relative">
      <GoldParticles />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Success Header */}
        <div className="text-center mb-12">
          <GoldCheckmark />

          <motion.h1
            className="font-playfair text-4xl md:text-5xl font-bold text-nubia-black mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            {t('merci.title', 'Merci pour votre commande !')}
          </motion.h1>
          <motion.p
            className="text-nubia-black/70 text-lg mb-4 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            {t('merci.subtitle', 'Nous vous avons envoyé un e-mail de confirmation avec les détails de votre commande.')}
          </motion.p>
          <motion.p
            className="text-nubia-black/50 text-base max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            {t('merci.appreciation', 'Nous apprécions votre confiance et sommes ravis de vous compter parmi nos clients.')}
          </motion.p>
        </div>

        {/* Order Number — Premium display */}
        {orderId && (
          <motion.div
            className="bg-gradient-to-r from-nubia-black via-nubia-dark to-nubia-black rounded-xl p-8 mb-8 text-center border border-nubia-gold/30 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          >
            <p className="text-nubia-gold/70 text-sm uppercase tracking-widest font-semibold mb-3">
              {t('merci.order_number', 'Numéro de commande')}
            </p>
            <p className="font-playfair text-3xl md:text-4xl font-bold text-nubia-gold tracking-wide">
              {orderDetails?.order_number || orderId}
            </p>
          </motion.div>
        )}

        {/* Order Details */}
        {orderDetails && (
          <motion.div
            className="bg-nubia-white border-2 border-nubia-gold/20 rounded-xl p-8 mb-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
                  {t('merci.order_details', 'Détails de la commande')}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Package className="text-nubia-gold mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-nubia-black/60">{t('merci.order_number', 'Numéro de commande')}</p>
                      <p className="font-semibold text-nubia-black">{orderDetails.order_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Truck className="text-nubia-gold mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-nubia-black/60">{t('merci.shipping_method', 'Méthode de livraison')}</p>
                      <p className="font-semibold text-nubia-black">
                        {orderDetails.shipping_method === 'standard' 
                          ? t('checkout.shipping.standard', 'Livraison Standard')
                          : t('checkout.shipping.express', 'Livraison Express')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="text-nubia-gold mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-nubia-black/60">{t('merci.order_date', 'Date de commande')}</p>
                      <p className="font-semibold text-nubia-black">
                        {new Date(orderDetails.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
                  {t('merci.delivery_address', 'Adresse de livraison')}
                </h2>
                
                <div className="bg-gradient-to-br from-nubia-gold/5 to-nubia-cream/50 rounded-lg p-5 border border-nubia-gold/10">
                  <p className="font-semibold text-nubia-black mb-2">
                    {orderDetails.shipping_address?.firstName} {orderDetails.shipping_address?.lastName}
                  </p>
                  <p className="text-nubia-black/70 mb-1">{orderDetails.shipping_address?.address}</p>
                  <p className="text-nubia-black/70 mb-1">
                    {orderDetails.shipping_address?.zipCode && `${orderDetails.shipping_address.zipCode} `}
                    {orderDetails.shipping_address?.city}
                  </p>
                  <p className="text-nubia-black/70 mb-3">{orderDetails.shipping_address?.country}</p>
                  <p className="text-nubia-black/70">{orderDetails.shipping_address?.phone}</p>
                  <p className="text-nubia-black/70">{orderDetails.shipping_address?.email}</p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-nubia-gold/20 mt-8 pt-6">
              <div className="flex justify-between items-center">
                <span className="font-playfair text-2xl font-bold text-nubia-black">
                  {t('checkout.order_summary', 'Total')}
                </span>
                <span className="font-playfair text-3xl font-bold text-nubia-gold">
                  {orderDetails.total.toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Order Items Summary */}
        {orderDetails?.order_items && orderDetails.order_items.length > 0 && (
          <motion.div
            className="bg-nubia-white border-2 border-nubia-gold/20 rounded-xl p-8 mb-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.7 }}
          >
            <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
              {t('merci.items_summary', 'Résumé de votre commande')}
            </h2>
            
            <div className="space-y-4">
              {orderDetails.order_items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-nubia-cream/30 rounded-lg border border-nubia-gold/15">
                  {item.products?.image_url && (
                    <div className="w-20 h-20 flex-shrink-0 bg-nubia-gold/10 rounded-lg overflow-hidden">
                      <img
                        src={item.products.image_url}
                        alt={item.products?.name || 'Produit'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-playfair font-bold text-nubia-black mb-2">
                      {item.products?.name || 'Produit'}
                    </h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-nubia-black/70 text-sm">
                          {t('cart.quantity', 'Quantité')}: {item.quantity}
                        </p>
                        <p className="text-nubia-gold font-semibold">
                          {Number(item.price).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                        </p>
                      </div>
                      <p className="font-bold text-nubia-black">
                        {Number(item.price * item.quantity).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-nubia-gold/20 mt-6 pt-6">
              <div className="flex justify-between items-center">
                <span className="font-playfair text-xl font-bold text-nubia-black">
                  {t('merci.items_total', 'Total des articles')}
                </span>
                <span className="font-playfair text-2xl font-bold text-nubia-gold">
                  {orderDetails.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('fr-FR')} {t('common.currency', 'FCFA')}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* No Order ID */}
        {!orderId && (
          <div className="bg-nubia-gold/10 border-2 border-nubia-gold/20 rounded-xl p-6 mb-8 text-center">
            <p className="text-nubia-black/70">
              {t('merci.no_order_id', 'Aucun numéro de commande fourni.')}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* CTAs */}
        <motion.div
          className="mb-8 flex flex-col justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.8 }}
        >
          <Link
            href={`/${locale}/client/orders`}
            className="px-8 py-3.5 bg-nubia-black text-nubia-white font-bold rounded-lg hover:bg-nubia-gold hover:text-nubia-black border-2 border-nubia-black transition-all duration-300 text-center shadow-lg"
          >
            {t('merci.track_order', 'Suivre ma commande')}
          </Link>
          <Link
            href={`/${locale}/catalogue`}
            className="px-8 py-3.5 bg-nubia-gold text-nubia-black font-bold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 text-center shadow-lg shadow-nubia-gold/20"
          >
            {t('merci.continue_shopping', 'Continuer mes achats')}
          </Link>
        </motion.div>
        
        {/* Additional Info */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.0 }}
        >
          <p className="text-nubia-black/50 text-sm">
            {t('merci.support_info', 'Pour toute question concernant votre commande, contactez notre service client à service@nubia-aura.com ou appelez-nous au +221 77 143 01 37')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-nubia-white via-nubia-cream/20 to-nubia-white flex flex-col">
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
