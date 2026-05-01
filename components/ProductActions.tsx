'use client';

import { motion } from 'framer-motion';
import { Check, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

function copyWithSelection(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

export default function ProductActions({ productName, productUrl }: { productName: string; productUrl: string }) {
  const { t } = useTranslation();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const handleShare = async () => {
    const text = `${productName} - Nubia Aura`;
    const fullText = `${text}\n${productUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nubia Aura',
          text,
          url: productUrl,
        });
        return;
      } catch {
        setShareMessage(t('product.share_cancelled', 'Partage annulé'));
        setTimeout(() => setShareMessage(''), 1800);
        return;
      }
    }

    const copied = copyWithSelection(fullText);
    setShareMessage(copied ? t('product.link_copied', 'Lien copié') : productUrl);
    setTimeout(() => setShareMessage(''), 2400);
  };

  return (
    <motion.section
      className="mt-10 border-t border-nubia-gold/20 pt-8"
    >
      <div className="flex flex-wrap gap-3">
        <motion.button
          type="button"
          onClick={handleShare}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="group inline-flex items-center gap-2 rounded-lg border border-nubia-gold/30 px-5 py-3 text-sm font-medium text-nubia-black transition-all duration-300 hover:border-nubia-gold hover:bg-nubia-gold/10"
        >
          <Share2 size={19} className="text-nubia-gold transition-transform duration-300 group-hover:rotate-6" />
          {t('product.share', 'Partager')}
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setIsWishlisted(!isWishlisted)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className={`group inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition-all duration-300 ${
            isWishlisted
              ? 'border-nubia-gold bg-nubia-gold/10 text-nubia-gold'
              : 'border-nubia-gold/30 text-nubia-black hover:border-nubia-gold hover:bg-nubia-gold/10'
          }`}
        >
          <Heart
            size={19}
            fill={isWishlisted ? 'currentColor' : 'none'}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          {isWishlisted
            ? t('product.wishlist_remove', 'Retirer')
            : t('product.wishlist_add', 'Ajouter à la liste')}
        </motion.button>
      </div>

      <AnimateShareMessage message={shareMessage} />
    </motion.section>
  );
}

function AnimateShareMessage({ message }: { message: string }) {
  if (!message) return null;

  return (
    <motion.p
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="mt-3 inline-flex items-center gap-2 rounded-full bg-nubia-cream/40 px-3 py-1 text-sm font-medium text-nubia-gold"
    >
      <Check size={15} />
      {message}
    </motion.p>
  );
}
