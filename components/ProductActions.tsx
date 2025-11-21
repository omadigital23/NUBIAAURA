'use client';

import { Share2, Heart } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProductActions({ productName, productUrl }: { productName: string; productUrl: string }) {
  const { t } = useTranslation();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const handleShare = async () => {
    const text = `${productName} - Nubia Aura`;
    const url = productUrl;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nubia Aura',
          text,
          url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      const fullText = `${text}\n${url}`;
      navigator.clipboard.writeText(fullText);
      setShareMessage('Lien copié!');
      setTimeout(() => setShareMessage(''), 2000);
    }
  };

  return (
    <div className="mt-8 border-t border-nubia-gold/20 pt-8">
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleShare}
          className="flex items-center space-x-2 px-5 py-3 border border-nubia-gold/30 rounded-lg hover:bg-nubia-gold/10 transition-colors"
        >
          <Share2 size={20} className="text-nubia-gold" />
          <span className="text-sm text-nubia-black">{t('product.share', 'Partager')}</span>
        </button>

        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={`flex items-center space-x-2 px-5 py-3 border rounded-lg transition-colors ${isWishlisted
              ? 'bg-nubia-gold/10 border-nubia-gold text-nubia-gold'
              : 'border-nubia-gold/30 hover:bg-nubia-gold/10 text-nubia-black'
            }`}
        >
          <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
          <span className="text-sm">
            {isWishlisted
              ? t('product.wishlist_remove', 'Retirer')
              : t('product.wishlist_add', 'Ajouter à la liste')}
          </span>
        </button>
      </div>

      {shareMessage && (
        <p className="text-sm text-nubia-gold mt-2">{shareMessage}</p>
      )}
    </div>
  );
}
