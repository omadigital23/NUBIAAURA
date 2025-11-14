'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';
import { useAuthToken } from '@/hooks/useAuthToken';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { saveToken } = useAuthToken();

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Save token to localStorage
      if (data.token) {
        saveToken(data.token);
      }

      setLoginData({ email: '', password: '' });
      onLoginSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          password: signupData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Après inscription, se connecter automatiquement
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        // Save token to localStorage
        if (loginData.token) {
          saveToken(loginData.token);
        }
        setSignupData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
        onLoginSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-nubia-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-nubia-white border-b border-nubia-gold/20 p-6 flex items-center justify-between">
          <h2 className="font-playfair text-2xl font-bold text-nubia-black">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-nubia-gold/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-nubia-black" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all"
              >
                Créer un compte
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                    <input
                      type="text"
                      value={signupData.firstName}
                      onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                      placeholder="Prénom"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-nubia-black mb-2">
                    Nom
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                    <input
                      type="text"
                      value={signupData.lastName}
                      onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                      placeholder="Nom"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-nubia-black mb-2">
                  Confirmer mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-nubia-gold/60" size={20} />
                  <input
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Inscription...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="w-full py-3 border-2 border-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/10 transition-all"
              >
                J'ai déjà un compte
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
