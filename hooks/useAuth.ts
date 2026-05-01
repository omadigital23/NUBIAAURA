'use client';

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
}

interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const isE2E = process.env.NEXT_PUBLIC_E2E === '1';

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async () => {
    if (isE2E) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger l'utilisateur au montage
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Écouter les changements de session (après login/logout)
  useEffect(() => {
    const handleTokenChange = (e: CustomEvent) => {
      console.log('[useAuth] Session changed, refetching user...', e.detail ? 'session present' : 'session cleared');
      if (e.detail) {
        fetchUser();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('token-changed', handleTokenChange as EventListener);

    return () => {
      window.removeEventListener('token-changed', handleTokenChange as EventListener);
    };
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Clear localStorage token
      localStorage.removeItem('sb-auth-token');
      // Dispatch event to notify other hooks (useCart, etc.)
      window.dispatchEvent(new CustomEvent('token-changed', { detail: null }));

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
      // Even on error, clear local state
      localStorage.removeItem('sb-auth-token');
      window.dispatchEvent(new CustomEvent('token-changed', { detail: null }));
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    refetch: fetchUser,
  };
}
