'use client';

import { motion } from 'framer-motion';
import { Check, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getWhatsAppHref } from '@/lib/whatsapp-link';

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
  const { t, locale } = useTranslation();
  const [shareMessage, setShareMessage] = useState('');
  const whatsappHref = getWhatsAppHref({
    message: locale === 'fr'
      ? `Bonjour Nubia Aura, je souhaite parler de l'article "${productName}" vu sur votre site. Voici le lien : ${productUrl}`
      : `Hello Nubia Aura, I would like to discuss "${productName}" from your website. Here is the link: ${productUrl}`,
  });

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
    <motion.section className="mt-10 border-t border-nubia-gold/20 pt-8">
      <div className="flex flex-wrap gap-3">
        <motion.button
          type="button"
          onClick={handleShare}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="group inline-flex items-center gap-2 rounded-lg border border-nubia-gold/30 px-5 py-3 text-sm font-medium text-nubia-black transition-all duration-300 hover:border-nubia-gold hover:bg-nubia-gold/10"
        >
          <Share2 size={19} className="text-nubia-gold transition-transform duration-300 group-hover:rotate-6" aria-hidden="true" />
          {t('product.share', 'Partager')}
        </motion.button>

        {whatsappHref && (
          <motion.a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-2 rounded-lg border border-green-500/35 bg-green-50 px-5 py-3 text-sm font-medium text-green-800 transition-all duration-300 hover:border-green-600 hover:bg-green-100"
          >
            <MessageCircle size={19} className="transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            {locale === 'fr' ? 'Contacter l’atelier' : 'Contact the atelier'}
          </motion.a>
        )}
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
      <Check size={15} aria-hidden="true" />
      {message}
    </motion.p>
  );
}
