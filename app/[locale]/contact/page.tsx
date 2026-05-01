'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  AlertCircle,
  CheckCircle,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import SocialIcon from '@/components/SocialIcon';
import { getProductImageUrl } from '@/lib/media';

type ProductAsset = {
  src: string;
  fallback: string;
};

const productAsset = (path: string): ProductAsset => {
  const cleanPath = path.replace(/^\/+/, '');
  return {
    src: `/${cleanPath}`,
    fallback: getProductImageUrl(cleanPath),
  };
};

const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallback: string,
) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
};

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

  const contactImage = productAsset('images/banners/hero/hero-3.png');

  const contactMethods = [
    {
      icon: Mail,
      title: t('contact.email_label', 'Email'),
      value: 'contact@nubiaaura.com',
      href: 'mailto:contact@nubiaaura.com',
      detail: t('contact.email_detail', 'For orders, styling questions and support.'),
    },
    {
      icon: Phone,
      title: t('contact.phone_label', 'Phone'),
      value: '+221 77 123 45 67',
      href: 'tel:+221771234567',
      detail: t('contact.phone_detail', 'Best for urgent delivery or fitting questions.'),
    },
    {
      icon: MapPin,
      title: t('contact.location_label', 'Location'),
      value: t('contact.location', 'Dakar, Senegal'),
      href: 'https://maps.google.com/?q=Dakar%2C%20Senegal',
      detail: t('contact.location_detail', 'Appointments and atelier coordination by request.'),
    },
  ];

  const responseNotes = [
    {
      icon: Clock3,
      title: t('contact.response_title', '24-48h response'),
      text: t('contact.response_text', 'We review every request before replying.'),
    },
    {
      icon: ShieldCheck,
      title: t('contact.secure_title', 'Private details'),
      text: t('contact.secure_text', 'Measurements and contact information stay confidential.'),
    },
    {
      icon: MessageSquare,
      title: t('contact.whatsapp_title', 'WhatsApp available'),
      text: t('contact.whatsapp_text', 'Send references, measurements or delivery questions directly.'),
    },
  ];

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

  const labelClass = 'block text-xs font-bold uppercase tracking-wide text-nubia-black/80 mb-3';
  const fieldClass = 'w-full rounded-lg border-2 border-nubia-gold/25 bg-nubia-white px-5 py-3 text-nubia-black placeholder:text-nubia-black/40 transition-all duration-200 focus:border-nubia-gold focus:bg-nubia-gold/5 focus:outline-none focus:ring-4 focus:ring-nubia-gold/10';

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-nubia-black via-nubia-dark to-nubia-black text-nubia-white">
        <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(212,175,55,0.16),transparent_38%,rgba(255,255,255,0.08)_76%,transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-nubia-gold/45 bg-nubia-gold/15 px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-nubia-gold">
                <Sparkles size={16} aria-hidden="true" />
                {t('contact.hero_kicker', 'Atelier support')}
              </p>
              <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                {t('contact.title', 'Contact Us')}
              </h1>
              <p className="mt-6 text-xl leading-8 text-nubia-white/82">
                {t('contact.subtitle', 'We are listening to you')}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-nubia-white/70">
                {t('contact.description', 'Have any questions? We would be happy to help by email, phone or WhatsApp.')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="#contact-form"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-nubia-gold px-6 py-4 font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-2xl"
                >
                  <Send size={19} aria-hidden="true" />
                  {t('contact.write_us', 'Write to us')}
                </a>
                <a
                  href="https://wa.me/221771234567"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-nubia-white/25 px-6 py-4 font-semibold text-nubia-white transition-all duration-300 hover:border-nubia-gold hover:bg-nubia-white/10"
                >
                  <MessageSquare size={19} aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-nubia-white/15 bg-nubia-white/5 shadow-2xl">
              <div className="relative h-[430px] md:h-[540px]">
                <img
                  src={contactImage.src}
                  alt={t('contact.hero_image_alt', 'Nubia Aura atelier collection')}
                  onError={(event) => handleImageError(event, contactImage.fallback)}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-nubia-black/88 to-transparent p-7">
                  <p className="max-w-md text-sm font-semibold leading-6 text-nubia-white/90">
                    {t('contact.hero_image_caption', 'Questions about sizing, delivery, custom orders or availability are handled directly by the team.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 bg-nubia-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <a
                  key={method.title}
                  href={method.href}
                  className="group rounded-lg border border-nubia-gold/20 bg-nubia-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-nubia-gold/60 hover:shadow-xl"
                >
                  <Icon className="mb-5 text-nubia-gold" size={34} aria-hidden="true" />
                  <h3 className="font-playfair text-2xl font-bold text-nubia-black">
                    {method.title}
                  </h3>
                  <p className="mt-2 font-semibold text-nubia-gold group-hover:underline">
                    {method.value}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-nubia-black/62">
                    {method.detail}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="flex-1 py-16 md:py-20 bg-nubia-cream/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                {t('contact.form_kicker', 'Message')}
              </p>
              <h2 className="font-playfair text-3xl md:text-5xl font-bold text-nubia-black">
                {t('contact.form_title', 'Send us a Message')}
              </h2>
              <p className="mt-4 text-nubia-black/70">
                {t('contact.form_intro', 'Tell us what you need. A precise message helps us answer faster.')}
              </p>

              <div className="mt-8 rounded-lg border border-nubia-gold/25 bg-nubia-white p-6 shadow-sm md:p-9">
                {status === 'success' && (
                  <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-5">
                    <CheckCircle className="mt-0.5 flex-shrink-0 text-green-600" size={24} />
                    <p className="text-sm font-semibold text-green-800">
                      {t('contact.success_message', 'Message sent successfully! We will respond soon.')}
                    </p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5">
                    <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600" size={24} />
                    <p className="text-sm font-semibold text-red-800">
                      {t('contact.error_message', 'An error occurred. Please try again.')}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" id="contact-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>{t('contact.name_label', 'Full Name')}</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder={t('contact.name_placeholder', 'Your name')}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>{t('contact.email_label', 'Email')}</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder={t('contact.email_placeholder', 'your@email.com')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>{t('contact.phone_label', 'Phone')}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={fieldClass}
                        placeholder={t('contact.phone_placeholder', '+221 77 123 45 67')}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>{t('contact.subject_label', 'Subject')}</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder={t('contact.subject_placeholder', 'Message subject')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t('contact.message_label', 'Message')}</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className={`${fieldClass} resize-none`}
                      placeholder={t('contact.message_placeholder', 'Your message...')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-nubia-gold bg-nubia-gold px-6 py-4 text-lg font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-nubia-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={19} aria-hidden="true" />
                    {loading ? t('contact.sending', 'Sending...') : t('contact.send_button', 'Send')}
                  </button>
                </form>
              </div>
            </div>

            <aside>
              <div className="space-y-6 lg:sticky lg:top-24">
                <div className="overflow-hidden rounded-lg bg-gradient-to-br from-nubia-black to-nubia-dark text-nubia-white shadow-2xl">
                  <div className="border-b border-nubia-gold/25 p-7">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                      {t('contact.service_kicker', 'Service')}
                    </p>
                    <h3 className="font-playfair text-3xl font-bold">
                      {t('contact.other_ways', 'Other Ways to Contact')}
                    </h3>
                  </div>

                  <div className="divide-y divide-nubia-white/10">
                    {responseNotes.map((note) => {
                      const Icon = note.icon;
                      return (
                        <div key={note.title} className="flex gap-4 p-6">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-nubia-gold text-nubia-black">
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <div>
                            <h4 className="font-semibold text-nubia-white">{note.title}</h4>
                            <p className="mt-1 text-sm leading-6 text-nubia-white/68">{note.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-7 shadow-sm">
                  <h3 className="font-playfair text-2xl font-bold text-nubia-black">
                    {t('contact.hours_title', 'Opening Hours')}
                  </h3>
                  <div className="mt-6 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-nubia-gold/15 pb-3">
                      <span className="font-semibold text-nubia-black">{t('contact.weekdays', 'Monday - Friday')}</span>
                      <span className="text-nubia-black/65">9:00 - 18:00</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-nubia-gold/15 pb-3">
                      <span className="font-semibold text-nubia-black">{t('contact.saturday', 'Saturday')}</span>
                      <span className="text-nubia-black/65">10:00 - 16:00</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-nubia-black">{t('contact.sunday', 'Sunday')}</span>
                      <span className="text-nubia-black/65">{t('contact.closed', 'Closed')}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-nubia-gold/20 bg-nubia-white p-7 shadow-sm">
                  <h3 className="font-playfair text-2xl font-bold text-nubia-black">
                    {t('contact.follow_us', 'Follow Us')}
                  </h3>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href="https://wa.me/221771234567"
                      className="flex items-center gap-3 rounded-lg border border-nubia-gold/25 p-4 font-semibold text-nubia-black transition-colors hover:bg-nubia-gold/10"
                    >
                      <MessageSquare className="text-nubia-gold" size={23} aria-hidden="true" />
                      WhatsApp
                    </a>

                    <a
                      href="https://instagram.com/nubiaaura"
                      className="flex items-center gap-3 rounded-lg border border-nubia-gold/25 p-4 font-semibold text-nubia-black transition-colors hover:bg-nubia-gold/10"
                    >
                      <SocialIcon name="instagram" className="text-nubia-gold" size={23} />
                      Instagram
                    </a>

                    <a
                      href="https://facebook.com/nubiaaura"
                      className="flex items-center gap-3 rounded-lg border border-nubia-gold/25 p-4 font-semibold text-nubia-black transition-colors hover:bg-nubia-gold/10"
                    >
                      <SocialIcon name="facebook" className="text-nubia-gold" size={23} />
                      Facebook
                    </a>

                    <a
                      href="https://twitter.com/nubiaaura"
                      className="flex items-center gap-3 rounded-lg border border-nubia-gold/25 p-4 font-semibold text-nubia-black transition-colors hover:bg-nubia-gold/10"
                    >
                      <SocialIcon name="twitter" className="text-nubia-gold" size={23} />
                      Twitter
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
