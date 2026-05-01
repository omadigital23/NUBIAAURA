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

const reasonOptions = [
  'defective_product',
  'not_as_described',
  'wrong_size',
  'different_color',
  'damaged_delivery',
  'other',
];

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
        setError(t('returns.select_item'));
        setLoading(false);
        return;
      }

      if (!reason) {
        setError(t('returns.select_reason_required'));
        setLoading(false);
        return;
      }

      const selectedReason = reason === 'other' ? comments.trim() : t(`returns.reasons.${reason}`);

      if (selectedReason.length < 10) {
        setError(t('returns.reason_too_short'));
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
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          reason: selectedReason,
          items: returnItems,
          comments: comments || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('returns.request_error'));
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
    } catch {
      setError(t('returns.request_error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">
            {t('returns.success_title')}
          </h3>
        </div>
        <p className="text-green-700">
          {t('returns.success_message')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-nubia-black mb-3">
          {t('returns.items_to_return')} *
        </label>
        <div className="space-y-2">
          {orderItems.map((item) => (
            <label
              key={item.product_id}
              className="flex items-center gap-3 p-3 border border-nubia-gold/20 rounded-lg hover:bg-nubia-gold/5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.product_id)}
                onChange={() => handleItemToggle(item.product_id)}
                className="w-4 h-4 accent-nubia-gold rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-nubia-black">{item.product_name}</p>
                <p className="text-sm text-nubia-black/60">{t('cart.quantity')}: {item.quantity}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-semibold text-nubia-black mb-2">
          {t('returns.return_reason')} *
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
        >
          <option value="">{t('returns.select_reason')}</option>
          {reasonOptions.map((option) => (
            <option key={option} value={option}>
              {t(`returns.reasons.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="comments" className="block text-sm font-semibold text-nubia-black mb-2">
          {t('returns.additional_comments')}
        </label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder={t('returns.describe_details')}
          rows={4}
          className="w-full px-4 py-3 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-nubia-gold hover:bg-nubia-white border-2 border-nubia-gold disabled:opacity-50 text-nubia-black font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        {loading ? t('returns.creating') : t('returns.create_request')}
      </button>

      <p className="text-xs text-nubia-black/60 text-center">
        * {t('common.required_fields')}
      </p>
    </form>
  );
}
