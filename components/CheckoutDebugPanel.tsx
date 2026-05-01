'use client';

import { useState, useEffect } from 'react';

interface CheckoutDebugPanelProps {
  loading: boolean;
  quoteLoading: boolean;
  cartItemsCount: number;
  paymentMethod: string;
  quote: any;
  quoteError: string | null;
}

export default function CheckoutDebugPanel({
  loading,
  quoteLoading,
  cartItemsCount,
  paymentMethod,
  quote,
  quoteError
}: CheckoutDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Toggle avec Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (process.env.NODE_ENV === 'production' || !isVisible) {
    return null;
  }
  
  const isButtonDisabled = loading || quoteLoading || cartItemsCount === 0 || paymentMethod === '';
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-2xl max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">🔍 Checkout Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/70 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span>Bouton actif:</span>
          <span className={`font-bold ${!isButtonDisabled ? 'text-green-400' : 'text-red-400'}`}>
            {!isButtonDisabled ? '✅ OUI' : '❌ NON'}
          </span>
        </div>
        
        <hr className="border-white/20" />
        
        <div className="flex justify-between items-center">
          <span>loading:</span>
          <span className={loading ? 'text-red-400' : 'text-green-400'}>
            {loading ? '❌ true' : '✅ false'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>quoteLoading:</span>
          <span className={quoteLoading ? 'text-red-400' : 'text-green-400'}>
            {quoteLoading ? '❌ true' : '✅ false'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>cartItemsCount:</span>
          <span className={cartItemsCount === 0 ? 'text-red-400' : 'text-green-400'}>
            {cartItemsCount === 0 ? '❌ 0' : `✅ ${cartItemsCount}`}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>paymentMethod:</span>
          <span className={paymentMethod === '' ? 'text-red-400' : 'text-green-400'}>
            {paymentMethod === '' ? '❌ vide' : `✅ "${paymentMethod}"`}
          </span>
        </div>
        
        <hr className="border-white/20" />
        
        <div className="flex justify-between items-center">
          <span>quote:</span>
          <span className={!quote ? 'text-red-400' : 'text-green-400'}>
            {!quote ? '❌ null' : '✅ calculé'}
          </span>
        </div>
        
        {quote && (
          <div className="text-xs bg-white/10 p-2 rounded">
            <div>Subtotal: {quote.subtotal} FCFA</div>
            <div>Shipping: {quote.shipping} FCFA</div>
            <div>Tax: {quote.tax} FCFA</div>
            <div className="font-bold">Total: {quote.total} FCFA</div>
          </div>
        )}
        
        {quoteError && (
          <div className="text-xs bg-red-500/20 p-2 rounded text-red-300">
            Erreur: {quoteError}
          </div>
        )}
        
        <hr className="border-white/20" />
        
        <div className="text-xs text-white/70">
          {isButtonDisabled ? (
            <div className="space-y-1">
              <div className="font-bold text-red-400">❌ Pourquoi le bouton est inactif:</div>
              {loading && <div>• En cours de traitement</div>}
              {quoteLoading && <div>• Calcul du quote en cours</div>}
              {cartItemsCount === 0 && <div>• Panier vide</div>}
              {paymentMethod === '' && <div>• Aucun mode de paiement sélectionné</div>}
            </div>
          ) : (
            <div className="text-green-400 font-bold">
              ✅ Toutes les conditions sont remplies!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
