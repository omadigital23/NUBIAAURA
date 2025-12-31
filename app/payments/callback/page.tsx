'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/supabase';

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCartContext();
  const { t, locale } = useTranslation();

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [message, setMessage] = useState('Vérification du paiement en cours...');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [sessionRefreshed, setSessionRefreshed] = useState(false);

  // Refresh Supabase session after cross-domain redirect from PayDunya
  useEffect(() => {
    const refreshSession = async () => {
      try {
        console.log('[Payment Callback] Refreshing session after PayDunya redirect...');
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('[Payment Callback] Session refresh failed:', error.message);
        } else if (data.session) {
          console.log('[Payment Callback] Session refreshed successfully for user:', data.session.user.email);
        } else {
          console.log('[Payment Callback] No active session (guest checkout)');
        }
      } catch (e) {
        console.error('[Payment Callback] Session refresh error:', e);
      } finally {
        setSessionRefreshed(true);
      }
    };

    refreshSession();
  }, []);

  // Wait for session refresh before verifying payment
  useEffect(() => {
    if (!sessionRefreshed) return; // Wait for session refresh first

    const verifyPayment = async (currentRetry = 0) => {
      try {
        const orderId = searchParams.get('orderId');
        const reference = searchParams.get('reference');
        const tx_ref = searchParams.get('tx_ref');
        const transaction_id = searchParams.get('transaction_id');
        const fwStatus = searchParams.get('status');
        // PayDunya/Generic param
        const gatewayToken = searchParams.get('token');

        if (!orderId && !tx_ref) {
          setStatus('failed');
          setMessage(t('callback.missing_params', 'Paramètres de paiement manquants'));
          return;
        }

        // Verify payment with backend
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            reference: reference || gatewayToken,
            tx_ref,
            transaction_id,
            status: fwStatus,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(t('callback.success_message', 'Paiement vérifié avec succès!'));
          setOrderDetails({
            orderId: orderId || tx_ref,
            paymentStatus: data.paymentStatus,
            orderStatus: data.orderStatus,
          });

          // Clear cart - try API first, then fallback to localStorage
          try {
            await clearCart();
            console.log('[Payment Callback] Cart cleared via API');
          } catch (cartError) {
            console.warn('[Payment Callback] API cart clear failed, clearing localStorage:', cartError);
            // Fallback: clear any localStorage cart data
            try {
              localStorage.removeItem('cart');
              localStorage.removeItem('cartItems');
              localStorage.removeItem('nubia-cart');
            } catch (e) {
              console.error('[Payment Callback] localStorage clear failed:', e);
            }
          }

          // Redirect to thank you page after 3 seconds
          setTimeout(() => {
            router.push(`/${locale}/merci?orderId=${orderId || tx_ref}`);
          }, 3000);
        } else if (data.isPending && currentRetry < 10) {
          // IPN may not have arrived yet - show pending state and retry
          setStatus('pending');
          setMessage(t('callback.pending_message', `Confirmation en cours... (Tentative ${currentRetry + 1}/10)`));
          setTimeout(() => verifyPayment(currentRetry + 1), 2000);
        } else if (currentRetry >= 10) {
          // Max retries reached - still pending, redirect to orders page
          setStatus('pending');
          setMessage(t('callback.max_retries', 'Le paiement est en cours de traitement. Vous recevrez une confirmation par email.'));
          setTimeout(() => {
            router.push(`/${locale}/commandes`);
          }, 5000);
        } else {
          setStatus('failed');
          setMessage(data.message || t('callback.failed_message', "Le paiement n'a pas pu être vérifié"));
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(error.message || t('common.error', 'Une erreur est survenue'));
      }
    };

    verifyPayment();
  }, [searchParams, router, clearCart, sessionRefreshed, t, locale]);

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="flex-1 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-12 text-center">
            {status === 'loading' && (
              <>
                <Loader className="mx-auto mb-6 text-nubia-gold animate-spin" size={48} />
                <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-4">
                  {t('callback.loading_title', 'Vérification du Paiement')}
                </h1>
                <p className="text-nubia-black/70 text-lg">{message || t('callback.loading_message', 'Vérification du paiement en cours...')}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto mb-6 text-green-500" size={48} />
                <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-4">
                  {t('callback.success_title', 'Paiement Réussi!')}
                </h1>
                <p className="text-nubia-black/70 text-lg mb-6">{message}</p>

                {orderDetails && (
                  <div className="bg-nubia-gold/10 rounded-lg p-6 mb-6 text-left">
                    <h2 className="font-playfair text-xl font-bold text-nubia-black mb-4">
                      {t('callback.details_title', 'Détails de la Commande')}
                    </h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-nubia-black/70">{t('callback.details.order_id', 'ID Commande:')}</span>
                        <span className="font-semibold text-nubia-black">{orderDetails.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-nubia-black/70">{t('callback.details.payment_status', 'Statut Paiement:')}</span>
                        <span className="font-semibold text-green-600">
                          {orderDetails.paymentStatus === 'completed' ? 'Complété' : 'En attente'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-nubia-black/70">{t('callback.details.order_status', 'Statut Commande:')}</span>
                        <span className="font-semibold text-nubia-black">
                          {orderDetails.orderStatus === 'processing' ? 'En traitement' : 'Reçue'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-nubia-black/70 mb-6">
                  {t('callback.redirecting', 'Vous serez redirigé vers la page de confirmation dans quelques secondes...')}
                </p>

                <button
                  onClick={() => router.push(`/${locale}/merci?orderId=${orderDetails?.orderId}`)}
                  className="bg-nubia-gold text-nubia-black font-semibold py-3 px-8 rounded-lg hover:bg-nubia-gold/90 transition-all"
                >
                  {t('callback.buttons.go_to_confirmation', 'Aller à la Confirmation')}
                </button>
              </>
            )}

            {status === 'pending' && (
              <>
                <Loader className="mx-auto mb-6 text-nubia-gold animate-spin" size={48} />
                <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-4">
                  {t('callback.pending_title', 'Confirmation en Cours')}
                </h1>
                <p className="text-nubia-black/70 text-lg mb-6">{message}</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    {t('callback.pending_info', 'Votre paiement a été effectué. Nous attendons la confirmation de PayDunya. Cela peut prendre quelques secondes.')}
                  </p>
                </div>
              </>
            )}

            {status === 'failed' && (
              <>
                <XCircle className="mx-auto mb-6 text-red-500" size={48} />
                <h1 className="font-playfair text-3xl font-bold text-nubia-black mb-4">
                  {t('callback.failed_title', 'Paiement Échoué')}
                </h1>
                <p className="text-red-600 text-lg mb-6">{message}</p>

                <div className="space-y-4">
                  <button
                    onClick={() => router.push(`/${locale}/checkout`)}
                    className="w-full bg-nubia-gold text-nubia-black font-semibold py-3 px-8 rounded-lg hover:bg-nubia-gold/90 transition-all"
                  >
                    {t('callback.buttons.retry_payment', 'Réessayer le Paiement')}
                  </button>
                  <button
                    onClick={() => router.push(`/${locale}/catalogue`)}
                    className="w-full border-2 border-nubia-gold text-nubia-black font-semibold py-3 px-8 rounded-lg hover:bg-nubia-gold/10 transition-all"
                  >
                    {t('callback.buttons.back_to_catalog', 'Retour au Catalogue')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-nubia-white flex items-center justify-center">
        <Loader className="animate-spin text-nubia-gold" size={40} />
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
