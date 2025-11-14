'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

const TOKEN_KEY = 'sb-auth-token';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      setToken(stored);
    } catch (err) {
      console.error('[useAuthToken] Error loading token:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToken = useCallback((newToken: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    } catch (err) {
      console.error('[useAuthToken] Error saving token:', err);
    }
  }, []);

  const clearToken = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
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
