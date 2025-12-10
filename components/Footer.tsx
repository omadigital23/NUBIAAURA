'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getProductImageUrl } from '@/lib/media';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t, locale } = useTranslation();

  const paymentMethods = [
    { name: 'Visa', src: getProductImageUrl('images/visa.png') },
    { name: 'Mastercard', src: getProductImageUrl('images/mastercard.png') },
    { name: 'CMI', src: getProductImageUrl('images/cmi.png') },
    { name: 'Orange Money', src: getProductImageUrl('images/orange-money.png') },
    { name: 'Wave', src: getProductImageUrl('images/wave.png') },
    { name: 'PayPal', src: getProductImageUrl('images/paypal.png') },
  ];

  return (
    <footer className="bg-nubia-cream text-nubia-black border-t border-nubia-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-nubia-gold rounded-full flex items-center justify-center">
                <span className="text-nubia-black font-playfair font-bold">NA</span>
              </div>
              <span className="font-playfair text-lg font-bold">Nubia Aura</span>
            </div>
            <p className="text-sm text-nubia-black/80">
              {t('footer.brand_tagline', 'Plateforme de mode africaine alliant créativité, authenticité et élégance.')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="border-b border-nubia-gold/10 md:border-none pb-4 md:pb-0">
            <details className="group md:block">
              <summary className="flex justify-between items-center w-full font-playfair text-lg font-bold mb-4 text-nubia-gold cursor-pointer md:cursor-default list-none">
                {t('footer.navigation', 'Navigation')}
                <span className="md:hidden transition-transform group-open:rotate-180">▼</span>
              </summary>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href={`/${locale}/catalogue`} className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('nav.catalog', 'Catalogue')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/sur-mesure`} className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('nav.custom', 'Sur-Mesure')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/a-propos`} className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('nav.about', 'À propos')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/contact`} className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('nav.contact', 'Contact')}
                  </Link>
                </li>
              </ul>
            </details>
          </div>

          {/* Legal */}
          <div className="border-b border-nubia-gold/10 md:border-none pb-4 md:pb-0">
            <details className="group md:block">
              <summary className="flex justify-between items-center w-full font-playfair text-lg font-bold mb-4 text-nubia-gold cursor-pointer md:cursor-default list-none">
                {t('footer.legal', 'Légal')}
                <span className="md:hidden transition-transform group-open:rotate-180">▼</span>
              </summary>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href={`/${locale}/mentions-legales`} className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('footer.legal_mentions', 'Mentions légales')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/politique-de-confidentialite`} className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('footer.privacy', 'Politique de confidentialité')}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/conditions-generales`} className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('footer.terms', 'Conditions générales')}
                  </Link>
                </li>
              </ul>
            </details>
          </div>

          {/* Contact */}
          <div className="border-b border-nubia-gold/10 md:border-none pb-4 md:pb-0">
            <details className="group md:block">
              <summary className="flex justify-between items-center w-full font-playfair text-lg font-bold mb-4 text-nubia-gold cursor-pointer md:cursor-default list-none">
                {t('footer.contact', 'Contact')}
                <span className="md:hidden transition-transform group-open:rotate-180">▼</span>
              </summary>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2 text-nubia-black/85">
                  <Mail size={16} />
                  <a href="mailto:contact@nubiaaura.com" className="hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('footer.email', 'contact@nubiaaura.com')}
                  </a>
                </li>
                <li className="flex items-center space-x-2 text-nubia-black/85">
                  <Phone size={16} />
                  <a href="tel:+221771234567" className="hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded">
                    {t('footer.phone', '+221 77 123 45 67')}
                  </a>
                </li>
                <li className="flex items-start space-x-2 text-nubia-black/85">
                  <MapPin size={16} className="mt-1" />
                  <span>{t('footer.address', 'Thiès, Sénégal')}</span>
                </li>
              </ul>
            </details>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-nubia-gold/20 pt-8 mb-8">
          <div className="text-center mb-6">
            <h3 className="font-playfair text-lg font-bold mb-4 text-nubia-gold">{t('footer.payment_methods', 'Moyens de Paiement')}</h3>
            <p className="text-sm text-nubia-black/85 mb-4">{t('footer.secure_payments', 'Paiements sécurisés via Flutterwave')}</p>
            <div className="flex flex-wrap justify-center gap-6">
              {paymentMethods.map((method) => (
                <div key={method.name} className="flex flex-col items-center group cursor-pointer">
                  <div className="w-20 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 border border-nubia-gold/20 p-2 overflow-hidden">
                    <img
                      src={method.src}
                      alt={method.name}
                      loading="lazy"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="text-xs text-nubia-black/85 mt-2 group-hover:text-nubia-gold transition-colors font-medium">{method.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-nubia-gold/20 pt-8 mb-8">
          <div className="flex justify-center space-x-6">
            <a
              href="https://facebook.com/nubiaaura"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded p-3"
              aria-label={t('footer.facebook', 'Suivez-nous sur Facebook')}
              title={t('footer.facebook', 'Facebook')}
            >
              <Facebook size={24} />
            </a>
            <a
              href="https://instagram.com/nubiaaura"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded p-3"
              aria-label={t('footer.instagram', 'Suivez-nous sur Instagram')}
              title={t('footer.instagram', 'Instagram')}
            >
              <Instagram size={24} />
            </a>
            <a
              href="https://twitter.com/nubiaaura"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nubia-black/85 hover:text-nubia-gold transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 rounded p-3"
              aria-label={t('footer.twitter', 'Suivez-nous sur Twitter')}
              title={t('footer.twitter', 'Twitter')}
            >
              <Twitter size={24} />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-nubia-gold/20 pt-8 text-center text-sm text-nubia-black/70">
          <p className="text-nubia-black/85">{t('footer.copyright', `© ${currentYear} Nubia Aura. Tous droits réservés. Développé par OMA Digital`)}</p>
        </div>
      </div>
    </footer>
  );
}
