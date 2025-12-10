"use client";

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    fill?: boolean;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    loading?: 'lazy' | 'eager';
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * Optimized Image Component
 * 
 * Wrapper around Next/Image with:
 * - Automatic AVIF/WebP conversion
 * - Lazy loading by default
 * - Blur placeholder for better UX
 * - Error handling with fallback
 * - Responsive images with srcset
 * 
 * @example
 * <OptimizedImage
 *   src="/images/product.jpg"
 *   alt="Product name"
 *   fill
 *   sizes="(max-width: 768px) 100vw, 50vw"
 *   className="object-cover"
 * />
 */
export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    quality = 85,
    sizes,
    fill = false,
    objectFit = 'cover',
    loading,
    placeholder = 'empty',
    blurDataURL,
    onLoad,
    onError,
}: OptimizedImageProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Normalize protocol-relative URLs (// -> https://)
    const normalizeImageUrl = (url: string): string => {
        if (!url) return url;
        if (url.startsWith('//')) {
            return 'https:' + url;
        }
        return url;
    };

    // Fallback image for errors
    const fallbackSrc = '/images/placeholder.jpg';

    // Normalize the source URL
    const normalizedSrc = normalizeImageUrl(src);

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        onError?.();
    };

    // Build className with loading state
    const imageClassName = `
    ${className}
    ${isLoading ? 'opacity-0' : 'opacity-100'}
    transition-opacity duration-300
  `.trim();

    // Common props
    const commonProps = {
        alt,
        quality,
        priority,
        loading: loading || (priority ? 'eager' : 'lazy'),
        onLoad: handleLoad,
        onError: handleError,
        className: imageClassName,
        ...(placeholder === 'blur' && blurDataURL ? { placeholder, blurDataURL } : {}),
    } as const;

    // If fill mode
    if (fill) {
        return (
            <div className="relative w-full h-full">
                <Image
                    src={hasError ? fallbackSrc : normalizedSrc}
                    fill
                    sizes={sizes || '100vw'}
                    style={{ objectFit }}
                    {...commonProps}
                />
            </div>
        );
    }

    // If explicit width/height
    if (width && height) {
        return (
            <Image
                src={hasError ? fallbackSrc : normalizedSrc}
                width={width}
                height={height}
                sizes={sizes}
                style={{ objectFit }}
                {...commonProps}
            />
        );
    }

    // Fallback to fill if neither width/height nor fill specified
    return (
        <div className="relative w-full h-full">
            <Image
                src={hasError ? fallbackSrc : normalizedSrc}
                fill
                sizes={sizes || '100vw'}
                style={{ objectFit }}
                {...commonProps}
            />
        </div>
    );
}

/**
 * Utility function to generate blur data URL from color
 * Useful for placeholder colors
 */
export function getBlurDataURL(color: string = '#f3f4f6'): string {
    // Simple 1x1 pixel base64 encoded image
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">
      <rect width="1" height="1" fill="${color}"/>
    </svg>
  `;
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}
