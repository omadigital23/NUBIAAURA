'use client';

import { useTranslation } from '@/hooks/useTranslation';

export interface QuantitySelectorProps {
    quantity: number;
    maxQuantity: number;
    onQuantityChange: (quantity: number) => void;
    locale: string;
}

export function QuantitySelector({
    quantity,
    maxQuantity,
    onQuantityChange,
    locale,
}: QuantitySelectorProps) {
    const { t } = useTranslation();

    return (
        <div className="mb-6">
            <div className="mb-2 text-sm text-nubia-black/70 dark:text-nubia-white/70">
                {t('common.quantity', 'Quantité')}
                {maxQuantity > 0 && (
                    <span className="ml-2 text-sm text-nubia-black/50 dark:text-nubia-white/50">
                        ({locale === 'fr' ? 'Max' : 'Max'}: {maxQuantity})
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    className="px-3 py-2 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                    aria-label="Diminuer la quantité"
                >
                    −
                </button>
                <span className="w-12 text-center font-semibold text-nubia-black dark:text-nubia-white">
                    {quantity}
                </span>
                <button
                    onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="px-3 py-2 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Augmenter la quantité"
                >
                    +
                </button>
            </div>
        </div>
    );
}
