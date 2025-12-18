'use client';

import { useTranslation } from '@/hooks/useTranslation';

interface SizeFilterProps {
    availableSizes: string[];
    selectedSizes: string[];
    onChange: (sizes: string[]) => void;
    disabledSizes?: string[];
}

// Ordre standard des tailles
const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL'];

export function SizeFilter({ availableSizes, selectedSizes, onChange, disabledSizes = [] }: SizeFilterProps) {
    const { t } = useTranslation();

    const toggleSize = (size: string) => {
        if (disabledSizes.includes(size)) return;

        if (selectedSizes.includes(size)) {
            onChange(selectedSizes.filter((s) => s !== size));
        } else {
            onChange([...selectedSizes, size]);
        }
    };

    // Sort sizes by standard order
    const sortedSizes = [...availableSizes].sort((a, b) => {
        const indexA = sizeOrder.indexOf(a.toUpperCase());
        const indexB = sizeOrder.indexOf(b.toUpperCase());

        // If both are in the standard order, sort by that
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }

        // Numbers come after letters
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }

        // Standard sizes before numbers
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // Alphabetical fallback
        return a.localeCompare(b);
    });

    if (availableSizes.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-nubia-black mb-3 flex items-center justify-between">
                {t('filters.sizes', 'Tailles')}
                {selectedSizes.length > 0 && (
                    <span className="text-xs font-normal bg-nubia-gold/20 text-nubia-gold px-2 py-0.5 rounded-full">
                        {selectedSizes.length}
                    </span>
                )}
            </h3>
            <div className="flex flex-wrap gap-2">
                {sortedSizes.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    const isDisabled = disabledSizes.includes(size);

                    return (
                        <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            disabled={isDisabled}
                            className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg border transition-all ${isDisabled
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                    : isSelected
                                        ? 'bg-nubia-gold text-nubia-black border-nubia-gold'
                                        : 'bg-white text-nubia-black border-nubia-gold/30 hover:border-nubia-gold hover:bg-nubia-gold/10'
                                }`}
                        >
                            {size}
                        </button>
                    );
                })}
            </div>

            {/* Clear selection button */}
            {selectedSizes.length > 0 && (
                <button
                    onClick={() => onChange([])}
                    className="mt-2 text-xs text-nubia-gold hover:underline"
                >
                    {t('filters.clear', 'Effacer')}
                </button>
            )}
        </div>
    );
}

export default SizeFilter;
