'use client';

import { useEffect, useState } from 'react';

export interface ReturnEligibility {
  eligible: boolean;
  reason?: string;
  message: string;
  hoursSinceDelivery?: number;
  hoursRemaining?: number;
  returnDeadline?: string;
  deliveredAt?: string;
}

/**
 * Hook to check if an order is eligible for return
 * Returns are allowed within 72 hours of delivery
 */
export function useReturnEligibility(orderId: string | null | undefined) {
  const [eligibility, setEligibility] = useState<ReturnEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setEligibility(null);
      return;
    }

    const checkEligibility = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/returns/eligibility?orderId=${orderId}`);

        if (!response.ok) {
          if (response.status === 401) {
            setError('Unauthorized');
            return;
          }
          throw new Error('Failed to check return eligibility');
        }

        const data = await response.json();
        setEligibility(data);
      } catch (err: any) {
        setError(err.message);
        console.error('[useReturnEligibility] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();

    // Re-check every minute to update remaining time
    const interval = setInterval(checkEligibility, 60000);

    return () => clearInterval(interval);
  }, [orderId]);

  return { eligibility, loading, error };
}

/**
 * Format return eligibility message
 */
export function formatReturnEligibilityMessage(eligibility: ReturnEligibility | null): string {
  if (!eligibility) {
    return '';
  }

  if (eligibility.eligible && eligibility.hoursRemaining !== undefined) {
    const days = Math.floor(eligibility.hoursRemaining / 24);
    const hours = Math.floor(eligibility.hoursRemaining % 24);

    if (days > 0) {
      return `Retour possible jusqu'à ${days}j ${hours}h`;
    }
    return `Retour possible jusqu'à ${hours}h`;
  }

  return eligibility.message;
}

/**
 * Get return eligibility status color
 */
export function getReturnEligibilityColor(eligibility: ReturnEligibility | null): string {
  if (!eligibility) {
    return 'text-nubia-black/70';
  }

  if (eligibility.eligible) {
    if (eligibility.hoursRemaining !== undefined && eligibility.hoursRemaining < 24) {
      return 'text-orange-600';
    }
    return 'text-green-600';
  }

  return 'text-red-600';
}
