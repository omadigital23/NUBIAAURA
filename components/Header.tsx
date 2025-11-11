'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, Search, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { getProductImageUrl } from '@/lib/media';

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
    <header className="sticky top-0 z-50 bg-nubia-black text-nubia-gold border-b border-nubia-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-[148px] h-16 relative md:w-[180px] md:h-20">
              <Image
                src={getProductImageUrl('images/logo.png')}
                alt="Nubia Aura Logo"
                fill
                sizes="(max-width: 768px) 148px, 180px"
                className="object-cover"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-nubia-gold'
                    : 'text-nubia-gold/70 hover:text-nubia-gold'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-nubia-gold hover:text-nubia-white transition-colors">
              <Search size={20} />
            </button>
            <LanguageSwitcher />
            <Link href={`/${locale}/panier`} className="relative p-2 text-nubia-gold hover:text-nubia-white transition-colors">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-nubia-gold text-nubia-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
                  className="p-2 text-nubia-gold hover:text-nubia-white transition-colors"
                  title={t('nav.login', 'Se connecter')}
                >
                  <UserIcon size={20} />
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-nubia-gold hover:text-nubia-white transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2 transition-colors ${
                  isActive(link.href) ? 'text-nubia-gold' : 'text-nubia-gold/70 hover:text-nubia-gold'
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

