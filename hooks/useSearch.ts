'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface SearchSuggestion {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string | null;
    category: string;
}

interface UseSearchResult {
    query: string;
    setQuery: (query: string) => void;
    suggestions: SearchSuggestion[];
    categories: string[];
    loading: boolean;
    error: string | null;
    clearSuggestions: () => void;
}

export function useSearch(): UseSearchResult {
    const { locale } = useTranslation();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const cacheRef = useRef<Map<string, { suggestions: SearchSuggestion[]; categories: string[] }>>(new Map());

    const search = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) {
            setSuggestions([]);
            setCategories([]);
            return;
        }

        // Check cache first
        const cacheKey = `${searchQuery.toLowerCase()}_${locale}`;
        if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey)!;
            setSuggestions(cached.suggestions);
            setCategories(cached.categories);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&locale=${locale}&limit=8`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erreur de recherche');
            }

            setSuggestions(data.suggestions || []);
            setCategories(data.categories || []);

            // Cache the result
            cacheRef.current.set(cacheKey, {
                suggestions: data.suggestions || [],
                categories: data.categories || [],
            });

            // Limit cache size
            if (cacheRef.current.size > 50) {
                const firstKey = cacheRef.current.keys().next().value;
                if (firstKey !== undefined) {
                    cacheRef.current.delete(firstKey);
                }
            }

        } catch (err: any) {
            setError(err.message);
            setSuggestions([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, [locale]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            search(query);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, search]);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setCategories([]);
    }, []);

    return {
        query,
        setQuery,
        suggestions,
        categories,
        loading,
        error,
        clearSuggestions,
    };
}

export default useSearch;
