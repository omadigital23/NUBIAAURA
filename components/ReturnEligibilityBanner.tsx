'use client';

import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useReturnEligibility, getReturnEligibilityColor } from '@/hooks/useReturnEligibility';
import { useTranslation } from '@/hooks/useTranslation';

interface ReturnEligibilityBannerProps {
  orderId: string | null | undefined;
  onReturnClick?: () => void;
}

export default function ReturnEligibilityBanner({
  orderId,
  onReturnClick,
}: ReturnEligibilityBannerProps) {
  const { eligibility, loading, error } = useReturnEligibility(orderId);
  const { t, locale } = useTranslation();

  if (loading || !eligibility || error) {
    return null;
  }

  const message = (() => {
    if (eligibility.eligible && eligibility.hoursRemaining !== undefined) {
      const days = Math.floor(eligibility.hoursRemaining / 24);
      const hours = Math.floor(eligibility.hoursRemaining % 24);
      const remaining = days > 0
        ? `${days} ${t(days > 1 ? 'common.days' : 'common.day')} ${hours} h`
        : `${hours} h`;

      return `${t('returns.eligibility.remaining')} ${remaining}`;
    }

    return eligibility.message;
  })();

  const color = getReturnEligibilityColor(eligibility);

  return (
    <div
      className={`border-2 rounded-lg p-4 flex flex-col gap-4 sm:flex-row sm:items-start ${
        eligibility.eligible
          ? eligibility.hoursRemaining !== undefined && eligibility.hoursRemaining < 24
            ? 'bg-orange-50 border-orange-200'
            : 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-start gap-4 flex-1">
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

        <div className="flex-1">
          <p className={`font-semibold ${color}`}>
            {eligibility.eligible ? t('returns.eligibility.available') : t('returns.eligibility.unavailable')}
          </p>
          <p className="text-sm text-nubia-black/70 mt-1">{message}</p>

          {eligibility.returnDeadline && (
            <p className="text-xs text-nubia-black/60 mt-2">
              {t('returns.eligibility.deadline')}{' '}
              {new Date(eligibility.returnDeadline).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>

      {eligibility.eligible && onReturnClick && (
        <button
          type="button"
          onClick={onReturnClick}
          className="flex-shrink-0 rounded-lg border-2 border-nubia-gold bg-nubia-gold px-4 py-2 font-semibold text-nubia-black transition-all hover:bg-nubia-white"
        >
          {t('returns.request_return')}
        </button>
      )}
    </div>
  );
}
