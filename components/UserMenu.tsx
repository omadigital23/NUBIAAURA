'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, Settings, ShoppingBag, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { User as UserType } from '@/hooks/useAuth';

interface UserMenuProps {
  user: UserType;
  onLogout: () => Promise<void>;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
      setIsOpen(false);
      // Rediriger vers la page d'accueil après déconnexion
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Extraire initiales du nom
  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email[0].toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      {/* Bouton Menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-nubia-gold/10 transition-colors text-nubia-gold"
        aria-label={t('nav.account', 'Mon compte')}
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-nubia-gold/20 flex items-center justify-center text-xs font-bold text-nubia-gold">
            {initials}
          </div>
        )}

        {/* Nom et chevron */}
        <div className="hidden sm:flex items-center space-x-1">
          <span className="text-sm font-medium truncate max-w-[100px]">
            {user.name || user.email}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Menu Déroulant */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-nubia-black border border-nubia-gold/20 rounded-lg shadow-lg z-50">
          {/* En-tête avec infos utilisateur */}
          <div className="px-4 py-3 border-b border-nubia-gold/10">
            <p className="text-sm font-medium text-nubia-gold truncate">
              {user.name || user.email}
            </p>
            <p className="text-xs text-nubia-gold/60 truncate">{user.email}</p>
          </div>

          {/* Liens du menu */}
          <nav className="py-2">
            {/* Mon compte */}
            <Link
              href={`/${locale}/client/account`}
              className="flex items-center space-x-3 px-4 py-2 text-sm text-nubia-gold hover:bg-nubia-gold/10 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} />
              <span>{t('nav.profile', 'Profil')}</span>
            </Link>

            {/* Mes commandes */}
            <Link
              href={`/${locale}/client/orders`}
              className="flex items-center space-x-3 px-4 py-2 text-sm text-nubia-gold hover:bg-nubia-gold/10 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ShoppingBag size={16} />
              <span>{t('nav.my_orders', 'Mes commandes')}</span>
            </Link>

            {/* Paramètres */}
            <Link
              href={`/${locale}/client/settings`}
              className="flex items-center space-x-3 px-4 py-2 text-sm text-nubia-gold hover:bg-nubia-gold/10 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={16} />
              <span>{t('nav.settings', 'Paramètres')}</span>
            </Link>

            {/* Séparateur */}
            <div className="my-2 border-t border-nubia-gold/10" />

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-nubia-gold hover:bg-nubia-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={16} />
              <span>
                {isLoggingOut
                  ? t('common.loading', 'Chargement...')
                  : t('nav.logout', 'Déconnexion')}
              </span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
