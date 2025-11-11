'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook pour gérer l'authentification admin
 * Récupère et gère le token admin depuis localStorage
 */
export function useAdminToken() {
  const [token, setTokenState] = useState<string>('');
  const [username, setUsernameState] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Charger le token depuis localStorage au montage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem('admin_token') || '';
    const storedUsername = localStorage.getItem('admin_username') || '';

    setTokenState(storedToken);
    setUsernameState(storedUsername);
    setIsAuthenticated(!!storedToken);
    setIsLoading(false);
  }, []);

  // Sauvegarder le token
  const saveToken = (newToken: string, newUsername: string) => {
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_username', newUsername);
    setTokenState(newToken);
    setUsernameState(newUsername);
    setIsAuthenticated(true);
  };

  // Supprimer le token (logout)
  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setTokenState('');
    setUsernameState('');
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  // Vérifier si le token est valide (optionnel)
  const verifyToken = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  return {
    token,
    username,
    isAuthenticated,
    isLoading,
    saveToken,
    logout,
    verifyToken,
  };
}
