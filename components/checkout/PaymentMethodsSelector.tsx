/**
 * Payment Methods Selector Component
 * 
 * Displays available payment methods based on selected country:
 * - Senegal: Wave, Orange Money, Free Money, Wizall, Expresso/Mixx, Cards
 * - Côte d'Ivoire: Orange Money, MTN Money, Moov Money, Wave, Cards
 * - Mali: Orange Money, Moov Africa, Cards
 * - Benin: MTN Money, Moov Money, Cards
 * - Morocco & International: Cards only
 * - All: Cash on Delivery
 */

'use client';

import { useEffect, useState } from 'react';
import { Lock, CreditCard, Smartphone, Truck, Globe, Wallet } from 'lucide-react';

// Payment method type
export type PaymentMethod = 'paytech' | 'cod';
export type PaymentSubMethod = 'wave' | 'orange_money' | 'free_money' | 'wizall' | 'expresso' | 'mtn_money' | 'moov_money' | 'card' | null;

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

interface CountryPaymentConfig {
    title: string;
    subtitle: string;
    flag: string;
    options: PaymentOption[];
}

// Common payment options
const CARD_OPTION: PaymentOption = {
    id: 'paytech_card',
    method: 'paytech',
    subMethod: 'card',
    label: 'Carte bancaire',
    description: 'Visa, Mastercard',
    icon: <CreditCard className="w-5 h-5" />,
};

const COD_OPTION: PaymentOption = {
    id: 'cod',
    method: 'cod',
    label: 'Paiement à la livraison',
    description: 'Payez en espèces à la réception',
    icon: <Truck className="w-5 h-5" />,
};

// Payment options by country
const PAYMENT_OPTIONS: Record<string, CountryPaymentConfig> = {
    // 🇸🇳 Sénégal - Full range of options
    SN: {
        title: 'Paiement pour le Sénégal',
        subtitle: 'Payez en Francs CFA (XOF)',
        flag: '🇸🇳',
        options: [
            {
                id: 'wave_sn',
                method: 'paytech',
                subMethod: 'wave',
                label: 'Wave',
                description: 'Paiement instantané Wave',
                icon: <Wallet className="w-5 h-5 text-[#1DC1EC]" />,
                badge: 'Populaire',
                badgeColor: 'bg-[#1DC1EC]/10 text-[#1DC1EC]',
            },
            {
                id: 'orange_money_sn',
                method: 'paytech',
                subMethod: 'orange_money',
                label: 'Orange Money',
                description: 'Paiement Orange Money',
                icon: <Smartphone className="w-5 h-5 text-orange-500" />,
                badgeColor: 'bg-orange-100 text-orange-700',
            },
            {
                id: 'free_money_sn',
                method: 'paytech',
                subMethod: 'free_money',
                label: 'Free Money',
                description: 'Paiement Free Money',
                icon: <Smartphone className="w-5 h-5 text-green-600" />,
                badgeColor: 'bg-green-100 text-green-700',
            },
            {
                id: 'wizall_sn',
                method: 'paytech',
                subMethod: 'wizall',
                label: 'Wizall Money',
                description: 'Porte-monnaie électronique Wizall',
                icon: <Wallet className="w-5 h-5 text-purple-600" />,
                badgeColor: 'bg-purple-100 text-purple-700',
            },
            {
                id: 'expresso_sn',
                method: 'paytech',
                subMethod: 'expresso',
                label: 'Expresso / Mixx',
                description: 'E-money Expresso',
                icon: <Smartphone className="w-5 h-5 text-red-500" />,
                badgeColor: 'bg-red-100 text-red-700',
            },
            { ...CARD_OPTION, id: 'card_sn', description: 'Visa, Mastercard' },
            { ...COD_OPTION, id: 'cod_sn' },
        ],
    },

    // 🇨🇮 Côte d'Ivoire
    CI: {
        title: 'Paiement pour la Côte d\'Ivoire',
        subtitle: 'Payez en Francs CFA (XOF)',
        flag: '🇨🇮',
        options: [
            {
                id: 'wave_ci',
                method: 'paytech',
                subMethod: 'wave',
                label: 'Wave',
                description: 'Paiement Wave CI',
                icon: <Wallet className="w-5 h-5 text-[#1DC1EC]" />,
                badge: 'Populaire',
                badgeColor: 'bg-[#1DC1EC]/10 text-[#1DC1EC]',
            },
            {
                id: 'orange_money_ci',
                method: 'paytech',
                subMethod: 'orange_money',
                label: 'Orange Money',
                description: 'Paiement Orange Money CI',
                icon: <Smartphone className="w-5 h-5 text-orange-500" />,
                badgeColor: 'bg-orange-100 text-orange-700',
            },
            {
                id: 'mtn_money_ci',
                method: 'paytech',
                subMethod: 'mtn_money',
                label: 'MTN Money',
                description: 'Paiement MTN Mobile Money',
                icon: <Smartphone className="w-5 h-5 text-yellow-500" />,
                badgeColor: 'bg-yellow-100 text-yellow-700',
            },
            {
                id: 'moov_money_ci',
                method: 'paytech',
                subMethod: 'moov_money',
                label: 'Moov Money',
                description: 'Paiement Moov Money',
                icon: <Smartphone className="w-5 h-5 text-blue-500" />,
                badgeColor: 'bg-blue-100 text-blue-700',
            },
            { ...CARD_OPTION, id: 'card_ci' },
            { ...COD_OPTION, id: 'cod_ci' },
        ],
    },

    // 🇲🇱 Mali
    ML: {
        title: 'Paiement pour le Mali',
        subtitle: 'Payez en Francs CFA (XOF)',
        flag: '🇲🇱',
        options: [
            {
                id: 'orange_money_ml',
                method: 'paytech',
                subMethod: 'orange_money',
                label: 'Orange Money',
                description: 'Paiement Orange Money Mali',
                icon: <Smartphone className="w-5 h-5 text-orange-500" />,
                badge: 'Populaire',
                badgeColor: 'bg-orange-100 text-orange-700',
            },
            {
                id: 'moov_money_ml',
                method: 'paytech',
                subMethod: 'moov_money',
                label: 'Moov Africa (Malitel)',
                description: 'Paiement Moov Africa',
                icon: <Smartphone className="w-5 h-5 text-blue-500" />,
                badgeColor: 'bg-blue-100 text-blue-700',
            },
            { ...CARD_OPTION, id: 'card_ml' },
            { ...COD_OPTION, id: 'cod_ml' },
        ],
    },

    // 🇧🇯 Bénin
    BJ: {
        title: 'Paiement pour le Bénin',
        subtitle: 'Payez en Francs CFA (XOF)',
        flag: '🇧🇯',
        options: [
            {
                id: 'mtn_money_bj',
                method: 'paytech',
                subMethod: 'mtn_money',
                label: 'MTN Money',
                description: 'Paiement MTN Mobile Money',
                icon: <Smartphone className="w-5 h-5 text-yellow-500" />,
                badge: 'Populaire',
                badgeColor: 'bg-yellow-100 text-yellow-700',
            },
            {
                id: 'moov_money_bj',
                method: 'paytech',
                subMethod: 'moov_money',
                label: 'Moov Money',
                description: 'Paiement Moov Money Bénin',
                icon: <Smartphone className="w-5 h-5 text-blue-500" />,
                badgeColor: 'bg-blue-100 text-blue-700',
            },
            { ...CARD_OPTION, id: 'card_bj' },
            { ...COD_OPTION, id: 'cod_bj' },
        ],
    },

    // 🇲🇦 Maroc - Cards only
    MA: {
        title: 'Paiement pour le Maroc',
        subtitle: 'Payez en Dirhams (MAD)',
        flag: '🇲🇦',
        options: [
            { ...CARD_OPTION, id: 'card_ma', description: 'Visa, Mastercard' },
            { ...COD_OPTION, id: 'cod_ma' },
        ],
    },

    // 🌍 International - Cards only
    OTHER: {
        title: 'Paiement International',
        subtitle: 'Payez par carte bancaire',
        flag: '🌍',
        options: [
            {
                ...CARD_OPTION,
                id: 'card_intl',
                label: 'Carte bancaire internationale',
                description: 'Visa, Mastercard',
                badge: 'International',
                badgeColor: 'bg-blue-100 text-blue-700',
            },
            { ...COD_OPTION, id: 'cod_intl', description: 'Selon disponibilité' },
        ],
    },
};

