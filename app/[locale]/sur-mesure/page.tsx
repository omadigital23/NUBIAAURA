'use client';

import Link from 'next/link';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock3,
  FileText,
  MessageCircle,
  Ruler,
  Scissors,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
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

  const heroImages = [
    {
      asset: productAsset('images/robes/ceremonie/longues/robe-ceremonie-longue-doree/grande/01-main.png'),
      alt: t('custom.hero_image_ceremony', 'Custom ceremony dress'),
      className: 'col-span-3 row-span-6',
    },
    {
      asset: productAsset('images/costumes/africains/costume-vert/grande/01-main.png'),
      alt: t('custom.hero_image_suit', 'Custom African suit'),
      className: 'col-span-2 row-span-3',
    },
    {
      asset: productAsset('images/chemises/wax/chemise-wax-grande/01-main.png'),
      alt: t('custom.hero_image_wax', 'Wax shirt detail'),
      className: 'col-span-2 row-span-3',
    },
  ];

  const proofPoints = [
    {
      icon: Ruler,
      value: t('custom.proof_fit_value', 'Fit checked'),
      label: t('custom.proof_fit_label', 'Guided measurements'),
    },
    {
      icon: Scissors,
      value: t('custom.proof_make_value', 'Made to order'),
      label: t('custom.proof_make_label', 'One piece at a time'),
    },
    {
      icon: ShieldCheck,
      value: t('custom.proof_quality_value', 'Premium finish'),
      label: t('custom.proof_quality_label', 'Final quality control'),
    },
  ];

  const categories = [
    {
      title: t('custom.category_wedding', 'Wedding Dresses'),
      desc: t('custom.wedding_desc', 'A unique piece for your special day'),
      href: `/${locale}/catalogue/robes-mariage?inspiration=true`,
      asset: productAsset('images/banners/category/robes-mariage.png'),
      price: '100 000',
      tag: locale === 'fr' ? 'Mariage' : 'Bridal',
      offer: t('custom.wedding_offer', 'Veil offered with every custom order.'),
    },
    {
      title: t('custom.category_ceremony', 'Ceremony Dresses'),
      desc: t('custom.ceremony_desc', 'Elegance and refinement for every occasion'),
      href: `/${locale}/catalogue/robes-ceremonie?inspiration=true`,
      asset: productAsset('images/banners/category/robes-ceremonie.png'),
      price: '20 000',
      tag: locale === 'fr' ? 'Ceremonie' : 'Ceremony',
      offer: t('custom.ceremony_offer', 'Custom order.'),
    },
    {
      title: t('custom.category_suit', 'African Suits'),
      desc: t('custom.suit_desc', 'Modern traditional style personalized'),
      href: `/${locale}/catalogue/costumes-africains?inspiration=true`,
      asset: productAsset('images/banners/category/costumes-africains.png'),
      price: '20 000',
      tag: locale === 'fr' ? 'Costumes' : 'Suits',
      offer: t('custom.suit_offer', 'Prices vary based on model chosen.'),
    },
  ];

  const steps = [
    {
      icon: FileText,
      title: t('custom.step1_title', 'Fill Out the Form'),
      desc: t('custom.step1_desc', 'Share your details and preferences'),
    },
    {
      icon: MessageCircle,
      title: t('custom.step2_title', 'We Contact You'),
      desc: t('custom.step2_desc', 'Let us discuss your vision and details'),
    },
    {
      icon: Scissors,
      title: t('custom.step3_title', 'Creation'),
      desc: t('custom.step3_desc', 'We create your unique piece'),
    },
    {
      icon: Truck,
      title: t('custom.step4_title', 'Delivery'),
      desc: t('custom.step4_desc', 'Satisfaction guaranteed'),
    },
  ];

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

  const labelClass = 'block text-xs font-bold uppercase tracking-wide text-nubia-black/80 mb-3';
  const fieldClass = 'w-full rounded-lg border-2 border-nubia-gold/25 bg-nubia-white px-5 py-3 text-nubia-black placeholder:text-nubia-black/40 transition-all duration-200 focus:border-nubia-gold focus:bg-nubia-gold/5 focus:outline-none focus:ring-4 focus:ring-nubia-gold/10';

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-nubia-black via-nubia-dark to-nubia-black text-nubia-white">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(212,175,55,0.18),transparent_34%,rgba(255,255,255,0.08)_74%,transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.92fr] gap-12 lg:gap-16 items-center">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-nubia-gold/45 bg-nubia-gold/15 px-4 py-2 text-sm font-semibold text-nubia-gold">
                <Sparkles size={16} aria-hidden="true" />
                <span>{t('custom.badge', 'Custom')}</span>
              </div>

              <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-nubia-white">
                {t('custom.title', 'Create Your Custom Outfit')}
              </h1>

              <p className="mt-6 text-lg md:text-xl leading-8 text-nubia-white/82">
                {t('custom.subtitle', 'Let us create your unique piece based on your personality')}
              </p>

              <p className="mt-4 text-base md:text-lg font-medium text-nubia-gold/95">
                {t('custom.hero_cta', 'Your vision, our expertise. Custom design made just for you.')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const element = document.getElementById('custom-form');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-nubia-gold px-6 py-4 font-bold text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-nubia-gold/30"
                >
                  <Scissors size={19} aria-hidden="true" />
                  {t('custom.start_now', 'Start Now')}
                </button>

                <Link
                  href={`/${locale}/catalogue`}
                  className="inline-flex items-center justify-center rounded-lg border border-nubia-white/25 px-6 py-4 font-semibold text-nubia-white transition-all duration-300 hover:border-nubia-gold hover:bg-nubia-white/10"
                >
                  {t('custom.view_inspirations', 'View inspirations')}
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {proofPoints.map((point) => {
                  const Icon = point.icon;
                  return (
                    <div key={point.value} className="rounded-lg border border-nubia-white/12 bg-nubia-white/7 p-4 backdrop-blur">
                      <Icon className="mb-3 text-nubia-gold" size={22} aria-hidden="true" />
                      <p className="text-sm font-bold text-nubia-white">{point.value}</p>
                      <p className="mt-1 text-xs leading-5 text-nubia-white/65">{point.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="min-h-[420px]">
              <div className="grid h-[420px] grid-cols-5 grid-rows-6 gap-3 md:h-[520px]">
                {heroImages.map((image) => (
                  <div key={image.alt} className={`${image.className} overflow-hidden rounded-lg border border-nubia-white/15 bg-nubia-white/5 shadow-2xl`}>
                    <img
                      src={image.asset.src}
                      alt={image.alt}
                      onError={(event) => handleImageError(event, image.asset.fallback)}
                      className="h-full w-full object-cover transition-transform duration-700 motion-safe:hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-nubia-white via-nubia-cream/35 to-nubia-white py-16 md:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nubia-gold/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                {t('custom.inspiration_kicker', 'Inspiration')}
              </p>
              <h2 className="font-playfair text-3xl md:text-5xl font-bold text-nubia-black">
                {t('custom.intro_title', 'Which creation interests you?')}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-nubia-black/68 md:text-lg md:leading-8">
                {t('custom.intro_desc', 'Explore our main categories. Each can be customized according to your wishes and budget.')}
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-nubia-gold/30 bg-nubia-white px-4 py-2 text-sm font-bold text-nubia-black shadow-sm">
              <Sparkles className="h-4 w-4 text-nubia-gold" aria-hidden="true" />
              <span className="whitespace-nowrap">{locale === 'fr' ? '3 univers sur mesure' : '3 custom universes'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
            {categories.map((category, index) => (
              <Link
                key={category.title}
                href={category.href}
                aria-label={`${category.title} - ${locale === 'fr' ? 'voir les inspirations' : 'view inspirations'}`}
                className="group relative flex min-h-[500px] overflow-hidden rounded-lg border border-nubia-gold/25 bg-nubia-black shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-nubia-gold/70 hover:shadow-2xl hover:shadow-nubia-black/20 focus:outline-none focus:ring-4 focus:ring-nubia-gold/20 md:min-h-[540px]"
              >
                <img
                  src={category.asset.src}
                  alt={category.title}
                  onError={(event) => handleImageError(event, category.asset.fallback)}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.9)_100%)]" />
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/20 bg-nubia-black/55 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="rounded-full bg-nubia-gold px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-nubia-black shadow-lg shadow-nubia-black/20">
                    {category.tag}
                  </span>
                </div>
                <div className="relative mt-auto w-full p-5 sm:p-6">
                  <div className="rounded-lg border border-white/12 bg-nubia-black/72 p-5 shadow-2xl backdrop-blur-md">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-nubia-gold">
                      {t('custom.starting_from', 'From')} {category.price} FCFA
                    </p>
                    <h3 className="font-playfair text-2xl font-bold leading-tight text-white sm:text-3xl">
                      {category.title}
                    </h3>
                    <p className="mt-3 min-h-[48px] text-sm leading-6 text-white/82">
                      {category.desc}
                    </p>
                    <div className="mt-5 border-t border-white/15 pt-4">
                      <p className="text-sm font-semibold leading-6 text-nubia-gold">
                        {category.offer}
                      </p>
                      <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nubia-white px-4 py-3 text-sm font-bold text-nubia-black transition-all duration-300 group-hover:bg-nubia-gold">
                        {locale === 'fr' ? 'Voir les inspirations' : 'View inspirations'}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="flex-1 py-16 md:py-20 bg-nubia-cream/35">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-nubia-gold">
                  {t('custom.form_kicker', 'Your brief')}
                </p>
                <h2 className="font-playfair text-3xl md:text-5xl font-bold text-nubia-black">
                  {t('custom.form_title', 'Submit Your Request')}
                </h2>
                <p className="mt-4 text-nubia-black/70">
                  {t('custom.form_desc', 'The more details you provide, the better we understand your vision.')}
                </p>
              </div>

              <div className="rounded-lg border border-nubia-gold/25 bg-nubia-white p-6 shadow-sm md:p-9">
                {status === 'success' && (
                  <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-5">
                    <CheckCircle className="mt-0.5 flex-shrink-0 text-green-600" size={24} />
                    <div>
                      <h3 className="text-lg font-bold text-green-900">
                        {t('custom.success_heading', 'Request sent')}
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        {t('custom.success_message', 'Thank you! Our team will contact you within 24-48h to refine your order.')}
                      </p>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5">
                    <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600" size={24} />
                    <div>
                      <h3 className="text-lg font-bold text-red-900">
                        {t('custom.error_title', 'An error occurred')}
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        {t('custom.error_message', 'Please try again or contact us directly.')}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" id="custom-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>{t('custom.name_label', 'Full Name')}</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder={t('custom.name_placeholder', 'Ex: Fatima Diallo')}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>{t('custom.email_label', 'Email Address')}</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder={t('custom.email_placeholder', 'you@email.com')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>{t('custom.phone_label', 'Phone Number')}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder={t('custom.phone_placeholder', '+221 77 123 45 67')}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>{t('custom.type_label', 'Type of Outfit')}</label>
                      <select
                        name="type"
                        value={formData.type || ''}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                      >
                        <option value="">{t('custom.type_placeholder_clean', 'Choose an option')}</option>
                        <option value={locale === 'fr' ? 'robe' : 'dress'}>{t('custom.type_dress', 'Dress')}</option>
                        <option value={locale === 'fr' ? 'costume' : 'suit'}>{t('custom.type_suit', 'Suit')}</option>
                        <option value={locale === 'fr' ? 'chemise' : 'shirt'}>{t('custom.type_shirt', 'Shirt')}</option>
                        <option value={locale === 'fr' ? 'pantalon' : 'pants'}>{t('custom.type_pants', 'Pants')}</option>
                        <option value={locale === 'fr' ? 'jupe' : 'skirt'}>{t('custom.type_skirt', 'Skirt')}</option>
                        <option value={locale === 'fr' ? 'autre' : 'other'}>{t('custom.type_other', 'Other')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t('custom.measurements_label', 'Your Measurements')}</label>
                    <textarea
                      name="measurements"
                      value={formData.measurements}
                      onChange={handleChange}
                      required
                      rows={4}
                      className={`${fieldClass} resize-none`}
                      placeholder={t('custom.measurements_placeholder', 'Chest, waist, hips, desired length, etc.')}
                    />
                    <p className="mt-2 text-xs italic text-nubia-black/50">
                      {t('custom.measurements_help', 'Do not know your measurements? Our experts will guide you after submission.')}
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>{t('custom.preferences_label', 'Your Preferences')}</label>
                    <textarea
                      name="preferences"
                      value={formData.preferences}
                      onChange={handleChange}
                      required
                      rows={4}
                      className={`${fieldClass} resize-none`}
                      placeholder={t('custom.preferences_placeholder', 'Style, favorite colors, material, special details, inspirations...')}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{t('custom.budget_label', 'Estimated Budget (FCFA)')}</label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                      className={fieldClass}
                      placeholder={t('custom.budget_placeholder', 'Ex: 100000')}
                    />
                    <p className="mt-2 text-xs text-nubia-black/50">
                      {t('custom.budget_help', 'This helps us tailor proposals to your budget.')}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-nubia-gold bg-nubia-gold px-6 py-4 text-lg font-bold uppercase tracking-wide text-nubia-black transition-all duration-300 hover:bg-nubia-white hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-nubia-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={19} aria-hidden="true" />
                    {loading
                      ? t('custom.submit_loading', 'Sending...')
                      : t('custom.submit_label', 'Send My Request')}
                  </button>
                </form>
              </div>
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 overflow-hidden rounded-lg bg-gradient-to-br from-nubia-black to-nubia-dark text-nubia-white shadow-2xl">
                <div className="border-b border-nubia-gold/25 p-7">
                  <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-nubia-gold">
                    <Clock3 size={16} aria-hidden="true" />
                    {t('custom.timeline_label', 'Process')}
                  </p>
                  <h3 className="font-playfair text-3xl font-bold text-nubia-white">
                    {t('custom.how_it_works', 'How It Works')}
                  </h3>
                </div>

                <div className="space-y-1 p-5">
                  {steps.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex gap-4 rounded-lg p-3 transition-colors duration-200 hover:bg-nubia-white/8">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-nubia-gold text-nubia-black">
                          <Icon size={18} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-nubia-gold/80">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                          <h4 className="mt-1 font-semibold text-nubia-white">{item.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-nubia-white/68">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-nubia-gold/25 p-7">
                  <p className="text-sm leading-6 text-nubia-white/78">
                    {t('custom.trust_plain', 'Our creators have 15+ years of experience in premium African tailoring.')}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-nubia-white/72">
                    <div className="rounded-lg border border-nubia-white/12 p-3">
                      <p className="font-bold text-nubia-gold">{t('custom.guarantee_fit', 'Fit support')}</p>
                      <p className="mt-1">{t('custom.guarantee_fit_desc', 'Measurements reviewed')}</p>
                    </div>
                    <div className="rounded-lg border border-nubia-white/12 p-3">
                      <p className="font-bold text-nubia-gold">{t('custom.guarantee_reply', '24-48h')}</p>
                      <p className="mt-1">{t('custom.guarantee_reply_desc', 'Team response')}</p>
                    </div>
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
