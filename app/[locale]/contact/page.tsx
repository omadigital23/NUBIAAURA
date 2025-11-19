'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, MessageSquare, Facebook, Instagram, Twitter } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
        subject: '',
        message: '',
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

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-nubia-black to-nubia-dark text-nubia-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-4">
            {t('contact.title', 'Contact Us')}
          </h1>
          <p className="text-xl text-nubia-white/80">
            {t('contact.subtitle', 'We are listening to you')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Contact Info Cards */}
            <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8">
              <Mail className="text-nubia-gold mb-4" size={32} />
              <h3 className="font-playfair text-xl font-bold text-nubia-black mb-2">
                {t('contact.email_label', 'Email')}
              </h3>
              <a href="mailto:contact@nubiaaura.com" className="text-nubia-gold hover:underline">
                contact@nubiaaura.com
              </a>
            </div>

            <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8">
              <Phone className="text-nubia-gold mb-4" size={32} />
              <h3 className="font-playfair text-xl font-bold text-nubia-black mb-2">
                {t('contact.phone_label', 'Phone')}
              </h3>
              <a href="tel:+221771234567" className="text-nubia-gold hover:underline">
                +221 77 123 45 67
              </a>
            </div>

            <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8">
              <MapPin className="text-nubia-gold mb-4" size={32} />
              <h3 className="font-playfair text-xl font-bold text-nubia-black mb-2">
                {t('contact.location_label', 'Location')}
              </h3>
              <p className="text-nubia-black/70">{t('contact.location', 'Thiès, Senegal')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="font-playfair text-3xl font-bold text-nubia-black mb-8">
                {t('contact.form_title', 'Send us a Message')}
              </h2>

              {status === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700">
                    {t('contact.success_message', 'Message sent successfully! We will respond soon.')}
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">
                    {t('contact.error_message', 'An error occurred. Please try again.')}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    {t('contact.name_label', 'Full Name')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    placeholder={t('contact.name_placeholder', 'Your name')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    {t('contact.email_label', 'Email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    placeholder={t('contact.email_placeholder', 'your@email.com')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    {t('contact.phone_label', 'Phone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    placeholder={t('contact.phone_placeholder', '+221 77 123 45 67')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    {t('contact.subject_label', 'Subject')}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    placeholder={t('contact.subject_placeholder', 'Message subject')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    {t('contact.message_label', 'Message')}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
                    placeholder={t('contact.message_placeholder', 'Your message...')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? t('contact.sending', 'Sending...') : t('contact.send_button', 'Send')}
                </button>
              </form>
            </div>

            {/* Info & Social */}
            <div>
              <h2 className="font-playfair text-3xl font-bold text-nubia-black mb-8">
                {t('contact.other_ways', 'Other Ways to Contact')}
              </h2>

              <div className="bg-gradient-to-br from-nubia-black to-nubia-dark text-nubia-white rounded-lg p-8 mb-8">
                <h3 className="font-playfair text-2xl font-bold text-nubia-gold mb-6">
                  {t('contact.hours_title', 'Opening Hours')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>{t('contact.weekdays', 'Monday - Friday')}</span>
                    <span>9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('contact.saturday', 'Saturday')}</span>
                    <span>10:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('contact.sunday', 'Sunday')}</span>
                    <span>{t('contact.closed', 'Closed')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-nubia-white border border-nubia-gold/20 rounded-lg p-8">
                <h3 className="font-playfair text-2xl font-bold text-nubia-black mb-6">
                  {t('contact.follow_us', 'Follow Us')}
                </h3>
                <div className="space-y-4">
                  <a
                    href="https://wa.me/221771234567"
                    className="flex items-center gap-3 p-3 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors"
                  >
                    <MessageSquare className="text-nubia-gold" size={24} />
                    <span className="text-nubia-black font-semibold">WhatsApp</span>
                  </a>

                  <a
                    href="https://instagram.com/nubiaaura"
                    className="flex items-center gap-3 p-3 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors"
                  >
                    <Instagram className="text-nubia-gold" size={24} />
                    <span className="text-nubia-black font-semibold">Instagram</span>
                  </a>

                  <a
                    href="https://facebook.com/nubiaaura"
                    className="flex items-center gap-3 p-3 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors"
                  >
                    <Facebook className="text-nubia-gold" size={24} />
                    <span className="text-nubia-black font-semibold">Facebook</span>
                  </a>

                  <a
                    href="https://twitter.com/nubiaaura"
                    className="flex items-center gap-3 p-3 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors"
                  >
                    <Twitter className="text-nubia-gold" size={24} />
                    <span className="text-nubia-black font-semibold">Twitter</span>
                  </a>
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
