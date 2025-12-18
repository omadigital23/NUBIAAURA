'use client';

import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@/hooks/useSearch';

export function SearchBar({ initialSearch = '', className = '' }: { initialSearch?: string; className?: string }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { query, setQuery, suggestions, loading, clearSuggestions } = useSearch();
  const [isClient, setIsClient] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    if (initialSearch) {
      setQuery(initialSearch);
    }
  }, [initialSearch, setQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsFocused(false);
    clearSuggestions();

    const searchParams = new URLSearchParams();
    searchParams.set('q', query.trim());
    router.push(`/${locale}/catalogue?${searchParams.toString()}`);
  };

  const handleSuggestionClick = (slug: string) => {
    setIsFocused(false);
    clearSuggestions();
    router.push(`/${locale}/produit/${slug}`);
  };

  const handleClear = () => {
    setQuery('');
    clearSuggestions();
  };

  const showDropdown = isFocused && query.length >= 2 && (suggestions.length > 0 || loading);

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
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nubia-gold">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={t('catalog.search_placeholder', 'Rechercher...')}
            className="w-full pl-10 pr-10 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold bg-white"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-nubia-black/40 hover:text-nubia-black"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown Suggestions */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-nubia-gold/20 rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-nubia-black/50">
              <Loader2 size={20} className="animate-spin inline-block mr-2" />
              {t('common.loading', 'Chargement...')}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-nubia-black/50">
              {t('search.no_results', 'Aucun résultat trouvé')}
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.slug)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-nubia-cream/30 transition-colors text-left"
                  >
                    {/* Product Image */}
                    {suggestion.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-nubia-cream/20 flex-shrink-0">
                        <img
                          src={suggestion.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-nubia-black truncate">
                        {suggestion.name}
                      </p>
                      <p className="text-sm text-nubia-gold font-semibold">
                        {suggestion.price.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </button>
                </li>
              ))}

              {/* View All Results */}
              {suggestions.length > 0 && (
                <li className="border-t border-nubia-gold/10">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full p-3 text-center text-nubia-gold font-medium hover:bg-nubia-cream/30 transition-colors"
                  >
                    {t('search.view_all', 'Voir tous les résultats')} →
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
