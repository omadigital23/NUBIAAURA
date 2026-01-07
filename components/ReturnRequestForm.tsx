'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ReturnItem {
  product_id: string;
  product_name: string;
  quantity: number;
  reason?: string;
}

interface ReturnRequestFormProps {
  orderId: string;
  orderItems: ReturnItem[];
  onSuccess?: () => void;
}

export default function ReturnRequestForm({
  orderId,
  orderItems,
  onSuccess,
}: ReturnRequestFormProps) {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleItemToggle = (productId: string) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedItems.length === 0) {
        setError(t('returns.select_item', 'Veuillez sélectionner au moins un article'));
        setLoading(false);
        return;
      }

      if (reason.length < 10) {
        setError(t('returns.reason_too_short', 'La raison doit contenir au moins 10 caractères'));
        setLoading(false);
        return;
      }

      const returnItems = orderItems
        .filter((item) => selectedItems.includes(item.product_id))
        .map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }));

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          reason,
          items: returnItems,
          comments: comments || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('returns.request_error', 'Erreur lors de la création de la demande'));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setSelectedItems([]);
      setReason('');
      setComments('');

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(t('returns.request_error', 'Erreur lors de la création de la demande'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">
            {t('returns.success_title', 'Demande créée avec succès')}
          </h3>
        </div>
        <p className="text-green-700">
          {t('returns.success_message', 'Votre demande de retour a été reçue. Vous recevrez une confirmation par email et WhatsApp.')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Select Items */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          {t('returns.items_to_return', 'Articles à retourner')} *
        </label>
        <div className="space-y-2">
          {orderItems.map((item) => (
            <label
              key={item.product_id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.product_id)}
                onChange={() => handleItemToggle(item.product_id)}
                className="w-4 h-4 text-gold-600 rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.product_name}</p>
                <p className="text-sm text-gray-600">{t('common.quantity', 'Quantité')}: {item.quantity}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-semibold text-gray-900 mb-2">
          {t('returns.return_reason', 'Raison du retour')} *
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
        >
          <option value="">{t('returns.select_reason', 'Sélectionnez une raison')}</option>
          <option value="defective">{t('returns.defective_product', 'Produit défectueux')}</option>
          <option value="not_as_described">{t('returns.not_as_described', 'Produit non conforme à la description')}</option>
          <option value="wrong_size">{t('returns.wrong_size', 'Mauvaise taille')}</option>
          <option value="different_color">{t('returns.different_color', 'Couleur différente')}</option>
          <option value="damaged">{t('returns.damaged_delivery', 'Produit endommagé à la livraison')}</option>
          <option value="other">{t('returns.other', 'Autre')}</option>
        </select>
      </div>

      {/* Comments */}
      <div>
        <label htmlFor="comments" className="block text-sm font-semibold text-gray-900 mb-2">
          {t('returns.additional_comments', 'Commentaires supplémentaires')}
        </label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder={t('returns.describe_details', 'Décrivez les détails du retour...')}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold-600 hover:bg-gold-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        {loading ? t('returns.creating', 'Création en cours...') : t('returns.create_request', 'Créer la demande de retour')}
      </button>

      <p className="text-xs text-gray-600 text-center">
        * {t('common.required_fields', 'Champs obligatoires')}
      </p>
    </form>
  );
}
