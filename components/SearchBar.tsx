'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useEffect } from 'react';

export function SearchBar({ initialSearch = '', className = '' }: { initialSearch?: string; className?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    // Construire l'URL de recherche
    const searchParams = new URLSearchParams();
    searchParams.set('q', search.trim());

    // Rediriger vers la page de résultats de recherche
    router.push(`/catalogue/recherche?${searchParams.toString()}`);
  };

  if (!isClient) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nubia-gold">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder={t('catalog.search_placeholder', 'Rechercher...')}
          className="w-full pl-10 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
          disabled
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nubia-gold">
          <Search size={20} />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('catalog.search_placeholder', 'Rechercher...')}
          className="w-full pl-10 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold"
          autoComplete="off"
        />
      </div>
    </form>
  );
}
