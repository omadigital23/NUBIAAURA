/**
 * Payment Methods Selector Component
 * 
 * Displays available payment methods based on country with clear explanations:
 * - Morocco: Chaabi Payment (Banque Populaire - cards)
 * - Senegal: PayTech (Wave, Orange Money, Free Money)
 * - International: PayTech (Visa, Mastercard, Amex)
 * - All: Cash on Delivery
 */

'use client';

import { useEffect, useState } from 'react';
import { Lock, CreditCard, Smartphone, Truck, Globe, Building2, Wallet } from 'lucide-react';

// Payment method type
export type PaymentMethod = 'chaabi' | 'paytech' | 'cod';
export type PaymentSubMethod = 'wave' | 'orange_money' | 'free_money' | 'card' | null;

interface PaymentOption {
    id: string;
    method: PaymentMethod;
    subMethod?: PaymentSubMethod;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
}

interface PaymentMethodsSelectorProps {
    country: string;
    selectedMethod: PaymentMethod | '';
    selectedSubMethod?: PaymentSubMethod;
    onMethodChange: (method: PaymentMethod, subMethod?: PaymentSubMethod) => void;
    disabled?: boolean;
    locale?: 'fr' | 'en';
}

// Payment options by country
const PAYMENT_OPTIONS: Record<string, { title: string; subtitle: string; options: PaymentOption[] }> = {
    MA: {
        title: 'Paiement pour le Maroc',
        subtitle: 'Payez en Dirhams (MAD) via Banque Populaire',
        options: [
            {
                id: 'chaabi',
                method: 'chaabi',
                label: 'Carte bancaire',
                description: 'Visa, Mastercard, CMI via Chaabi Payment (Banque Populaire)',
                icon: <CreditCard className="w-5 h-5" />,
                badge: '🇲🇦 Maroc',
                badgeColor: 'bg-red-100 text-red-700',
            },
            {
                id: 'cod_ma',
                method: 'cod',
                label: 'Paiement à la livraison',
                description: 'Payez en espèces à la réception de votre commande',
                icon: <Truck className="w-5 h-5" />,
            },
        ],
    },
    SN: {
        title: 'Paiement pour le Sénégal',
        subtitle: 'Payez en Francs CFA (XOF) via Mobile Money ou Carte',
        options: [
            {
                id: 'wave',
                method: 'paytech',
                subMethod: 'wave',
                label: 'Wave',
                description: 'Payez instantanément avec votre compte Wave',
                icon: <Wallet className="w-5 h-5 text-[#1DC1EC]" />,
                badge: '🇸🇳 Sénégal',
                badgeColor: 'bg-[#1DC1EC]/10 text-[#1DC1EC]',
            },
            {
                id: 'orange_money',
                method: 'paytech',
                subMethod: 'orange_money',
                label: 'Orange Money',
                description: 'Payez avec votre compte Orange Money',
                icon: <Smartphone className="w-5 h-5 text-orange-500" />,
                badge: '🇸🇳 Sénégal',
                badgeColor: 'bg-orange-100 text-orange-700',
            },
            {
                id: 'free_money',
                method: 'paytech',
                subMethod: 'free_money',
                label: 'Free Money',
                description: 'Payez avec votre compte Free Money',
                icon: <Smartphone className="w-5 h-5 text-green-600" />,
                badge: '🇸🇳 Sénégal',
                badgeColor: 'bg-green-100 text-green-700',
            },
            {
                id: 'paytech_card_sn',
                method: 'paytech',
                subMethod: 'card',
                label: 'Carte bancaire',
                description: 'Visa, Mastercard via PayTech',
                icon: <CreditCard className="w-5 h-5" />,
            },
            {
                id: 'cod_sn',
                method: 'cod',
                label: 'Paiement à la livraison',
                description: 'Payez en espèces à la réception',
                icon: <Truck className="w-5 h-5" />,
            },
        ],
    },
    OTHER: {
        title: 'Paiement International',
        subtitle: 'Payez en USD ou EUR avec votre carte bancaire',
        options: [
            {
                id: 'paytech_card_intl',
                method: 'paytech',
                subMethod: 'card',
                label: 'Carte bancaire internationale',
                description: 'Visa, Mastercard, American Express via PayTech',
                icon: <CreditCard className="w-5 h-5" />,
                badge: '🌍 International',
                badgeColor: 'bg-blue-100 text-blue-700',
            },
            {
                id: 'cod_intl',
                method: 'cod',
                label: 'Paiement à la livraison',
                description: 'Payez en espèces à la réception (selon disponibilité)',
                icon: <Truck className="w-5 h-5" />,
            },
        ],
    },
};

// Get country code from string
function getCountryCode(country: string): string {
    const code = country.toUpperCase();
    if (code === 'MA' || code === 'MAROC' || code === 'MOROCCO') return 'MA';
    if (code === 'SN' || code === 'SENEGAL' || code === 'SÉNÉGAL') return 'SN';
    return 'OTHER';
}