// Get country code from string
function getCountryCode(country: string): string {
    const code = country.toUpperCase();
    // Sénégal
    if (code === 'SN' || code === 'SENEGAL' || code === 'SÉNÉGAL') return 'SN';
    // Côte d'Ivoire
    if (code === 'CI' || code === "CÔTE D'IVOIRE" || code === "COTE D'IVOIRE" || code === 'IVORY COAST') return 'CI';
    // Mali
    if (code === 'ML' || code === 'MALI') return 'ML';
    // Bénin
    if (code === 'BJ' || code === 'BENIN' || code === 'BÉNIN') return 'BJ';
    // Maroc
    if (code === 'MA' || code === 'MAROC' || code === 'MOROCCO') return 'MA';
    // Autres pays
    return 'OTHER';
}

interface PaymentMethodsSelectorProps {
    country: string;
    selectedMethod: PaymentMethod | '';
    selectedSubMethod?: PaymentSubMethod;
    onMethodChange: (method: PaymentMethod, subMethod?: PaymentSubMethod) => void;
    disabled?: boolean;
}

export function PaymentMethodsSelector({
    country,
    selectedMethod,
    selectedSubMethod,
    onMethodChange,
    disabled = false,
}: PaymentMethodsSelectorProps) {
    const [config, setConfig] = useState(PAYMENT_OPTIONS.OTHER);

    // Update options when country changes
    useEffect(() => {
        const code = getCountryCode(country);
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
                <span className="text-2xl">{config.flag}</span>
            </div>

            {/* Country-specific info banner */}
            <div className="p-4 bg-gradient-to-r from-nubia-gold/10 to-nubia-gold/5 border border-nubia-gold/20 rounded-xl">
                <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-nubia-gold mt-0.5" />
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
                    Paiements sécurisés par PayTech
                </p>
                <div className="flex justify-center gap-4 mt-3 opacity-50">
                    <img src="/images/payments/visa.svg" alt="Visa" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
            </div>
        </div>
    );
}

export default PaymentMethodsSelector;
