'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AddressCard from '@/components/AddressCard';
import AddressForm from '@/components/AddressForm';
import { Plus, MapPin, Loader, AlertCircle } from 'lucide-react';
import type { Address } from '@/types/address';

export default function AddressesPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/addresses', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur de chargement');
      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchAddresses();
    }
  }, [isAuthenticated, authLoading, fetchAddresses]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.addresses.confirmDelete', 'Supprimer cette adresse ?'))) return;

    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur');
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur');
      setAddresses(prev =>
        prev.map(a => ({ ...a, is_default: a.id === id }))
      );
    } catch {
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAddress(null);
    fetchAddresses();
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-nubia-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin text-nubia-gold" size={40} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nubia-white flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <MapPin className="text-nubia-gold" size={28} />
              <h1 className="font-playfair text-2xl md:text-3xl font-bold text-nubia-black">
                {t('common.addresses.title', 'Carnet d\'adresses')}
              </h1>
            </div>
            <button
              onClick={() => { setEditingAddress(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-colors"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">{t('common.addresses.add', 'Ajouter')}</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                <h2 className="font-playfair text-xl font-bold text-nubia-black mb-4">
                  {editingAddress
                    ? t('common.addresses.edit', 'Modifier l\'adresse')
                    : t('common.addresses.add', 'Ajouter une adresse')}
                </h2>
                <AddressForm
                  address={editingAddress}
                  onSuccess={handleFormSuccess}
                  onCancel={() => { setShowForm(false); setEditingAddress(null); }}
                />
              </div>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-nubia-gold" size={32} />
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="mx-auto mb-4 text-nubia-gold/30" size={48} />
              <p className="text-nubia-black/50 text-lg">
                {t('common.addresses.noAddresses', 'Aucune adresse sauvegardée')}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-2 bg-nubia-gold text-nubia-black font-semibold rounded-lg hover:bg-nubia-gold/90 transition-colors"
              >
                {t('common.addresses.add', 'Ajouter une adresse')}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map(address => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
