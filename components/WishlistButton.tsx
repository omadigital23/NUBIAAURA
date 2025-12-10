'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface WishlistButtonProps {
    productId: string;
    size?: number;
    className?: string;
    showText?: boolean;
    onAuthRequired?: () => void;
}

export default function WishlistButton({
    productId,
    size = 24,
    className = '',
    showText = false,
    onAuthRequired
}: WishlistButtonProps) {
    const { isAuthenticated } = useAuth();
    const { isInWishlist, toggleWishlist, loading } = useWishlist();
    const [isAnimating, setIsAnimating] = useState(false);

    const inWishlist = isInWishlist(productId);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }

        setIsAnimating(true);
        await toggleWishlist(productId);

        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`
        flex items-center gap-2 p-2 rounded-full transition-all duration-200
        ${inWishlist
                    ? 'text-red-500 bg-red-50 hover:bg-red-100'
                    : 'text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-600'
                }
        ${isAnimating ? 'scale-125' : 'scale-100'}
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
            title={inWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
            <Heart
                size={size}
                fill={inWishlist ? 'currentColor' : 'none'}
                className={isAnimating ? 'animate-pulse' : ''}
            />
            {showText && (
                <span className="text-sm font-medium">
                    {inWishlist ? 'Dans vos favoris' : 'Ajouter aux favoris'}
                </span>
            )}
        </button>
    );
}
