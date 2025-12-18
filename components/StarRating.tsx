'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    interactive?: boolean;
    onChange?: (rating: number) => void;
    showValue?: boolean;
}

export function StarRating({
    rating,
    maxRating = 5,
    size = 20,
    interactive = false,
    onChange,
    showValue = false,
}: StarRatingProps) {
    const handleClick = (value: number) => {
        if (interactive && onChange) {
            onChange(value);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: maxRating }, (_, i) => {
                const value = i + 1;
                const filled = value <= rating;
                const partial = !filled && value - 1 < rating && rating < value;

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleClick(value)}
                        disabled={!interactive}
                        className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                        aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                    >
                        <Star
                            size={size}
                            className={`transition-colors ${filled
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-300'
                                }`}
                        />
                        {partial && (
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${(rating - (value - 1)) * 100}%` }}
                            >
                                <Star
                                    size={size}
                                    className="fill-yellow-400 text-yellow-400"
                                />
                            </div>
                        )}
                    </button>
                );
            })}
            {showValue && (
                <span className="ml-2 text-sm text-nubia-black/70">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}

export default StarRating;
