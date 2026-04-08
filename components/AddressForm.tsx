'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader } from 'lucide-react';
import type { Address } from '@/types/address';

interface AddressFormProps {
  address?: Address | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const COUNTRIES = [
  { code: 'SN', name: 'Sénégal' },
  { code: 'MA', name: 'Maroc' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'ML', name: 'Mali' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'GN', name: 'Guinée' },
  { code: 'TG', name: 'Togo' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'NE', name: 'Niger' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'GA', name: 'Gabon' },
  { code: 'CG', name: 'Congo' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CA', name: 'Canada' },
];

export default function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const { t } = useTranslation();
  const isEditing = !!address;

  const [formData, setFormData] = useState({
    label: address?.label || 'Domicile',
    first_name: address?.first_name || '',
    last_name: address?.last_name || '',
    phone: address?.phone || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postal_code: address?.postal_code || '',
    country: address?.country || 'SN',
    is_default: address?.is_default || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = isEditing ? `/api/addresses/${address!.id}` : '/api/addresses';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur');
      }

      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-nubia-gold/30 rounded-lg focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20 transition-all text-sm';
  const labelClass = 'block text-sm font-semibold text-nubia-black mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Label */}
      <div>
        <label htmlFor="label" className={labelClass}>
          {t('common.addresses.labelField', 'Nom de l\'adresse')}
        </label>
        <select
          id="label"
          name="label"
          value={formData.label}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="Domicile">🏠 Domicile</option>
          <option value="Bureau">🏢 Bureau</option>
          <option value="Autre">📍 Autre</option>
        </select>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="first_name" className={labelClass}>
            {t('common.firstName', 'Prénom')} *
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            value={formData.first_name}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="last_name" className={labelClass}>
            {t('common.lastName', 'Nom')} *
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            value={formData.last_name}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>
          {t('common.phone', 'Téléphone')} *
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          value={formData.phone}
          onChange={handleChange}
          className={inputClass}
          placeholder="+221 77 123 45 67"
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address_line1" className={labelClass}>
          {t('common.address', 'Adresse')} *
        </label>
        <input
          id="address_line1"
          name="address_line1"
          type="text"
          required
          value={formData.address_line1}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="address_line2" className={labelClass}>
          {t('common.addressLine2', 'Complément d\'adresse')}
        </label>
        <input
          id="address_line2"
          name="address_line2"
          type="text"
          value={formData.address_line2}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {/* City & Postal */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className={labelClass}>
            {t('common.city', 'Ville')} *
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            value={formData.city}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="postal_code" className={labelClass}>
            {t('common.zipCode', 'Code postal')}
          </label>
          <input
            id="postal_code"
            name="postal_code"
            type="text"
            value={formData.postal_code}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* Country */}
      <div>
        <label htmlFor="country" className={labelClass}>
          {t('common.country', 'Pays')} *
        </label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={handleChange}
          className={inputClass}
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Default checkbox */}
      <div className="flex items-center gap-2">
        <input
          id="is_default"
          name="is_default"
          type="checkbox"
          checked={formData.is_default}
          onChange={handleChange}
          className="w-4 h-4 text-nubia-gold border-gray-300 rounded focus:ring-nubia-gold"
        />
        <label htmlFor="is_default" className="text-sm text-nubia-black">
          {t('common.addresses.setDefault', 'Définir par défaut')}
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border-2 border-gray-300 text-nubia-black font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('common.cancel', 'Annuler')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              {t('common.saving', 'Enregistrement...')}
            </>
          ) : isEditing ? (
            t('common.save', 'Enregistrer')
          ) : (
            t('common.addresses.add', 'Ajouter')
          )}
        </button>
      </div>
    </form>
  );
}
