'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { AlertCircle } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import CheckoutDebugPanel from '@/components/CheckoutDebugPanel';
import { trackBeginCheckout, trackAddShippingInfo, trackAddPaymentInfo } from '@/lib/analytics-config';
import { CountrySelect, PhoneInput, type CountryData } from '@/components/checkout/CountryPhoneInput';
import { PaymentMethodsSelector } from '@/components/checkout/PaymentMethodsSelector';
import { getPriceForCountry, getCurrencyForCountry } from '@/lib/utils/currency-converter';
import { supabase } from '@/lib/supabase';

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
  const [paymentMethod, setPaymentMethod] = useState<'paydunya' | 'cod' | ''>('');
  const [paymentSubMethod, setPaymentSubMethod] = useState<string>('');
  const [quote, setQuote] = useState<{ subtotal: number; shipping: number; tax: number; total: number } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<{ code: string; amount: number; description?: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

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

  // Pré-remplir le formulaire avec les données de l'utilisateur connecté et son adresse par défaut
  useEffect(() => {
    const fetchUserDataAndAddress = async () => {
      if (!user || !isAuthenticated || authLoading) return;

      console.log('[Checkout] User data from useAuth:', user);

      // Utiliser directement les données de user (qui viennent de /api/auth/me)
      // Parser full_name si first_name/last_name sont vides
      let firstName = (user as any).first_name || '';
      let lastName = (user as any).last_name || '';

      if (!firstName && !lastName && user.name) {
        const nameParts = user.name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        firstName: firstName || prev.firstName,
        lastName: lastName || prev.lastName,
        phone: (user as any).phone || prev.phone,
      }));

      console.log('[Checkout] Form pre-filled with:', {
        email: user.email,
        firstName,
        lastName,
        phone: (user as any).phone
      });

      // 3. Ensuite, chercher l'adresse par défaut de l'utilisateur dans Supabase
      try {
        const { data: defaultAddress, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();

        if (!error && defaultAddress) {
          console.log('[Checkout] Adresse par défaut trouvée:', defaultAddress);

          // Mettre à jour le formulaire avec l'adresse par défaut (écrase les données du profil pour l'adresse)
          setFormData((prev) => ({
            ...prev,
            // Ne pas écraser prénom/nom si déjà remplis du profil
            firstName: prev.firstName || defaultAddress.full_name?.split(' ')[0] || prev.firstName,
            lastName: prev.lastName || defaultAddress.full_name?.split(' ').slice(1).join(' ') || prev.lastName,
            phone: prev.phone || defaultAddress.phone || prev.phone,
            address: defaultAddress.address_line1 || prev.address,
            city: defaultAddress.city || prev.city,
            zipCode: defaultAddress.postal_code || prev.zipCode,
            country: defaultAddress.country || prev.country,
          }));
        } else {
          // Si pas d'adresse par défaut, chercher la dernière adresse utilisée
          const { data: latestAddress } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (latestAddress) {
            console.log('[Checkout] Dernière adresse trouvée:', latestAddress);
            setFormData((prev) => ({
              ...prev,
              firstName: prev.firstName || latestAddress.full_name?.split(' ')[0] || prev.firstName,
              lastName: prev.lastName || latestAddress.full_name?.split(' ').slice(1).join(' ') || prev.lastName,
              phone: prev.phone || latestAddress.phone || prev.phone,
              address: latestAddress.address_line1 || prev.address,
              city: latestAddress.city || prev.city,
              zipCode: latestAddress.postal_code || prev.zipCode,
              country: latestAddress.country || prev.country,
            }));
          }
        }
      } catch (err) {
        console.error('[Checkout] Erreur lors de la récupération de l\'adresse:', err);
      }
    };

    fetchUserDataAndAddress();
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

  // Track begin checkout when user reaches checkout page with items
  useEffect(() => {
    if (cartItems.length > 0 && !authLoading) {
      try {
        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        trackBeginCheckout({
          value: subtotal,
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name || '',
            price: item.price,
            quantity: item.quantity,
          })),
        });
      } catch (e) {
        console.error('Analytics tracking error:', e);
      }
    }
  }, []); // Only track once on mount

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
    const newShippingMethod = e.target.value;
    setShippingMethod(newShippingMethod);

    // Track shipping info selection
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      trackAddShippingInfo({
        value: subtotal,
        shipping_tier: newShippingMethod,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name || '',
          price: item.price,
          quantity: item.quantity,
        })),
      });
    } catch (e) {
      console.error('Analytics tracking error:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Guest checkout - no auth required, just validate form
      // If user wants to login, they can use the auth modal

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
      if (step === 3 && (!paymentMethod || (paymentMethod !== 'cod' && paymentMethod !== 'paydunya'))) {
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
        try {
          await clearCart();
          console.log('[Checkout] Cart cleared successfully');
        } catch (clearError) {
          console.error('[Checkout] Error clearing cart:', clearError);
          // Continue anyway - order is already created
        }

        console.log('[Checkout] Redirecting to:', `/${locale}/merci?orderId=${data.order.id}`);

        // Redirection avec window.location pour éviter les useEffect
        window.location.href = `/${locale}/merci?orderId=${data.order.id}`;
        return;
      }

      console.log('[Checkout] Processing online payment:', paymentMethod);
      // Initialize payment with PayDunya (with timeout to avoid infinite loading)
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
          paymentMethod, // 'paydunya' only
          paymentSubMethod, // 'wave', 'orange_money', 'card', etc.
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

      // Redirect to payment page (PayDunya)
      if (paymentData.paymentLink || paymentData.redirect_url) {
        console.log('[Checkout] Redirecting to payment link:', paymentData.paymentLink || paymentData.redirect_url);
        window.location.href = paymentData.paymentLink || paymentData.redirect_url;
      } else if (paymentData.formData) {
        // Some gateways may require form submission
        console.log('[Checkout] Gateway form submission required');
        // Create and submit form for gateway
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentData.gatewayUrl;
        Object.entries(paymentData.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
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
  const clientTax = 0; // No taxes applied
  const clientTotal = clientSubtotal + clientShipping + clientTax;
  const subtotal = quote?.subtotal ?? clientSubtotal;
  const shipping = quote?.shipping ?? clientShipping;
  const tax = quote?.tax ?? clientTax;
  const total = quote?.total ?? clientTotal;

  // Currency conversion based on selected country
  const priceDisplay = useMemo(() => {
    const country = formData.country || 'SN'; // Default to Senegal
    const currency = getCurrencyForCountry(country);

    const convertedSubtotal = getPriceForCountry(subtotal, country, locale as 'fr' | 'en');
    const convertedShipping = getPriceForCountry(shipping, country, locale as 'fr' | 'en');
    const convertedTax = getPriceForCountry(tax, country, locale as 'fr' | 'en');
    const convertedTotal = getPriceForCountry(total, country, locale as 'fr' | 'en');

    return {
      currency,
      subtotal: convertedSubtotal,
      shipping: convertedShipping,
      tax: convertedTax,
      total: convertedTotal,
      // Helper to format any XOF amount to display currency
      formatPrice: (amountXOF: number) => getPriceForCountry(amountXOF, country, locale as 'fr' | 'en').formatted,
    };
  }, [formData.country, subtotal, shipping, tax, total, locale]);

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
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${step === s
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

                    {/* Country Selection - Full list with search and flags */}
                    <CountrySelect
                      value={formData.country}
                      onChange={(country: CountryData) => {
                        setFormData(prev => ({
                          ...prev,
                          country: country.code,
                          // Auto-fill phone code if phone is empty or only has a previous code
                          phone: prev.phone && !prev.phone.startsWith('+')
                            ? `${country.phoneCode} ${prev.phone}`
                            : country.phoneCode + ' ',
                        }));
                      }}
                      placeholder={t('checkout.address.select_country', 'Sélectionnez votre pays')}
                    />

                    {/* Phone Input with auto country code */}
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                      countryCode={formData.country}
                      label={t('checkout.address.phone', 'Téléphone')}
                      required
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
                  </div>
                )}

                {/* Step 2: Shipping */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-playfair text-2xl font-bold text-nubia-black mb-6">{t('checkout.shipping.title', 'Méthode de Livraison')}</h2>

                    <div className="space-y-4">
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${shippingMethod === 'standard'
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

                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${shippingMethod === 'express'
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
                    {/* Dynamic Payment Methods based on selected country */}
                    <PaymentMethodsSelector
                      country={formData.country}
                      selectedMethod={paymentMethod}
                      selectedSubMethod={paymentSubMethod as any}
                      onMethodChange={(method, subMethod) => {
                        console.log('[Checkout] Payment method changed:', method, subMethod);
                        setPaymentMethod(method);
                        setPaymentSubMethod(subMethod || '');

                        // Track analytics
                        try {
                          const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                          trackAddPaymentInfo({
                            value: subtotal,
                            payment_type: method,
                            items: cartItems.map(item => ({
                              id: item.id,
                              name: item.name || '',
                              price: item.price,
                              quantity: item.quantity,
                            })),
                          });
                        } catch (err) {
                          console.error('Analytics tracking error:', err);
                        }
                      }}
                      disabled={loading}
                    />
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
                        <p className="font-semibold text-nubia-black">{priceDisplay.formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mb-6 border-b border-nubia-gold/20 pb-6">
                    <div className="flex justify-between text-nubia-black/70">
                      <span>Sous-total</span>
                      <span>{priceDisplay.subtotal.formatted}</span>
                    </div>
                    <div className="flex justify-between text-nubia-black/70">
                      <span>Livraison</span>
                      <span>{shipping === 0 ? 'Gratuit' : priceDisplay.shipping.formatted}</span>
                    </div>
                    <div className="flex justify-between text-nubia-black/70">
                      <span>Taxes</span>
                      <span>{priceDisplay.tax.formatted}</span>
                    </div>
                    {promoDiscount && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>✔ {promoDiscount.code}</span>
                        <span>-{priceDisplay.formatPrice(promoDiscount.amount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code Input */}
                  <div className="mb-6">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder={t('checkout.promo.placeholder', 'Code promo')}
                        disabled={promoLoading || !!promoDiscount}
                        className="flex-1 px-3 py-2 text-sm border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold disabled:bg-gray-100"
                      />
                      {promoDiscount ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPromoDiscount(null);
                            setPromoCode('');
                            setPromoError(null);
                          }}
                          className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                        >
                          ✕
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!promoCode.trim()) return;
                            setPromoLoading(true);
                            setPromoError(null);
                            try {
                              const res = await fetch('/api/promo/validate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ code: promoCode, orderAmount: subtotal }),
                              });
                              const data = await res.json();
                              if (data.valid) {
                                setPromoDiscount({
                                  code: data.code,
                                  amount: data.discountAmount,
                                  description: data.description,
                                });
                              } else {
                                setPromoError(data.error || 'Code invalide');
                              }
                            } catch {
                              setPromoError('Erreur de validation');
                            } finally {
                              setPromoLoading(false);
                            }
                          }}
                          disabled={promoLoading || !promoCode.trim()}
                          className="px-3 py-2 text-sm bg-nubia-gold text-nubia-black font-medium rounded-lg hover:bg-nubia-gold/80 disabled:opacity-50"
                        >
                          {promoLoading ? '...' : t('checkout.promo.apply', 'Appliquer')}
                        </button>
                      )}
                    </div>
                    {promoError && (
                      <p className="mt-2 text-sm text-red-600">{promoError}</p>
                    )}
                    {promoDiscount?.description && (
                      <p className="mt-2 text-sm text-green-600">{promoDiscount.description}</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-playfair text-xl font-bold text-nubia-black">Total</span>
                    <span className="font-playfair text-2xl font-bold text-nubia-gold">
                      {priceDisplay.formatPrice(total - (promoDiscount?.amount || 0))}
                    </span>
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
