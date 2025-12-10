'use client';

import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useReturnEligibility, formatReturnEligibilityMessage, getReturnEligibilityColor } from '@/hooks/useReturnEligibility';

interface ReturnEligibilityBannerProps {
  orderId: string | null | undefined;
  onReturnClick?: () => void;
}

/**
 * Component to display return eligibility status
 */
export default function ReturnEligibilityBanner({
  orderId,
  onReturnClick,
}: ReturnEligibilityBannerProps) {
  const { eligibility, loading, error } = useReturnEligibility(orderId);

  if (loading || !eligibility) {
    return null;
  }

  if (error) {
    return null;
  }

  const message = formatReturnEligibilityMessage(eligibility);
  const color = getReturnEligibilityColor(eligibility);

  return (
    <div
      className={`border-2 rounded-lg p-4 flex items-start gap-4 ${
        eligibility.eligible
          ? eligibility.hoursRemaining !== undefined && eligibility.hoursRemaining < 24
            ? 'bg-orange-50 border-orange-200'
            : 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 pt-1">
        {eligibility.eligible ? (
          eligibility.hoursRemaining !== undefined && eligibility.hoursRemaining < 24 ? (
            <Clock className="text-orange-600" size={20} />
          ) : (
            <CheckCircle className="text-green-600" size={20} />
          )
        ) : (
          <AlertCircle className="text-red-600" size={20} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <p className={`font-semibold ${color}`}>
          {eligibility.eligible ? 'Retour possible' : 'Retour non disponible'}
        </p>
        <p className="text-sm text-nubia-black/70 mt-1">{message}</p>

        {eligibility.returnDeadline && (
          <p className="text-xs text-nubia-black/60 mt-2">
            Délai limite: {new Date(eligibility.returnDeadline).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* Action button */}
      {eligibility.eligible && onReturnClick && (
        <button
          onClick={onReturnClick}
          className="flex-shrink-0 px-4 py-2 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-white border-2 border-nubia-gold transition-all whitespace-nowrap"
        >
          Demander un retour
        </button>
      )}
    </div>
  );
}
