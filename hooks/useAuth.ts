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

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async () => {
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

  // Écouter les changements de token (après login/logout)
  useEffect(() => {
    const handleTokenChange = (e: CustomEvent) => {
      console.log('[useAuth] Token changed, refetching user...', e.detail ? 'token present' : 'token cleared');
      if (e.detail) {
        // Token ajouté/modifié - refetch user
        fetchUser();
      } else {
        // Token supprimé - clear user
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

      setUser(null);
      setIsAuthenticated(false);
      // Ne pas rediriger ici — laisser le composant UserMenu gérer la redirection
      // après avoir fermé le dropdown

      // Forcer un refetch pour s'assurer que l'état est à jour
      await fetchUser();
    } catch (error) {
      console.error('Error logging out:', error);
      // Même en cas d'erreur, vider l'état local
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [fetchUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    refetch: fetchUser,
  };
}
