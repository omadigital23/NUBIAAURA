'use client';

import { useTranslation } from '@/hooks/useTranslation';

export interface ProductVariantSelectorProps {
    sizes?: string[] | null;
    colors?: string[] | null;
    selectedSize: string | null;
    selectedColor: string | null;
    onSizeChange: (size: string) => void;
    onColorChange: (color: string) => void;
    locale: string;
}

export function ProductVariantSelector({
    sizes = [],
    colors = [],
    selectedSize,
    selectedColor,
    onSizeChange,
    onColorChange,
    locale,
}: ProductVariantSelectorProps) {
    const { t } = useTranslation();

    const colorLabel = (raw: string) => {
        const key = raw
            .toLowerCase()
            .normalize('NFD')
            .replace(/[^a-z]/g, '');
        return t(`colors.${key}`, raw);
    };

    const sizesList = sizes || [];
    const colorsList = colors || [];

    if (!sizesList.length && !colorsList.length) return null;

    return (
        <>
            {/* Size Selector */}
            {sizesList.length > 0 && (
                <div className="mb-6">
                    <div className="mb-2 text-sm text-nubia-black/70">
                        {t('product.size', 'Size')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sizesList.map((s) => (
                            <button
                                key={s}
                                className={`px-3 py-2 border rounded-lg transition-colors ${selectedSize === s
                                        ? 'border-nubia-gold bg-nubia-gold/10'
                                        : 'border-nubia-gold/30 hover:border-nubia-gold/50'
                                    }`}
                                onClick={() => onSizeChange(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Color Selector */}
            {colorsList.length > 0 && (
                <div className="mb-6">
                    <div className="mb-2 text-sm text-nubia-black/70">
                        {t('product.color', 'Color')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {colorsList.map((c) => (
                            <button
                                key={c}
                                className={`px-3 py-2 border rounded-lg transition-colors ${selectedColor === c
                                        ? 'border-nubia-gold bg-nubia-gold/10'
                                        : 'border-nubia-gold/30 hover:border-nubia-gold/50'
                                    }`}
                                onClick={() => onColorChange(c)}
                            >
                                {colorLabel(c)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
