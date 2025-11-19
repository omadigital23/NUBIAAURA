'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

const TOKEN_KEY = 'sb-auth-token';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount and listen for changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      setToken(stored);
      setIsLoading(false);
    } catch (err) {
      console.error('[useAuthToken] Error loading token:', err);
      setIsLoading(false);
    }

    // Listen for storage changes (e.g., from other tabs or after login)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        console.log('[useAuthToken] Token changed in storage:', e.newValue ? 'present' : 'cleared');
        setToken(e.newValue);
      }
    };

    // Also listen for custom events from saveToken/clearToken
    const handleCustomTokenChange = (e: CustomEvent) => {
      console.log('[useAuthToken] Token changed via custom event:', e.detail ? 'present' : 'cleared');
      setToken(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('token-changed', handleCustomTokenChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token-changed', handleCustomTokenChange as EventListener);
    };
  }, []);

  const saveToken = useCallback((newToken: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      // Dispatch custom event for immediate update
      window.dispatchEvent(new CustomEvent('token-changed', { detail: newToken }));
      console.log('[useAuthToken] Token saved and updated');
    } catch (err) {
      console.error('[useAuthToken] Error saving token:', err);
    }
  }, []);

  const clearToken = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      // Dispatch custom event for immediate update
      window.dispatchEvent(new CustomEvent('token-changed', { detail: null }));
      console.log('[useAuthToken] Token cleared');
    } catch (err) {
      console.error('[useAuthToken] Error clearing token:', err);
    }
  }, []);

  const getAuthHeaders = useMemo(() => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
    };
  }, [token]);

  return {
    token,
    isLoading,
    saveToken,
    clearToken,
    getAuthHeaders,
  };
}
