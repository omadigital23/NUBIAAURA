'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function CustomOrderPage() {
  const { t } = useTranslation();
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
            {t('custom.title', 'Create Your Custom Outfit')}
          </h1>
          <p className="text-lg text-nubia-white/80">
            {t('custom.subtitle', 'Let us create your unique piece based on your personality')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Form */}
            <div className="md:col-span-2">
              <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8">
                {status === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="text-green-600 mt-1" size={24} />
                    <div>
                      <h3 className="font-semibold text-green-900">
                        {t('custom.success_title', 'Request sent successfully!')}
                      </h3>
                      <p className="text-green-700 text-sm">
                        {t('custom.success_message', 'We will contact you very soon to discuss your creation.')}
                      </p>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-600 mt-1" size={24} />
                    <div>
                      <h3 className="font-semibold text-red-900">
                        {t('custom.error_title', 'An error occurred')}
                      </h3>
                      <p className="text-red-700 text-sm">
                        {t('custom.error_message', 'Please try again or contact us directly.')}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-nubia-black mb-2">
                      {t('custom.name_label', 'Full Name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      placeholder={t('custom.name_placeholder', 'Your name')}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-nubia-black mb-2">
                      {t('custom.email_label', 'Email Address')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      placeholder={t('custom.email_placeholder', 'your@email.com')}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-nubia-black mb-2">
                      {t('custom.phone_label', 'Phone Number')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      placeholder={t('custom.phone_placeholder', '+221 77 123 45 67')}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-semibold text-nubia-black mb-2">
                      {t('custom.type_label', 'Type of Outfit')}
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    >
                      <option value="">{t('custom.type_placeholder', 'Select the type of outfit')}</option>
                      <option value="dress">{t('custom.type_dress', 'Dress')}</option>
                      <option value="suit">{t('custom.type_suit', 'Suit')}</option>
                      <option value="shirt">{t('custom.type_shirt', 'Shirt')}</option>
                      <option value="pants">{t('custom.type_pants', 'Pants')}</option>
                      <option value="skirt">{t('custom.type_skirt', 'Skirt')}</option>
                      <option value="other">{t('custom.type_other', 'Other')}</option>
                    </select>
                  </div>

                  {/* Measurements */}
                  <div>
                    <label className="block text-sm font-semibold text-nubia-black mb-2">
                      {t('custom.measurements_label', 'Your Measurements')}
                    </label>
                    <textarea
                      name="measurements"
                      value={formData.measurements}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      placeholder={t('custom.measurements_placeholder', 'Chest, waist, hips, length...')}
                    />
                  </div>

                  {/* Preferences */}
                  <div>
                    <label className="block text-sm font-semibold text-nubia-black mb-2">
                      {t('custom.preferences_label', 'Your Preferences')}
                    </label>
                    <textarea
                      name="preferences"
                      value={formData.preferences}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      placeholder={t('custom.preferences_placeholder', 'Describe your style, your favorite colors, etc.')}
                    />
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-semibold text-nubia-black mb-2">
                      {t('custom.budget_label', 'Estimated Budget (XOF)')}
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                      placeholder={t('custom.budget_placeholder', '100000')}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? t('custom.submit_loading', 'Sending...') : t('custom.submit_button', 'Send My Request')}
                  </button>
                </form>
              </div>
            </div>

            {/* Info Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-nubia-black to-nubia-dark text-nubia-white rounded-lg p-6 sticky top-20">
                <h3 className="font-playfair text-2xl font-bold mb-6 text-nubia-gold">
                  {t('custom.how_it_works', 'How It Works')}
                </h3>

                <div className="space-y-6">
                  {steps.map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-nubia-gold text-nubia-black rounded-full flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <p className="text-sm text-nubia-white/70">{item.desc}</p>
                      </div>
                    </div>
                  ))}
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
