'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, Search, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { getProductImageUrl } from '@/lib/media';
import OptimizedImage from './OptimizedImage';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { items: cartItems } = useCartContext();
  const cartCount = cartItems.length;
  const { t, locale } = useTranslation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const isActive = (href: string) => pathname.includes(href);

  const navLinks = [
    { href: `/${locale}/catalogue`, label: t('nav.catalog', 'Catalogue') },
    { href: `/${locale}/sur-mesure`, label: t('nav.custom', 'Sur-Mesure') },
    { href: `/${locale}/a-propos`, label: t('nav.about', 'À propos') },
    { href: `/${locale}/contact`, label: t('nav.contact', 'Contact') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-nubia-black text-nubia-gold border-b border-nubia-gold/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 lg:h-24">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center space-x-2 flex-shrink-0">
            <div className="relative w-[120px] h-12 sm:w-[148px] sm:h-14 md:w-[180px] md:h-16 lg:h-20">
              <OptimizedImage
                src={getProductImageUrl('images/logo.png')}
                alt="Nubia Aura Logo"
                fill
                sizes="(max-width: 640px) 120px, (max-width: 768px) 148px, 180px"
                priority
                objectFit="contain"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${isActive(link.href)
                  ? 'text-nubia-gold'
                  : 'text-nubia-gold/90 hover:text-nubia-gold'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <button
              className="p-3 text-nubia-gold hover:text-nubia-white transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 focus:ring-offset-nubia-black rounded"
              aria-label={t('nav.search', 'Rechercher')}
              title={t('nav.search', 'Rechercher')}
            >
              <Search size={20} className="sm:w-5 sm:h-5" />
            </button>
            <LanguageSwitcher />
            <Link
              href={`/${locale}/panier`}
              className="relative p-3 text-nubia-gold hover:text-nubia-white transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 focus:ring-offset-nubia-black rounded"
              aria-label={t('nav.cart', 'Panier') + (cartCount > 0 ? ` (${cartCount} articles)` : '')}
              title={t('nav.cart', 'Panier')}
            >
              <ShoppingBag size={20} className="sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-nubia-gold text-nubia-black text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu or Login Button */}
            {!isLoading && (
              isAuthenticated && user ? (
                <UserMenu user={user} onLogout={logout} />
              ) : (
                <Link
                  href={`/${locale}/auth/login`}
                  className="p-3 text-nubia-gold hover:text-nubia-white transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 focus:ring-offset-nubia-black rounded"
                  aria-label={t('nav.login', 'Se connecter')}
                  title={t('nav.login', 'Se connecter')}
                >
                  <UserIcon size={20} className="sm:w-5 sm:h-5" />
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-3 text-nubia-gold hover:text-nubia-white transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 focus:ring-offset-nubia-black rounded"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? t('nav.close_menu', 'Fermer le menu') : t('nav.open_menu', 'Ouvrir le menu')}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden pb-4 space-y-2" id="mobile-navigation" role="navigation" aria-label={t('nav.main_navigation', 'Navigation principale')}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 focus:ring-offset-nubia-black rounded ${isActive(link.href) ? 'text-nubia-gold bg-nubia-gold/10' : 'text-nubia-gold/90 hover:text-nubia-gold hover:bg-nubia-gold/5'
                  }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