// Get country flag
function getCountryFlag(countryCode: string): string {
    switch (countryCode) {
        case 'MA': return '🇲🇦';
        case 'SN': return '🇸🇳';
        default: return '🌍';
    }
}

export function PaymentMethodsSelector({
    country,
    selectedMethod,
    selectedSubMethod,
    onMethodChange,
    disabled = false,
    locale = 'fr',
}: PaymentMethodsSelectorProps) {
    const [countryCode, setCountryCode] = useState<string>('OTHER');
    const [config, setConfig] = useState(PAYMENT_OPTIONS.OTHER);

    // Update options when country changes
    useEffect(() => {
        const code = getCountryCode(country);
        setCountryCode(code);
        setConfig(PAYMENT_OPTIONS[code] || PAYMENT_OPTIONS.OTHER);
    }, [country]);

    // Handle option selection
    const handleSelect = (option: PaymentOption) => {
        if (disabled) return;
        onMethodChange(option.method, option.subMethod);
    };

    // Check if option is selected
    const isSelected = (option: PaymentOption) => {
        if (option.method !== selectedMethod) return false;
        if (option.subMethod && option.subMethod !== selectedSubMethod) return false;
        if (!option.subMethod && selectedSubMethod) return false;
        return true;
    };

    return (
        <div className="space-y-4">
            {/* Header with country context */}
            <div className="flex items-center justify-between">
                <h3 className="font-playfair text-xl font-bold text-nubia-black">
                    Mode de paiement
                </h3>
                <span className="text-2xl">{getCountryFlag(countryCode)}</span>
            </div>

            {/* Country-specific info banner */}
            <div className="p-4 bg-gradient-to-r from-nubia-gold/10 to-nubia-gold/5 border border-nubia-gold/20 rounded-xl">
                <div className="flex items-start gap-3">
                    {countryCode === 'MA' && <Building2 className="w-5 h-5 text-nubia-gold mt-0.5" />}
                    {countryCode === 'SN' && <Smartphone className="w-5 h-5 text-nubia-gold mt-0.5" />}
                    {countryCode === 'OTHER' && <Globe className="w-5 h-5 text-nubia-gold mt-0.5" />}
                    <div>
                        <p className="font-semibold text-nubia-black">{config.title}</p>
                        <p className="text-sm text-gray-600">{config.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Lock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Paiement 100% sécurisé et crypté</span>
            </div>

            {/* Payment options */}
            <div className="space-y-3">
                {config.options.map((option) => (
                    <label
                        key={option.id}
                        className={`
              relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-nubia-gold hover:bg-nubia-gold/5 hover:shadow-md'}
              ${isSelected(option) ? 'border-nubia-gold bg-nubia-gold/10 shadow-md' : 'border-gray-200'}
            `}
                        onClick={() => handleSelect(option)}
                    >
                        <input
                            type="radio"
                            name="paymentMethod"
                            value={option.id}
                            checked={isSelected(option)}
                            onChange={() => handleSelect(option)}
                            disabled={disabled}
                            className="sr-only"
                        />

                        {/* Icon */}
                        <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center shrink-0
              ${isSelected(option) ? 'bg-nubia-gold text-white' : 'bg-gray-100 text-gray-600'}
            `}>
                            {option.icon}
                        </div>

                        {/* Label and description */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-nubia-black">{option.label}</p>
                                {option.badge && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${option.badgeColor || 'bg-gray-100 text-gray-600'}`}>
                                        {option.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                        </div>

                        {/* Radio indicator */}
                        <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
              ${isSelected(option) ? 'border-nubia-gold bg-nubia-gold' : 'border-gray-300'}
            `}>
                            {isSelected(option) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                    <circle cx="6" cy="6" r="3" />
                                </svg>
                            )}
                        </div>
                    </label>
                ))}
            </div>

            {/* Validation message */}
            {!selectedMethod && (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                    <span>⚠️</span>
                    Veuillez sélectionner un mode de paiement
                </p>
            )}

            {/* Payment providers info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 text-center">
                    {countryCode === 'MA' && 'Paiements sécurisés par Chaabi Payment (Banque Populaire du Maroc)'}
                    {countryCode === 'SN' && 'Paiements sécurisés par PayTech - Agréé BCEAO'}
                    {countryCode === 'OTHER' && 'Paiements internationaux sécurisés par PayTech'}
                </p>
                <div className="flex justify-center gap-4 mt-3 opacity-50">
                    <img src="/images/payments/visa.svg" alt="Visa" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                    {countryCode === 'SN' && (
                        <>
                            <img src="/images/payments/wave.svg" alt="Wave" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                            <img src="/images/payments/orange-money.svg" alt="Orange Money" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentMethodsSelector;
