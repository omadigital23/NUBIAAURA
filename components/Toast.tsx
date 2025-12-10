'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Store global pour les toasts
let toastStore: ToastMessage[] = [];
let listeners: Set<(toasts: ToastMessage[]) => void> = new Set();

const addToastListener = (listener: (toasts: ToastMessage[]) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toastStore]));
};

/**
 * Provider pour les notifications toast
 * À ajouter dans le layout root
 */
export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = addToastListener(setToasts);
    return () => {
      unsubscribe();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    toastStore = toastStore.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * Composant Toast individuel
 */
function Toast({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: () => void;
}) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [toast.duration, onClose]);

  const bgColor = {
    success: 'bg-green-900/90 border-green-600',
    error: 'bg-red-900/90 border-red-600',
    loading: 'bg-nubia-black/90 border-nubia-gold',
    info: 'bg-blue-900/90 border-blue-600',
  }[toast.type];

  const textColor = {
    success: 'text-green-100',
    error: 'text-red-100',
    loading: 'text-nubia-gold',
    info: 'text-blue-100',
  }[toast.type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    loading: Info,
    info: Info,
  }[toast.type];

  return (
    <div
      className={`${bgColor} border rounded-lg p-4 flex items-start gap-3 pointer-events-auto max-w-sm animate-in fade-in slide-in-from-right-4 duration-300`}
    >
      <Icon className={`${textColor} flex-shrink-0 mt-0.5`} size={20} />
      <p className={`${textColor} text-sm flex-1`}>{toast.message}</p>
      <button
        onClick={onClose}
        className={`${textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
      >
        <X size={18} />
      </button>
    </div>
  );
}

/**
 * Utilitaires pour afficher les notifications
 */
export const showToast = {
  /**
   * Notification de succès
   */
  success: (message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toastStore.push({ id, message, type: 'success', duration });
    notifyListeners();
    return id;
  },

  /**
   * Notification d'erreur
   */
  error: (message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toastStore.push({ id, message, type: 'error', duration });
    notifyListeners();
    return id;
  },

  /**
   * Notification de chargement
   */
  loading: (message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toastStore.push({ id, message, type: 'loading', duration: 0 });
    notifyListeners();
    return id;
  },

  /**
   * Notification info
   */
  info: (message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toastStore.push({ id, message, type: 'info', duration });
    notifyListeners();
    return id;
  },

  /**
   * Dismiss un toast
   */
  dismiss: (id: string) => {
    toastStore = toastStore.filter((t) => t.id !== id);
    notifyListeners();
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toastStore = [];
    notifyListeners();
  },

  /**
   * Promise toast (pour les opérations asynchrones)
   */
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    const loadingId = showToast.loading(messages.loading);

    try {
      const result = await promise;
      showToast.dismiss(loadingId);
      showToast.success(messages.success);
      return result;
    } catch (error) {
      showToast.dismiss(loadingId);
      showToast.error(messages.error);
      throw error;
    }
  },
};
