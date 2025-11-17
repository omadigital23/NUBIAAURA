'use client';

import Link from 'next/link';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getProductImageUrl } from '@/lib/media';

export default function CustomOrderPage() {
  const { t, locale } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: '',
    measurements: '',
    preferences: '',
    budget: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      // Convertir le budget en nombre
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget) || 0,
      };

      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        type: '',
        measurements: '',
        preferences: '',
        budget: '',
      });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      console.error('Error:', error);
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      step: '1',
      title: t('custom.step1_title', 'Fill Out the Form'),
      desc: t('custom.step1_desc', 'Share your details and preferences'),
    },
    {
      step: '2',
      title: t('custom.step2_title', 'We Contact You'),
      desc: t('custom.step2_desc', 'Let\'s discuss your vision and details'),
    },
    {
      step: '3',
      title: t('custom.step3_title', 'Creation'),
      desc: t('custom.step3_desc', 'We create your unique piece'),
    },
    {
      step: '4',
      title: t('custom.step4_title', 'Delivery'),
      desc: t('custom.step4_desc', 'Satisfaction guaranteed'),
    },
  ];

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section - Premium */}
      <section className="relative overflow-hidden bg-gradient-to-br from-nubia-black via-nubia-dark to-nubia-black text-nubia-white py-20 md:py-28">
        {/* Décoration subtile */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-nubia-gold/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-nubia-gold/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Mini badge */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-nubia-gold/20 border border-nubia-gold/40 rounded-full">
              <span className="text-nubia-gold text-sm font-semibold">✨ Premium</span>
              <span className="text-nubia-white/70 text-sm">{t('custom.badge', 'Sur-Mesure')}</span>
            </div>

            <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-nubia-white leading-tight">
              {t('custom.title', 'Create Your Custom Outfit')}
            </h1>
            
            <p className="text-lg md:text-xl text-nubia-white/80 mb-8 max-w-2xl">
              {t('custom.subtitle', 'Let us create your unique piece based on your personality')}
            </p>

            <p className="text-base md:text-lg text-nubia-gold/90 mb-8 max-w-2xl font-medium">
              {t('custom.hero_cta', 'Your vision, our expertise. Custom design made just for you.')}
            </p>

            {/* CTA Button */}
            <button 
              onClick={() => {
                const element = document.getElementById('custom-form');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-nubia-gold text-nubia-black font-bold rounded-xl hover:bg-nubia-white hover:shadow-2xl transition-all duration-300 text-lg"
            >
              {t('custom.start_now', 'Start Now')}
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section with Thumbnails */}
      <section className="py-16 md:py-20 bg-nubia-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <div className="mb-16 text-center">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-4">
              {t('custom.intro_title', 'Which creation interests you?')}
            </h2>
            <p className="text-lg text-nubia-black/70 max-w-2xl mx-auto">
              {t('custom.intro_desc', 'Explore our main categories. Each can be customized according to your wishes and budget.')}
            </p>
          </div>

          {/* Categories Grid - 3 Thumbnails - Same as Catalog */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Thumbnail 1 : Wedding Dresses */}
            <Link
              href={`/${locale}/catalogue/robes-mariage?inspiration=true`}
              className="group relative overflow-hidden rounded-2xl h-64 sm:h-72 md:h-80 cursor-pointer hover:shadow-2xl transition-all duration-300 block border-2 border-nubia-gold/20 hover:border-nubia-gold/60"
            >
              {/* Banner Image - Using Same as Catalog */}
              <img
                src={getProductImageUrl('images/banners/category/robes-mariage.png')}
                alt={t('custom.category_wedding', 'Wedding Dresses')}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-nubia-black/80 via-nubia-black/40 to-transparent group-hover:from-nubia-black/90 transition-colors duration-300" />
              
              {/* Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white text-center px-4 mb-3">
                  {t('custom.category_wedding', 'Wedding Dresses')}
                </h3>
                <div className="text-center px-4">
                  <p className="text-nubia-gold font-bold mb-1">
                    {t('custom.starting_from', 'From')} <span className="text-xl">100 000</span> FCFA
                  </p>
                  <p className="text-xs md:text-sm text-nubia-white/90">
                    {t('custom.wedding_offer', 'Veil offered with every custom order.')}
                  </p>
                </div>
              </div>
            </Link>

            {/* Thumbnail 2 : Ceremony Dresses */}
            <Link
              href={`/${locale}/catalogue/robes-ceremonie?inspiration=true`}
              className="group relative overflow-hidden rounded-2xl h-64 sm:h-72 md:h-80 cursor-pointer hover:shadow-2xl transition-all duration-300 block border-2 border-nubia-gold/20 hover:border-nubia-gold/60"
            >
              {/* Banner Image - Using Same as Catalog */}
              <img
                src={getProductImageUrl('images/banners/category/robes-ceremonie.png')}
                alt={t('custom.category_ceremony', 'Ceremony Dresses')}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-nubia-black/80 via-nubia-black/40 to-transparent group-hover:from-nubia-black/90 transition-colors duration-300" />
              
              {/* Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white text-center px-4 mb-3">
                  {t('custom.category_ceremony', 'Ceremony Dresses')}
                </h3>
                <div className="text-center px-4">
                  <p className="text-nubia-gold font-bold mb-1">
                    {t('custom.starting_from', 'From')} <span className="text-xl">20 000</span> FCFA
                  </p>
                  <p className="text-xs md:text-sm text-nubia-white/90">
                    {t('custom.ceremony_offer', 'Custom order.')}
                  </p>
                </div>
              </div>
            </Link>

            {/* Thumbnail 3 : African Suits */}
            <Link
              href={`/${locale}/catalogue/costumes-africains?inspiration=true`}
              className="group relative overflow-hidden rounded-2xl h-64 sm:h-72 md:h-80 cursor-pointer hover:shadow-2xl transition-all duration-300 block border-2 border-nubia-gold/20 hover:border-nubia-gold/60"
            >
              {/* Banner Image - Using Same as Catalog */}
              <img
                src={getProductImageUrl('images/banners/category/costumes-africains.png')}
                alt={t('custom.category_suit', 'African Suits')}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-nubia-black/80 via-nubia-black/40 to-transparent group-hover:from-nubia-black/90 transition-colors duration-300" />
              
              {/* Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white text-center px-4 mb-3">
                  {t('custom.category_suit', 'African Suits')}
                </h3>
                <div className="text-center px-4">
                  <p className="text-nubia-gold font-bold mb-1">
                    {t('custom.starting_from', 'From')} <span className="text-xl">20 000</span> FCFA
                  </p>
                  <p className="text-xs md:text-sm text-nubia-white/90">
                    {t('custom.suit_offer', 'Prices vary based on model chosen.')}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content - Form + Process */}
      <section className="flex-1 py-16 md:py-20 bg-nubia-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Grid 2-1 Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* ========== FORMULAIRE : 2/3 ========== */}
            <div className="lg:col-span-2">
              {/* Section Title */}
              <div className="mb-8">
                <h2 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black mb-2">
                  {t('custom.form_title', 'Fill Your Request')}
                </h2>
                <div className="w-16 h-1 bg-nubia-gold rounded-full"></div>
                <p className="text-nubia-black/70 mt-4">
                  {t('custom.form_desc', 'The more details you provide, the better we understand your vision.')}
                </p>
              </div>

              <div className="bg-nubia-white border-2 border-nubia-gold/20 rounded-2xl p-8 md:p-10 hover:border-nubia-gold/40 transition-all duration-300">
                {/* Success Alert */}
                {status === 'success' && (
                  <div className="mb-6 p-5 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
                    <div>
                      <h3 className="font-bold text-green-900 text-lg">
                        {t('custom.success_title', '✨ Request sent!')}
                      </h3>
                      <p className="text-green-700 text-sm mt-1">
                        {t('custom.success_message', 'Thank you! Our team will contact you within 24-48h to refine your order.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Alert */}
                {status === 'error' && (
                  <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                    <div>
                      <h3 className="font-bold text-red-900 text-lg">
                        {t('custom.error_title', 'An error occurred')}
                      </h3>
                      <p className="text-red-700 text-sm mt-1">
                        {t('custom.error_message', 'Please try again or contact us directly.')}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" id="custom-form">
                  {/* 2 cols : Name + Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-bold text-nubia-black mb-3 uppercase tracking-wide">
                        {t('custom.name_label', 'Full Name')}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3 border-2 border-nubia-gold/30 rounded-xl focus:outline-none focus:border-nubia-gold focus:bg-nubia-gold/5 transition-all duration-200 text-nubia-black placeholder:text-nubia-black/40"
                        placeholder={t('custom.name_placeholder', 'Ex: Fatima Diallo')}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-bold text-nubia-black mb-3 uppercase tracking-wide">
                        {t('custom.email_label', 'Email Address')}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3 border-2 border-nubia-gold/30 rounded-xl focus:outline-none focus:border-nubia-gold focus:bg-nubia-gold/5 transition-all duration-200 text-nubia-black placeholder:text-nubia-black/40"
                        placeholder={t('custom.email_placeholder', 'you@email.com')}
                      />
                    </div>
                  </div>

                  {/* 2 cols : Phone + Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-bold text-nubia-black mb-3 uppercase tracking-wide">
                        {t('custom.phone_label', 'Phone Number')}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3 border-2 border-nubia-gold/30 rounded-xl focus:outline-none focus:border-nubia-gold focus:bg-nubia-gold/5 transition-all duration-200 text-nubia-black placeholder:text-nubia-black/40"
                        placeholder={t('custom.phone_placeholder', '+221 77 123 45 67')}
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-bold text-nubia-black mb-3 uppercase tracking-wide">
                        {t('custom.type_label', 'Type of Outfit')}
                      </label>
                      <select
                        name="type"
                        value={formData.type || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3 border-2 border-nubia-gold/30 rounded-xl focus:outline-none focus:border-nubia-gold focus:bg-nubia-gold/5 transition-all duration-200 text-nubia-black"
                      >
                        <option value="">{t('custom.type_placeholder', '— Choose an option —')}</option>
                        <option value={locale === 'fr' ? 'robe' : 'dress'}>{t('custom.type_dress', 'Dress')}</option>
                        <option value={locale === 'fr' ? 'costume' : 'suit'}>{t('custom.type_suit', 'Suit')}</option>
                        <option value={locale === 'fr' ? 'chemise' : 'shirt'}>{t('custom.type_shirt', 'Shirt')}</option>
                        <option value={locale === 'fr' ? 'pantalon' : 'pants'}>{t('custom.type_pants', 'Pants')}</option>
                        <option value={locale === 'fr' ? 'jupe' : 'skirt'}>{t('custom.type_skirt', 'Skirt')}</option>
                        <option value={locale === 'fr' ? 'autre' : 'other'}>{t('custom.type_other', 'Other')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Measurements - Full width */}
                  <div>
                    <label className="block text-sm font-bold text-nubia-black mb-3 uppercase tracking-wide">
                      {t('custom.measurements_label', 'Your Measurements')}
                    </label>
                    <textarea
                      name="measurements"
                      value={formData.measurements}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-5 py-3 border-2 border-nubia-gold/30 rounded-xl focus:outline-none focus:border-nubia-gold focus:bg-nubia-gold/5 transition-all duration-200 text-nubia-black placeholder:text-nubia-black/40 resize-none"
                      placeholder={t('custom.measurements_placeholder', 'Chest, waist, hips, desired length, etc.')}
                    />
                    <p className="text-xs text-nubia-black/50 mt-2 italic">
                      {t('custom.measurements_help', 'Don\'t know your measurements? Our experts will guide you after submission.')}
                    </p>
                  </div>

                  {/* Preferences - Full width */}
                  <div>
                    <label className="block text-sm font-bold text-nubia-black mb-3 uppercase tracking-wide">
                      {t('custom.preferences_label', 'Your Preferences')}
                    </label>
                    <textarea
                      name="preferences"
                      value={formData.preferences}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-5 py-3 border-2 border-nubia-gold/30 rounded-xl focus:outline-none focus:border-nubia-gold focus:bg-nubia-gold/5 transition-all duration-200 text-nubia-black placeholder:text-nubia-black/40 resize-none"
                      placeholder={t('custom.preferences_placeholder', 'Style, favorite colors, material, special details, inspirations...')}
                    />
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-bold text-nubia-black mb-3 uppercase tracking-wide">
                      {t('custom.budget_label', 'Estimated Budget (FCFA)')}
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3 border-2 border-nubia-gold/30 rounded-xl focus:outline-none focus:border-nubia-gold focus:bg-nubia-gold/5 transition-all duration-200 text-nubia-black placeholder:text-nubia-black/40"
                      placeholder={t('custom.budget_placeholder', 'Ex: 100000')}
                    />
                    <p className="text-xs text-nubia-black/50 mt-2">
                      {t('custom.budget_help', 'This helps us tailor proposals to your budget.')}
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 md:py-5 bg-gradient-to-r from-nubia-gold to-nubia-gold/90 text-nubia-black font-bold text-lg rounded-xl hover:shadow-2xl hover:scale-105 border-2 border-nubia-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                  >
                    {loading 
                      ? t('custom.submit_loading', 'Sending...') 
                      : t('custom.submit_button', '✨ Send My Request')}
                  </button>
                </form>
              </div>
            </div>

            {/* ========== PROCESSUS : 1/3 ========== */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-gradient-to-br from-nubia-black to-nubia-dark text-nubia-white rounded-2xl p-8 md:p-10 shadow-2xl">
                <h3 className="font-playfair text-2xl md:text-3xl font-bold mb-8 text-nubia-gold flex items-center gap-2">
                  <span>🎯</span> {t('custom.how_it_works', 'How It Works')}
                </h3>

                <div className="space-y-6">
                  {steps.map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-nubia-gold text-nubia-black rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                          {item.step}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-nubia-white mb-2">{item.title}</h4>
                        <p className="text-xs md:text-sm text-nubia-white/70 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust Element */}
                <div className="mt-8 pt-8 border-t border-nubia-gold/30">
                  <p className="text-xs md:text-sm text-nubia-white/80 leading-relaxed">
                    {t('custom.trust_message', '⭐ Our creators have 15+ years of experience in premium African tailoring.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
