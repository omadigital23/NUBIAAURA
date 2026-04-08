'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { MapPin, Edit2, Trash2, Star } from 'lucide-react';
import type { Address } from '@/types/address';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export default function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative p-5 rounded-xl border-2 transition-all ${
      address.is_default
        ? 'border-nubia-gold bg-nubia-gold/5'
        : 'border-gray-200 bg-white hover:border-nubia-gold/30'
    }`}>
      {/* Default badge */}
      {address.is_default && (
        <span className="absolute top-3 right-3 px-2 py-1 bg-nubia-gold text-nubia-black text-xs font-bold rounded-full flex items-center gap-1">
          <Star size={12} fill="currentColor" />
          {t('common.addresses.default', 'Par défaut')}
        </span>
      )}

      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-nubia-gold" />
        <span className="font-semibold text-nubia-black">{address.label}</span>
      </div>

      {/* Address details */}
      <div className="space-y-1 text-sm text-nubia-black/70 mb-4">
        <p className="font-medium text-nubia-black">
          {address.first_name} {address.last_name}
        </p>
        <p>{address.address_line1}</p>
        {address.address_line2 && <p>{address.address_line2}</p>}
        <p>
          {address.postal_code && `${address.postal_code} `}
          {address.city}
          {address.state && `, ${address.state}`}
        </p>
        <p>{address.country}</p>
        <p className="text-nubia-gold">{address.phone}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(address)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-nubia-black/70 hover:text-nubia-gold transition-colors rounded-lg hover:bg-nubia-gold/5"
        >
          <Edit2 size={14} />
          {t('common.addresses.edit', 'Modifier')}
        </button>

        {!address.is_default && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-nubia-black/70 hover:text-nubia-gold transition-colors rounded-lg hover:bg-nubia-gold/5"
          >
            <Star size={14} />
            {t('common.addresses.setDefault', 'Par défaut')}
          </button>
        )}

        <button
          onClick={() => onDelete(address.id)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50 ml-auto"
        >
          <Trash2 size={14} />
          {t('common.addresses.delete', 'Supprimer')}
        </button>
      </div>
    </div>
  );
}
