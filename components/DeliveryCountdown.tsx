'use client';

import { Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react';
import { useDeliveryCountdown, formatCountdown, getCountdownColor, getCountdownBgColor } from '@/hooks/useDeliveryCountdown';

interface DeliveryCountdownProps {
  estimatedDeliveryDate: string | null | undefined;
  deliveryDurationDays?: number;
  isDelivered?: boolean;
  shippedAt?: string | null;
  showProgress?: boolean;
}

/**
 * Component to display delivery countdown
 */
export default function DeliveryCountdown({
  estimatedDeliveryDate,
  deliveryDurationDays = 3,
  isDelivered = false,
  shippedAt,
  showProgress = true,
}: DeliveryCountdownProps) {
  const info = useDeliveryCountdown(
    estimatedDeliveryDate,
    deliveryDurationDays,
    isDelivered,
    shippedAt
  );

  const countdownText = formatCountdown(info);
  const textColor = getCountdownColor(info);
  const bgColor = getCountdownBgColor(info);

  return (
    <div className={`border-2 rounded-lg p-6 ${bgColor}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {info.isDelivered ? (
          <CheckCircle className="text-green-600" size={24} />
        ) : info.isOverdue ? (
          <AlertCircle className="text-red-600" size={24} />
        ) : info.daysRemaining === null ? (
          <Clock className="text-yellow-600" size={24} />
        ) : (
          <Truck className="text-blue-600" size={24} />
        )}
        <div>
          <p className="text-sm text-nubia-black/70">Livraison estimée</p>
          {estimatedDeliveryDate && (
            <p className="text-xs text-nubia-black/50">
              {new Date(estimatedDeliveryDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Countdown */}
      <div className={`text-3xl font-bold ${textColor} mb-4`}>
        {countdownText}
      </div>

      {/* Detailed countdown */}
      {!info.isDelivered && !info.isOverdue && info.daysRemaining !== null && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-nubia-black">{info.daysRemaining}</p>
            <p className="text-xs text-nubia-black/70">Jours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-nubia-black">{info.hoursRemaining}</p>
            <p className="text-xs text-nubia-black/70">Heures</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-nubia-black">{info.minutesRemaining}</p>
            <p className="text-xs text-nubia-black/70">Minutes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-nubia-black">{info.secondsRemaining}</p>
            <p className="text-xs text-nubia-black/70">Secondes</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {showProgress && !info.isDelivered && info.daysRemaining !== null && (
        <div className="w-full bg-nubia-black/10 rounded-full h-2">
          <div
            className="bg-nubia-gold h-2 rounded-full transition-all duration-1000"
            style={{ width: `${info.percentageComplete}%` }}
          />
        </div>
      )}

      {/* Status message */}
      {info.isDelivered && (
        <p className="text-sm text-green-700 font-semibold">
          ✓ Commande livrée avec succès
        </p>
      )}

      {info.isOverdue && (
        <p className="text-sm text-red-700 font-semibold">
          ⚠ Retard de livraison - Veuillez nous contacter
        </p>
      )}

      {info.daysRemaining === null && (
        <p className="text-sm text-yellow-700 font-semibold">
          ⏳ En attente d'expédition
        </p>
      )}
    </div>
  );
}
