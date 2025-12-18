'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Check } from 'lucide-react';

interface ColorFilterProps {
    availableColors: string[];
    selectedColors: string[];
    onChange: (colors: string[]) => void;
}

// Mapping des couleurs vers leurs codes CSS
const colorMap: Record<string, string> = {
    // Français
    'noir': '#1a1a1a',
    'blanc': '#ffffff',
    'beige': '#f5f5dc',
    'or': '#d4af37',
    'rouge': '#dc2626',
    'bleu': '#2563eb',
    'vert': '#16a34a',
    'jaune': '#eab308',
    'rose': '#ec4899',
    'orange': '#f97316',
    'violet': '#8b5cf6',
    'marron': '#92400e',
    'gris': '#6b7280',
    'crème': '#fffdd0',
    'bordeaux': '#800020',
    'marine': '#001f3f',
    'turquoise': '#40e0d0',
    'corail': '#ff7f50',
    'kaki': '#c3b091',
    'doré': '#d4af37',
    // English
    'black': '#1a1a1a',
    'white': '#ffffff',
    'gold': '#d4af37',
    'red': '#dc2626',
    'blue': '#2563eb',
    'green': '#16a34a',
    'yellow': '#eab308',
    'pink': '#ec4899',
    'purple': '#8b5cf6',
    'brown': '#92400e',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'cream': '#fffdd0',
    'burgundy': '#800020',
    'navy': '#001f3f',
    'coral': '#ff7f50',
};

export function ColorFilter({ availableColors, selectedColors, onChange }: ColorFilterProps) {
    const { t } = useTranslation();

    const toggleColor = (color: string) => {
        if (selectedColors.includes(color)) {
            onChange(selectedColors.filter((c) => c !== color));
        } else {
            onChange([...selectedColors, color]);
        }
    };

    const getColorCode = (colorName: string): string => {
        const normalized = colorName.toLowerCase().trim();
        return colorMap[normalized] || '#d4af37'; // Default to gold if unknown
    };

    const getColorLabel = (colorName: string): string => {
        const key = colorName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[^a-z]/g, '');
        return t(`colors.${key}`, colorName);
    };

    if (availableColors.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-nubia-black mb-3 flex items-center justify-between">
                {t('filters.colors', 'Couleurs')}
                {selectedColors.length > 0 && (
                    <span className="text-xs font-normal bg-nubia-gold/20 text-nubia-gold px-2 py-0.5 rounded-full">
                        {selectedColors.length}
                    </span>
                )}
            </h3>
            <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                    const isSelected = selectedColors.includes(color);
                    const colorCode = getColorCode(color);
                    const isLight = colorCode === '#ffffff' || colorCode === '#fffdd0' || colorCode === '#f5f5dc';

                    return (
                        <button
                            key={color}
                            onClick={() => toggleColor(color)}
                            className={`relative w-8 h-8 rounded-full border-2 transition-all ${isSelected
                                    ? 'ring-2 ring-offset-2 ring-nubia-gold border-nubia-gold'
                                    : 'border-gray-200 hover:border-nubia-gold/50'
                                }`}
                            style={{ backgroundColor: colorCode }}
                            title={getColorLabel(color)}
                            aria-label={`${isSelected ? 'Désélectionner' : 'Sélectionner'} ${getColorLabel(color)}`}
                        >
                            {isSelected && (
                                <Check
                                    size={16}
                                    className={`absolute inset-0 m-auto ${isLight ? 'text-nubia-black' : 'text-white'}`}
                                    strokeWidth={3}
                                />
                            )}
                            {isLight && (
                                <span className="absolute inset-0.5 rounded-full border border-gray-200" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected colors labels */}
            {selectedColors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {selectedColors.map((color) => (
                        <span
                            key={color}
                            className="text-xs bg-nubia-cream/50 text-nubia-black/70 px-2 py-1 rounded"
                        >
                            {getColorLabel(color)}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ColorFilter;
