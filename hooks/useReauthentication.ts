'use client';

import { useState, useCallback } from 'react';

interface UseReauthenticationOptions {
    onSuccess?: (token: string) => void;
    onCancel?: () => void;
}

export function useReauthentication(options: UseReauthenticationOptions = {}) {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const openModal = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setPendingAction(null);
        options.onCancel?.();
    }, [options]);

    const handleSuccess = useCallback((token: string) => {
        options.onSuccess?.(token);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    }, [options, pendingAction]);

    /**
     * Request reauthentication before executing an action
     * @param action - The action to execute after successful reauthentication
     */
    const requireReauth = useCallback((action: () => void) => {
        setPendingAction(() => action);
        setIsOpen(true);
    }, []);

    /**
     * Verify password directly without modal (for API calls)
     */
    const verifyPassword = useCallback(async (password: string): Promise<{ valid: boolean; token?: string; error?: string }> => {
        try {
            const response = await fetch('/api/auth/reauthenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { valid: false, error: data.error };
            }

            return { valid: data.valid, token: data.token };
        } catch (error: any) {
            return { valid: false, error: error.message };
        }
    }, []);

    return {
        isOpen,
        openModal,
        closeModal,
        handleSuccess,
        requireReauth,
        verifyPassword,
    };
}
