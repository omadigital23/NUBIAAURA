/**
 * Payment Methods Selector Component
 * 
 * Displays available payment methods based on country:
 * - Morocco: Chaabi Payment (cards), COD
 * - Senegal: PayTech (Wave, Orange Money, Free Money), COD
 * - International: PayTech (Cards), COD
 */

'use client';

import { useEffect, useState } from 'react';
import { Lock, CreditCard, Smartphone, Truck } from 'lucide-react';

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
const PAYMENT_OPTIONS: Record<string, PaymentOption[]> = {
    MA: [
        {
            id: 'chaabi',
            method: 'chaabi',
            label: 'Carte bancaire',
            description: 'Visa, Mastercard via Chaabi Payment',
            icon: <CreditCard className="w-5 h-5" />,
        },
        {
            id: 'cod',
            method: 'cod',
            label: 'Paiement à la livraison',
            description: 'Payez en espèces à la réception',
            icon: <Truck className="w-5 h-5" />,
        },
    ],
    SN: [
        {
            id: 'wave',
            method: 'paytech',
            subMethod: 'wave',
            label: 'Wave',
            description: 'Payez avec votre compte Wave',
            icon: <Smartphone className="w-5 h-5 text-blue-500" />,
        },
        {
            id: 'orange_money',
            method: 'paytech',
            subMethod: 'orange_money',
            label: 'Orange Money',
            description: 'Payez avec Orange Money',
            icon: <Smartphone className="w-5 h-5 text-orange-500" />,
        },
        {
            id: 'free_money',
            method: 'paytech',
            subMethod: 'free_money',
            label: 'Free Money',
            description: 'Payez avec Free Money',
            icon: <Smartphone className="w-5 h-5 text-green-500" />,
        },
        {
            id: 'cod',
            method: 'cod',
            label: 'Paiement à la livraison',
            description: 'Payez en espèces à la réception',
            icon: <Truck className="w-5 h-5" />,
        },
    ],
    OTHER: [
        {
            id: 'paytech_card',
            method: 'paytech',
            subMethod: 'card',
            label: 'Carte bancaire internationale',
            description: 'Visa, Mastercard, Amex',
            icon: <CreditCard className="w-5 h-5" />,
        },
        {
            id: 'cod',
            method: 'cod',
            label: 'Paiement à la livraison',
            description: 'Payez en espèces à la réception',
            icon: <Truck className="w-5 h-5" />,
        },
    ],
};

// Get country code from string
function getCountryCode(country: string): string {
    const code = country.toUpperCase();
    if (code === 'MA' || code === 'MAROC' || code === 'MOROCCO') return 'MA';
    if (code === 'SN' || code === 'SENEGAL' || code === 'SÉNÉGAL') return 'SN';
    return 'OTHER';
}

export function PaymentMethodsSelector({
    country,
    selectedMethod,
    selectedSubMethod,
    onMethodChange,
    disabled = false,
    locale = 'fr',
}: PaymentMethodsSelectorProps) {
    const [options, setOptions] = useState<PaymentOption[]>([]);

    // Update options when country changes
    useEffect(() => {
        const countryCode = getCountryCode(country);
        setOptions(PAYMENT_OPTIONS[countryCode] || PAYMENT_OPTIONS.OTHER);
    }, [country]);

    // Translations
    const t = {
        title: locale === 'fr' ? 'Mode de paiement' : 'Payment Method',
        secured: locale === 'fr' ? 'Paiement 100% sécurisé' : '100% Secure Payment',
        selectPayment: locale === 'fr' ? 'Sélectionnez un mode de paiement' : 'Select a payment method',
    };

    // Handle option selection
    const handleSelect = (option: PaymentOption) => {
        if (disabled) return;
        onMethodChange(option.method, option.subMethod);
    };

    // Check if option is selected
    const isSelected = (option: PaymentOption) => {
        if (option.method !== selectedMethod) return false;
        if (option.subMethod && option.subMethod !== selectedSubMethod) return false;
        return true;
    };

    return (
        <div className="space-y-4">
            <h3 className="font-playfair text-xl font-bold text-nubia-black">
                {t.title}
            </h3>

            {/* Security badge */}
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Lock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">{t.secured}</span>
            </div>

            {/* Payment options */}
            <div className="space-y-3">
                {options.map((option) => (
                    <label
                        key={option.id}
                        className={`
              flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-nubia-gold hover:bg-nubia-gold/5'}
              ${isSelected(option) ? 'border-nubia-gold bg-nubia-gold/10' : 'border-gray-200'}
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
              w-10 h-10 rounded-full flex items-center justify-center
              ${isSelected(option) ? 'bg-nubia-gold text-white' : 'bg-gray-100 text-gray-600'}
            `}>
                            {option.icon}
                        </div>

                        {/* Label and description */}
                        <div className="flex-1">
                            <p className="font-semibold text-nubia-black">{option.label}</p>
                            <p className="text-sm text-gray-500">{option.description}</p>
                        </div>

                        {/* Checkmark */}
                        {isSelected(option) && (
                            <div className="w-6 h-6 rounded-full bg-nubia-gold flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </label>
                ))}
            </div>

            {/* Validation message */}
            {!selectedMethod && (
                <p className="text-sm text-amber-600">
                    ⚠️ {t.selectPayment}
                </p>
            )}
        </div>
    );
}

export default PaymentMethodsSelector;
