'use client';

import { useState, useMemo, useEffect } from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import { withImageParams } from '@/lib/image-formats';

type ProductImage = {
    url: string;
    alt?: string | null;
    position?: number | null;
};

export interface ProductGalleryProps {
    images?: ProductImage[] | null;
    fallbackImage?: string | null;
    productName: string;
}

export function ProductGallery({
    images,
    fallbackImage,
    productName,
}: ProductGalleryProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Build gallery: product_images sorted by position
    const gallery = useMemo(() => {
        const galleryImages: string[] = [];
        if (images && Array.isArray(images)) {
            const sorted = [...images].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0)
            );
            sorted.forEach((img) => {
                if (img.url && !galleryImages.includes(img.url)) {
                    galleryImages.push(img.url);
                }
            });
        }
        if (galleryImages.length === 0 && fallbackImage) {
            galleryImages.push(fallbackImage);
        }
        return galleryImages;
    }, [fallbackImage, images]);

    const currentImage = gallery[activeImageIndex] || fallbackImage;

    return (
        <div className="md:col-span-2">
            {/* Mobile thumbnails - Horizontal */}
            {isMounted && gallery.length > 1 && (
                <div className="relative md:hidden mb-4">
                    <div
                        className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
                        {gallery.map((img, idx) => (
                            <button
                                key={`${img}-${idx}`}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 snap-start ${activeImageIndex === idx
                                        ? 'border-nubia-gold'
                                        : 'border-nubia-gold/30'
                                    }`}
                            >
                                <OptimizedImage
                                    src={withImageParams('thumbnail', img)}
                                    alt={`${productName} - ${idx + 1}`}
                                    fill
                                    sizes="64px"
                                    objectFit="cover"
                                />
                            </button>
                        ))}
                    </div>
                    <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                </div>
            )}

            <div className="flex gap-2 md:gap-4 h-auto md:h-screen md:max-h-screen">
                {/* Thumbnails - Vertical on desktop */}
                {isMounted && gallery.length > 1 && (
                    <div className="hidden md:flex flex-col gap-2 order-first">
                        {gallery.map((img, idx) => (
                            <button
                                key={`${img}-${idx}`}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIndex === idx
                                        ? 'border-nubia-gold'
                                        : 'border-nubia-gold/30'
                                    }`}
                            >
                                <OptimizedImage
                                    src={withImageParams('thumbnail', img)}
                                    alt={`${productName} - ${idx + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 64px, 80px"
                                    objectFit="cover"
                                />
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Image */}
                <div className="w-full md:w-80">
                    <div className="relative w-full aspect-[4/5] md:h-[550px] md:aspect-[2/3] bg-nubia-cream/30 rounded-lg overflow-hidden">
                        {currentImage && (
                            <OptimizedImage
                                src={withImageParams('cover', currentImage)}
                                alt={productName}
                                fill
                                sizes="(max-width: 768px) 100vw, 320px"
                                priority
                                objectFit="cover"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
