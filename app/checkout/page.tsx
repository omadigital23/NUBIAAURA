'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { Lock, AlertCircle } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import CheckoutDebugPanel from '@/components/CheckoutDebugPanel';

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, clearCart, loading: cartLoading } = useCartContext();
  const { t, locale } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'cod' | ''>('');
  const [quote, setQuote] = useState<{ subtotal: number; shipping: number; tax: number; total: number } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
  });

  // Pré-remplir le formulaire avec les données de l'utilisateur connecté
  useEffect(() => {
    if (user && isAuthenticated && !authLoading) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        firstName: (user as any).first_name || prev.firstName,
        lastName: (user as any).last_name || prev.lastName,
        phone: (user as any).phone || prev.phone,
      }));
    }
  }, [user, isAuthenticated, authLoading]);

  const isAddressValid = useMemo(() => {
    return (
      !!formData.firstName &&
      !!formData.lastName &&
      !!formData.email &&
      !!formData.phone &&
      !!formData.address &&
      !!formData.city &&
      !!formData.country
    );
  }, [formData]);

  // Redirect to catalog if cart empty (only after cart finished loading)
  // BUT NOT if we're processing an order (to allow redirect to thank you page)
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0 && !isProcessingOrder) {
      console.log('[Checkout] Panier vide et pas de commande en cours, redirection vers catalogue');
      router.push(`/${locale}/catalogue`);
    }
  }, [cartItems, cartLoading, isProcessingOrder, router, locale]);

  useEffect(() => {
    let aborted = false;
    const run = async () => {
      if (cartItems.length === 0) {
        setQuote(null);
        setQuoteError(null);
        setQuoteLoading(false);
        console.log('[Checkout] Panier vide, quote reset');
        return;
      }
      
      console.log('[Checkout] Démarrage calcul quote pour', cartItems.length, 'produits');
      console.log('[Checkout] quoteLoading = true (début calcul)');
      setQuoteLoading(true);
      setQuoteError(null);
      
      try {
        const res = await fetch('/api/checkout/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale,
            shippingMethod,
            items: cartItems.map((it) => ({ product_id: it.id, quantity: it.quantity })),
          }),
        });
        
        const data = await res.json();
        console.log('[Checkout] Réponse quote API:', data);
        
        if (!aborted) {
          if (!res.ok || !data?.success) {
            setQuote(null);
            setQuoteError(typeof data?.error === 'string' ? data.error : 'Une erreur est survenue');
            console.error('[Checkout] Erreur quote:', data.error);
          } else {
            setQuote(data.quote);
            setQuoteError(null);
            console.log('[Checkout] Quote calculé avec succès:', data.quote);
          }
        }
      } catch (err) {
        console.error('[Checkout] Exception lors du calcul quote:', err);
        if (!aborted) {
          setQuote(null);
          setQuoteError('Une erreur est survenue');
        }
      } finally {
        if (!aborted) {
          setQuoteLoading(false);
          console.log('[Checkout] quoteLoading = false');
        }
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [cartItems, shippingMethod, locale]);

  // Fix: Force quoteLoading to false if quote is already calculated
  useEffect(() => {
    if (quote && quoteLoading) {
      console.log('[Checkout] FIX: Quote déjà calculé mais quoteLoading=true, correction...');
      setQuoteLoading(false);
    }
  }, [quote, quoteLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingMethod(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Vérifier si l'utilisateur est connecté
      if (!isAuthenticated && !authLoading) {
        setLoading(false);
        setShowAuthModal(true);
        return;
      }

      // Validate form data
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.country) {
        setError(t('checkout.errors.missing_fields', 'Veuillez remplir tous les champs'));
        setLoading(false);
        return;
      }

      console.log('[Checkout] handleSubmit called');
      console.log('[Checkout] Selected payment method (from state):', paymentMethod);
      console.log('[Checkout] Step:', step);
      
      // Marquer qu'on traite une commande pour éviter la redirection automatique
      setIsProcessingOrder(true);

      // Require explicit payment method selection
      if (step === 3 && (!paymentMethod || (paymentMethod !== 'cod' && paymentMethod !== 'flutterwave'))) {
        setError(t('checkout.errors.select_payment', 'Veuillez choisir un mode de paiement'));
        setLoading(false);
        return;
      }

      // Generate order ID (client-side reference when needed)
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('[Checkout] Generated orderId:', orderId);

      // Branch by payment method
      if (paymentMethod === 'cod') {
        console.log('[Checkout] Processing COD payment');
        // Cash on Delivery: create order server-side without initializing payment
        console.log('[Checkout] COD flow: creating order with items:', cartItems.length);
        const response = await fetch('/api/orders/cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': orderId },
          body: JSON.stringify({
            shippingMethod,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            country: formData.country,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            items: cartItems.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          }),
        });

        console.log('[Checkout] COD response status:', response.status);
        const data = await response.json();
        console.log('[Checkout] COD response data:', data);
      
        if (!response.ok || !data?.order?.id) {
          throw new Error(data?.error || t('checkout.errors.cod_failed', 'Erreur lors de la création de la commande (COD)'));
        }

        console.log('[Checkout] COD order created:', data.order.id, '- clearing cart and redirecting');
        // Clear cart and go to thank you page
        clearCart();
        console.log('[Checkout] Cart cleared, redirecting to:', `/${locale}/merci?orderId=${data.order.id}`);
        
        // Redirection immédiate avec window.location pour éviter les useEffect
        window.location.href = `/${locale}/merci?orderId=${data.order.id}`;
        return;
      }

      console.log('[Checkout] Processing Flutterwave payment');
      // Initialize payment with Flutterwave (with timeout to avoid infinite loading)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': orderId,
        },
        body: JSON.stringify({
          orderId,
          amount: total,
          email: formData.email,
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          customerName: `${formData.firstName} ${formData.lastName}`,
          shippingMethod,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          country: formData.country,
          cartItems: cartItems.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log('[Checkout] Payment initialization response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Checkout] Payment initialization error data:', errorData);
        throw new Error(errorData.error || t('checkout.errors.payment_init_failed', "Erreur lors de l'initialisation du paiement"));
      }

      const paymentData = await response.json();
      console.log('[Checkout] Payment initialization response data:', paymentData);

      // Redirect to Flutterwave payment page
      if (paymentData.paymentLink) {
        console.log('[Checkout] Redirecting to payment link:', paymentData.paymentLink);
        window.location.href = paymentData.paymentLink;
      } else {
        throw new Error(t('checkout.errors.payment_link_missing', 'Lien de paiement non reçu'));
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      if (err?.name === 'AbortError') {
        setError(t('checkout.errors.timeout', 'Le paiement prend trop de temps. Veuillez réessayer.'));
      } else {
        setError(err.message || t('common.error', 'Une erreur est survenue'));
      }
      setLoading(false);
    }
  };

  const clientSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const clientShipping = shippingMethod === 'express' ? 15000 : clientSubtotal > 100000 ? 0 : 5000;
  const clientTax = Math.round(clientSubtotal * 0.18);
  const clientTotal = clientSubtotal + clientShipping + clientTax;
  const subtotal = quote?.subtotal ?? clientSubtotal;
  const shipping = quote?.shipping ?? clientShipping;
  const tax = quote?.tax ?? clientTax;
  const total = quote?.total ?? clientTotal;

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Checkout Section */}
      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-4xl font-bold text-nubia-black mb-12">{t('checkout.title', 'Paiement')}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Form */}
            <div className="md:col-span-2">
              {/* Steps */}
              <div className="flex gap-4 mb-12">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1">
                    <button
                      onClick={() => {
                        if (s <= 1) return setStep(1);
                        if (s === 2) return setStep(2);
                        // s === 3 requires address valid
                        if (!isAddressValid) {
                          setError(t('checkout.errors.missing_fields', 'Veuillez remplir tous les champs'));
                          return;
                        }
                        setStep(3);
                      }}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${
                        step === s
                          ? 'bg-nubia-gold text-nubia-black'
                          : 'bg-nubia-gold/20 text-nubia-black/70'
                      }`}
                    >
                      {s === 1 ? t('checkout.steps.address', 'Adresse') : s === 2 ? t('checkout.steps.shipping', 'Livraison') : t('checkout.steps.payment', 'Paiement')}
                    </button>
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="text-red-500" size={20} />
                  <p className="text-red-700">{error}</p>
                </div>
              )}
              {quoteError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="text-red-500" size={20} />
                  <p className="text-red-700">{quoteError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Address */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">{t('checkout.address.title', 'Adresse de Livraison')}</h2>

                    <div className="grid grid-cols-2 gap-6">
                      <input
                        type="text"
                        name="firstName"
                        placeholder={t('checkout.address.first_name', 'Prénom')}
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder={t('checkout.address.last_name', 'Nom')}
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      />
                    </div>

                    <input
                      type="email"
                      name="email"
                      placeholder={t('checkout.address.email', 'Email')}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    />

                    <input
                      type="tel"
                      name="phone"
                      placeholder={t('checkout.address.phone', 'Téléphone')}
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    />

                    <input
                      type="text"
                      name="address"
                      placeholder={t('checkout.address.address', 'Adresse')}
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <input
                        type="text"
                        name="city"
                        placeholder={t('checkout.address.city', 'Ville')}
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      />
                      <input
                        type="text"
                        name="zipCode"
                        placeholder={t('checkout.address.zip', 'Code Postal')}
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      />
                    </div>

                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    >
                      <option value="">{t('checkout.address.select_country', 'Sélectionnez un pays')}</option>
                      <option value="SN">Sénégal</option>
                      <option value="CI">Côte d'Ivoire</option>
                      <option value="ML">Mali</option>
                      <option value="BF">Burkina Faso</option>
                    </select>
                  </div>
                )}

                {/* Step 2: Shipping */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">{t('checkout.shipping.title', 'Méthode de Livraison')}</h2>

                    <div className="space-y-4">
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        shippingMethod === 'standard' 
                          ? 'border-nubia-gold bg-nubia-gold/10' 
                          : 'border-nubia-gold/30 hover:bg-nubia-gold/10'
                      }`}>
                        <input 
                          type="radio" 
                          name="shipping" 
                          value="standard" 
                          checked={shippingMethod === 'standard'}
                          onChange={handleShippingChange}
                          className="mr-4" 
                        />
                        <div>
                          <p className="font-semibold text-nubia-black">{t('checkout.shipping.standard', 'Livraison Standard')}</p>
                          <p className="text-sm text-nubia-black/70">{t('checkout.shipping.standard_desc', '5 à 7 jours ouvrables - 5 000 FCFA')}</p>
                        </div>
                      </label>

                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        shippingMethod === 'express' 
                          ? 'border-nubia-gold bg-nubia-gold/10' 
                          : 'border-nubia-gold/30 hover:bg-nubia-gold/10'
                      }`}>
                        <input 
                          type="radio" 
                          name="shipping" 
                          value="express" 
                          checked={shippingMethod === 'express'}
                          onChange={handleShippingChange}
                          className="mr-4" 
                        />
                        <div>
                          <p className="font-semibold text-nubia-black">{t('checkout.shipping.express', 'Livraison Express')}</p>
                          <p className="text-sm text-nubia-black/70">{t('checkout.shipping.express_desc', '2 à 3 jours ouvrables - 15 000 FCFA')}</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">{t('checkout.payment.title', 'Informations de Paiement')}</h2>

                    <div className="flex items-center gap-2 p-4 bg-nubia-gold/10 rounded-lg">
                      <Lock className="text-nubia-gold" size={20} />
                      <p className="text-sm text-nubia-black/70">{t('checkout.payment.secured_by', 'Paiement sécurisé par Flutterwave')}</p>
                    </div>

                    <div className="space-y-4">
                      <label
                        onClick={() => setPaymentMethod('flutterwave')}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'flutterwave' ? 'border-nubia-gold bg-nubia-gold/10' : 'border-nubia-gold/30 hover:bg-nubia-gold/10'
                      }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="flutterwave"
                          checked={paymentMethod === 'flutterwave'}
                          onChange={(e) => {
                            console.log('[Checkout] Flutterwave radio clicked, value:', e.target.value);
                            setPaymentMethod('flutterwave');
                            console.log('[Checkout] paymentMethod state updated to: flutterwave');
                          }}
                          className="mr-4"
                        />
                        <div>
                          <p className="font-semibold text-nubia-black">{t('checkout.payment.flutterwave', 'Payer en ligne (Flutterwave)')}</p>
                          <p className="text-sm text-nubia-black/70">{t('checkout.payment.flutterwave_desc', 'Carte, Mobile Money')}</p>
                        </div>
                      </label>

                      <label
                        onClick={() => setPaymentMethod('cod')}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'cod' ? 'border-nubia-gold bg-nubia-gold/10' : 'border-nubia-gold/30 hover:bg-nubia-gold/10'
                      }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => {
                            console.log('[Checkout] COD radio clicked, value:', e.target.value);
                            setPaymentMethod('cod');
                            console.log('[Checkout] paymentMethod state updated to: cod');
                          }}
                          className="mr-4"
                        />
                        <div>
                          <p className="font-semibold text-nubia-black">{t('checkout.payment.cod', 'Paiement à la livraison')}</p>
                          <p className="text-sm text-nubia-black/70">{t('checkout.payment.cod_desc', 'Régler à la réception de votre commande')}</p>
                        </div>
                      </label>
                    </div>

                    {paymentMethod === 'flutterwave' && (
                      <p className="text-sm text-nubia-black/70">
                        {t('checkout.payment.note', 'Vous serez redirigé vers la plateforme de paiement sécurisée Flutterwave pour compléter votre paiement.')}
                      </p>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-12">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex-1 py-4 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all"
                    >
                      {t('checkout.actions.prev', 'Précédent')}
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 1 && !isAddressValid) {
                          setError(t('checkout.errors.missing_fields', 'Veuillez remplir tous les champs'));
                          return;
                        }
                        setError(null);
                        setStep(step + 1);
                      }}
                      className="flex-1 py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={step === 1 && !isAddressValid}
                    >
                      {t('checkout.actions.next', 'Suivant')}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || quoteLoading || cartItems.length === 0 || paymentMethod === ''}
                      onClick={() => {
                        console.log('[Checkout] Bouton cliqué - État:', {
                          loading,
                          quoteLoading,
                          cartItemsCount: cartItems.length,
                          paymentMethod,
                          isDisabled: loading || quoteLoading || cartItems.length === 0 || paymentMethod === ''
                        });
                      }}
                      className="flex-1 py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? t('checkout.actions.processing', 'Traitement...') : t('cart.checkout', 'Passer la commande')}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-nubia-white/50 border border-nubia-gold/20 rounded-lg p-8 h-fit sticky top-20">
              <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">{t('checkout.order_summary', 'Résumé de la Commande')}</h2>

              {cartItems.length === 0 ? (
                <p className="text-nubia-black/70 text-center py-8">Votre panier est vide</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6 border-b border-nubia-gold/20 pb-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <p className="font-semibold text-nubia-black">{item.name}</p>
                          <p className="text-sm text-nubia-black/70">Quantité: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-nubia-black">{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mb-6 border-b border-nubia-gold/20 pb-6">
                    <div className="flex justify-between text-nubia-black/70">
                      <span>Sous-total</span>
                      <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between text-nubia-black/70">
                      <span>Livraison</span>
                      <span>{shipping === 0 ? 'Gratuit' : `${shipping.toLocaleString('fr-FR')} FCFA`}</span>
                    </div>
                    <div className="flex justify-between text-nubia-black/70">
                      <span>Taxes</span>
                      <span>{tax.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-playfair text-xl font-bold text-nubia-black">Total</span>
                    <span className="font-playfair text-2xl font-bold text-nubia-gold">{total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={() => {
          setShowAuthModal(false);
          // Le formulaire sera pré-rempli automatiquement via le useEffect
        }}
      />

      {/* Debug Panel - Appuyez sur Ctrl+D pour afficher */}
      <CheckoutDebugPanel
        loading={loading}
        quoteLoading={quoteLoading}
        cartItemsCount={cartItems.length}
        paymentMethod={paymentMethod}
        quote={quote}
        quoteError={quoteError}
      />
    </div>
  );
}
