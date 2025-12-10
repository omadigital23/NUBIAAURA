'use client';

import { useEffect, useState } from 'react';

export interface DeliveryInfo {
  daysRemaining: number | null;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  isDelivered: boolean;
  isOverdue: boolean;
  status: 'pending' | 'in_transit' | 'delivered' | 'overdue';
  percentageComplete: number;
}

/**
 * Hook for delivery countdown
 * Calculates remaining time until estimated delivery
 */
export function useDeliveryCountdown(
  estimatedDeliveryDate: string | null | undefined,
  deliveryDurationDays: number = 3,
  isDelivered: boolean = false,
  shippedAt: string | null | undefined
): DeliveryInfo {
  const [info, setInfo] = useState<DeliveryInfo>({
    daysRemaining: null,
    hoursRemaining: 0,
    minutesRemaining: 0,
    secondsRemaining: 0,
    isDelivered,
    isOverdue: false,
    status: 'pending',
    percentageComplete: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      if (isDelivered) {
        setInfo({
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          secondsRemaining: 0,
          isDelivered: true,
          isOverdue: false,
          status: 'delivered',
          percentageComplete: 100,
        });
        return;
      }

      if (!estimatedDeliveryDate) {
        setInfo((prev) => ({
          ...prev,
          status: 'pending',
        }));
        return;
      }

      const now = new Date();
      const deliveryDate = new Date(estimatedDeliveryDate);
      const timeDiff = deliveryDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setInfo({
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          secondsRemaining: 0,
          isDelivered: false,
          isOverdue: true,
          status: 'overdue',
          percentageComplete: 100,
        });
        return;
      }

      const totalSeconds = Math.floor(timeDiff / 1000);
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      // Calculate percentage complete
      let percentageComplete = 0;
      if (shippedAt && deliveryDurationDays > 0) {
        const shippedDate = new Date(shippedAt);
        const totalDuration = deliveryDate.getTime() - shippedDate.getTime();
        const elapsed = now.getTime() - shippedDate.getTime();
        percentageComplete = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      }

      setInfo({
        daysRemaining: days,
        hoursRemaining: hours,
        minutesRemaining: minutes,
        secondsRemaining: seconds,
        isDelivered: false,
        isOverdue: false,
        status: 'in_transit',
        percentageComplete,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [estimatedDeliveryDate, isDelivered, shippedAt, deliveryDurationDays]);

  return info;
}

/**
 * Format countdown as string
 */
export function formatCountdown(info: DeliveryInfo): string {
  if (info.isDelivered) {
    return 'Livrée';
  }

  if (info.isOverdue) {
    return 'Retard de livraison';
  }

  if (info.daysRemaining === null) {
    return 'En attente d\'expédition';
  }

  if (info.daysRemaining > 0) {
    return `${info.daysRemaining}j ${info.hoursRemaining}h`;
  }

  return `${info.hoursRemaining}h ${info.minutesRemaining}m`;
}

/**
 * Get countdown status color
 */
export function getCountdownColor(info: DeliveryInfo): string {
  if (info.isDelivered) {
    return 'text-green-600';
  }

  if (info.isOverdue) {
    return 'text-red-600';
  }

  if (info.daysRemaining === null) {
    return 'text-yellow-600';
  }

  if (info.daysRemaining <= 1) {
    return 'text-orange-600';
  }

  return 'text-blue-600';
}

/**
 * Get countdown status background
 */
export function getCountdownBgColor(info: DeliveryInfo): string {
  if (info.isDelivered) {
    return 'bg-green-50 border-green-200';
  }

  if (info.isOverdue) {
    return 'bg-red-50 border-red-200';
  }

  if (info.daysRemaining === null) {
    return 'bg-yellow-50 border-yellow-200';
  }

  if (info.daysRemaining <= 1) {
    return 'bg-orange-50 border-orange-200';
  }

  return 'bg-blue-50 border-blue-200';
}
