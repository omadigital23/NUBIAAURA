'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Eye, CheckCircle, XCircle } from 'lucide-react';

interface ContactSubmission {
    id: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied' | 'archived';
    created_at: string;
}

interface CustomOrder {
    id: string;
    user_id?: string;
    name: string;
    email: string;
    phone: string;
    type: string;
    measurements: Record<string, any> | null;
    preferences: Record<string, any> | null;
    budget: number | null;
    status: string;
    created_at: string;
    updated_at?: string;
    reference_image_url?: string;
    country?: string;
    // Champs de livraison
    delivery_duration_days?: number;
    shipped_at?: string;
    estimated_delivery_date?: string;
    delivered_at?: string;
    tracking_number?: string;
    carrier?: string;
    return_deadline?: string;
}

interface NewsletterSubscription {
    id: string;
    email: string;
    name?: string;
    subscribed: boolean;
    created_at: string;
}

export default function SubmissionsPage() {
    const [activeTab, setActiveTab] = useState<'contact' | 'custom' | 'newsletter'>('contact');
    const [contacts, setContacts] = useState<ContactSubmission[]>([]);
    const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
    const [newsletters, setNewsletters] = useState<NewsletterSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'contact') {
                const res = await fetch('/api/contact');
                const data = await res.json();
                setContacts(data.submissions || []);
            } else if (activeTab === 'custom') {
                // Use Basic auth with admin credentials
                const credentials = btoa('nubiaaura:Paty2025!');
                const res = await fetch('/api/admin/custom-orders', {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                const data = await res.json();
                console.log('Custom orders response:', data);
                setCustomOrders(data.customOrders || []);
            } else if (activeTab === 'newsletter') {
                const res = await fetch('/api/newsletter');
                const data = await res.json();
                setNewsletters(data.subscriptions || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new':
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'read':
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'replied':
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-nubia-black to-nubia-dark text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold">Dashboard Admin - Soumissions</h1>
                    <p className="text-nubia-white/80 mt-2">Gérez vos messages, commandes et abonnés</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('contact')}
                            className={`${activeTab === 'contact'
                                ? 'border-nubia-gold text-nubia-gold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            📧 Messages de Contact ({contacts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('custom')}
                            className={`${activeTab === 'custom'
                                ? 'border-nubia-gold text-nubia-gold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            🎨 Commandes Sur-mesure ({customOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('newsletter')}
                            className={`${activeTab === 'newsletter'
                                ? 'border-nubia-gold text-nubia-gold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            📬 Newsletter ({newsletters.length})
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="mt-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nubia-gold"></div>
                            <p className="mt-4 text-gray-600">Chargement...</p>
                        </div>
                    ) : (
                        <>
                            {/* Contact Messages */}
                            {activeTab === 'contact' && (
                                <div className="grid gap-4">
                                    {contacts.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-lg shadow">
                                            <p className="text-gray-500">Aucun message de contact</p>
                                        </div>
                                    ) : (
                                        contacts.map((contact) => (
                                            <div
                                                key={contact.id}
                                                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                                onClick={() => setSelectedItem(contact)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                                                                {contact.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            <strong>Sujet:</strong> {contact.subject}
                                                        </p>
                                                        <p className="text-sm text-gray-500 line-clamp-2">{contact.message}</p>
                                                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Mail size={14} />
                                                                {contact.email}
                                                            </span>
                                                            {contact.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone size={14} />
                                                                    {contact.phone}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={14} />
                                                                {formatDate(contact.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button className="ml-4 p-2 hover:bg-gray-100 rounded-full">
                                                        <Eye size={20} className="text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Custom Orders */}
                            {activeTab === 'custom' && (
                                <div className="grid gap-4">
                                    {customOrders.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-lg shadow">
                                            <p className="text-gray-500">Aucune commande sur-mesure</p>
                                        </div>
                                    ) : (
                                        customOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                                onClick={() => setSelectedItem(order)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900">{order.name}</h3>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                            <span className="px-2 py-1 bg-nubia-gold/20 text-nubia-black rounded-full text-xs font-medium">
                                                                {order.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            <strong>Budget:</strong> {order.budget ? `${order.budget.toLocaleString('fr-FR')} FCFA` : 'Non spécifié'}
                                                        </p>
                                                        <p className="text-sm text-gray-500 line-clamp-2">
                                                            <strong>Préférences:</strong> {order.preferences ? JSON.stringify(order.preferences) : 'Non spécifié'}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Mail size={14} />
                                                                {order.email}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={14} />
                                                                {order.phone}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={14} />
                                                                {formatDate(order.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button className="ml-4 p-2 hover:bg-gray-100 rounded-full">
                                                        <Eye size={20} className="text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Newsletter Subscriptions */}
                            {activeTab === 'newsletter' && (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Nom
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Statut
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {newsletters.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                        Aucun abonné
                                                    </td>
                                                </tr>
                                            ) : (
                                                newsletters.map((sub) => (
                                                    <tr key={sub.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {sub.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {sub.name || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {sub.subscribed ? (
                                                                <span className="flex items-center gap-1 text-green-600">
                                                                    <CheckCircle size={16} />
                                                                    Actif
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-gray-400">
                                                                    <XCircle size={16} />
                                                                    Désabonné
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(sub.created_at)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal pour voir les détails */}
            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Détails</h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            {/* Informations principales */}
                            <div className="grid grid-cols-2 gap-4">
                                {selectedItem.name && (
                                    <div className="border-b pb-2">
                                        <p className="text-sm font-medium text-gray-500">Nom</p>
                                        <p className="text-gray-900 mt-1">{selectedItem.name}</p>
                                    </div>
                                )}
                                {selectedItem.email && (
                                    <div className="border-b pb-2">
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="text-gray-900 mt-1">{selectedItem.email}</p>
                                    </div>
                                )}
                                {selectedItem.phone && (
                                    <div className="border-b pb-2">
                                        <p className="text-sm font-medium text-gray-500">Téléphone</p>
                                        <p className="text-gray-900 mt-1">{selectedItem.phone}</p>
                                    </div>
                                )}
                                {selectedItem.type && (
                                    <div className="border-b pb-2">
                                        <p className="text-sm font-medium text-gray-500">Type</p>
                                        <p className="text-gray-900 mt-1">{selectedItem.type}</p>
                                    </div>
                                )}
                                {selectedItem.status && (
                                    <div className="border-b pb-2">
                                        <p className="text-sm font-medium text-gray-500">Statut</p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                                            {selectedItem.status}
                                        </span>
                                    </div>
                                )}
                                {selectedItem.country && (
                                    <div className="border-b pb-2">
                                        <p className="text-sm font-medium text-gray-500">Pays</p>
                                        <p className="text-gray-900 mt-1">{selectedItem.country}</p>
                                    </div>
                                )}
                                {selectedItem.budget && (
                                    <div className="border-b pb-2">
                                        <p className="text-sm font-medium text-gray-500">Budget</p>
                                        <p className="text-gray-900 mt-1 font-semibold">{selectedItem.budget.toLocaleString('fr-FR')} FCFA</p>
                                    </div>
                                )}
                            </div>

                            {/* Préférences et Mesures */}
                            {selectedItem.preferences && (
                                <div className="border-b pb-2">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Préférences</p>
                                    <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                                        {JSON.stringify(selectedItem.preferences, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {selectedItem.measurements && (
                                <div className="border-b pb-2">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Mesures</p>
                                    <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                                        {JSON.stringify(selectedItem.measurements, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Image de référence */}
                            {selectedItem.reference_image_url && (
                                <div className="border-b pb-2">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Image de référence</p>
                                    <img
                                        src={selectedItem.reference_image_url}
                                        alt="Référence"
                                        className="max-w-full h-auto rounded-lg max-h-64 object-contain"
                                    />
                                </div>
                            )}

                            {/* Informations de livraison (pour commandes sur-mesure) */}
                            {(selectedItem.tracking_number || selectedItem.carrier || selectedItem.shipped_at) && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm font-bold text-blue-800 mb-3">📦 Informations de Livraison</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {selectedItem.tracking_number && (
                                            <div>
                                                <span className="text-gray-500">N° Suivi:</span>
                                                <span className="ml-2 font-mono font-medium">{selectedItem.tracking_number}</span>
                                            </div>
                                        )}
                                        {selectedItem.carrier && (
                                            <div>
                                                <span className="text-gray-500">Transporteur:</span>
                                                <span className="ml-2">{selectedItem.carrier}</span>
                                            </div>
                                        )}
                                        {selectedItem.shipped_at && (
                                            <div>
                                                <span className="text-gray-500">Expédié le:</span>
                                                <span className="ml-2">{formatDate(selectedItem.shipped_at)}</span>
                                            </div>
                                        )}
                                        {selectedItem.estimated_delivery_date && (
                                            <div>
                                                <span className="text-gray-500">Livraison estimée:</span>
                                                <span className="ml-2">{formatDate(selectedItem.estimated_delivery_date)}</span>
                                            </div>
                                        )}
                                        {selectedItem.delivered_at && (
                                            <div>
                                                <span className="text-gray-500">Livré le:</span>
                                                <span className="ml-2 text-green-600 font-medium">{formatDate(selectedItem.delivered_at)}</span>
                                            </div>
                                        )}
                                        {selectedItem.delivery_duration_days && (
                                            <div>
                                                <span className="text-gray-500">Durée prévue:</span>
                                                <span className="ml-2">{selectedItem.delivery_duration_days} jours</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                                {selectedItem.created_at && (
                                    <div>
                                        <Calendar size={14} className="inline mr-1" />
                                        Créé le: {formatDate(selectedItem.created_at)}
                                    </div>
                                )}
                                {selectedItem.updated_at && selectedItem.updated_at !== selectedItem.created_at && (
                                    <div>
                                        Modifié le: {formatDate(selectedItem.updated_at)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
