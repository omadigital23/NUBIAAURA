'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui';

export interface ProductInfoProps {
    name: string;
    price: number;
    rating?: number | null;
    description?: string | null;
    material?: string | null;
    care?: string | null;
    availableStock: number;
    locale: string;
}

export function ProductInfo({
    name,
    price,
    rating,
    description,
    material,
    care,
    availableStock,
    locale,
}: ProductInfoProps) {
    const stockVariant = useMemo(() => {
        if (availableStock <= 0) return 'default';
        if (availableStock <= 3) return 'danger';
        if (availableStock <= 10) return 'warning';
        return 'success';
    }, [availableStock]);

    return (
        <>
            {/* Title and Price */}
            <h1 className="font-playfair text-3xl md:text-4xl font-bold text-nubia-black dark:text-nubia-white mb-4">
                {name}
            </h1>

            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-nubia-gold">
                    {Number(price).toLocaleString('fr-FR')}{' '}
                    {locale === 'fr' ? 'FCFA' : 'FCFA'}
                </span>
                {rating && (
                    <span className="text-sm text-nubia-white bg-nubia-gold px-3 py-1 rounded-full">
                        {'⭐'.repeat(Math.max(1, Math.min(5, Math.floor(rating))))}
                    </span>
                )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
                {availableStock > 0 ? (
                    <div className="flex items-center gap-2">
                        <Badge variant={stockVariant}>
                            {availableStock <= 3 && '⚠️ '}
                            {locale === 'fr'
                                ? `${availableStock} ${availableStock === 1 ? 'article restant' : 'articles restants'
                                }`
                                : `${availableStock} ${availableStock === 1 ? 'item left' : 'items left'
                                }`}
                        </Badge>
                        {availableStock <= 3 && (
                            <span className="text-sm text-red-600 font-medium">
                                {locale === 'fr' ? 'Dépêchez-vous!' : 'Hurry up!'}
                            </span>
                        )}
                    </div>
                ) : (
                    <Badge variant="default">
                        {locale === 'fr' ? '❌ Rupture de stock' : '❌ Out of stock'}
                    </Badge>
                )}
            </div>

            {/* Description */}
            {description && (
                <p className="text-nubia-black/80 dark:text-nubia-white/80 leading-relaxed mb-6">
                    {description}
                </p>
            )}

            {/* Material */}
            {material && (
                <div className="mb-6 p-4 bg-nubia-cream/20 dark:bg-nubia-dark/50 rounded-lg border border-nubia-gold/20">
                    <h3 className="text-sm font-semibold text-nubia-black dark:text-nubia-white mb-2">
                        {locale === 'fr' ? 'Matière' : 'Material'}
                    </h3>
                    <p className="text-sm text-nubia-black/80 dark:text-nubia-white/80">
                        {material}
                    </p>
                </div>
            )}

            {/* Care Instructions */}
            {care && (
                <div className="mb-6 p-4 bg-nubia-cream/20 dark:bg-nubia-dark/50 rounded-lg border border-nubia-gold/20">
                    <h3 className="text-sm font-semibold text-nubia-black dark:text-nubia-white mb-2">
                        {locale === 'fr' ? 'Entretien' : 'Care Instructions'}
                    </h3>
                    <p className="text-sm text-nubia-black/80 dark:text-nubia-white/80">
                        {care}
                    </p>
                </div>
            )}
        </>
    );
}
