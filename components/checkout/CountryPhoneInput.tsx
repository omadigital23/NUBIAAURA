/**
 * Country and Phone Input Components
 * 
 * Features:
 * - Comprehensive list of countries with flags
 * - Auto-fill phone country code when country is selected
 * - Phone number placeholder with format example
 * - Support for all countries that can use the payment system
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Phone, Globe, Search } from 'lucide-react';

// Country data with phone codes and formats
export interface CountryData {
    code: string;
    name: string;
    flag: string;
    phoneCode: string;
    phoneFormat: string;
    phonePlaceholder: string;
    paymentGateway: 'chaabi' | 'paytech' | 'paytech_intl';
    currency: string;
}

// Comprehensive list of countries
export const COUNTRIES: CountryData[] = [
    // Africa - Primary markets
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', phoneCode: '+221', phoneFormat: '77 XXX XX XX', phonePlaceholder: '77 123 45 67', paymentGateway: 'paytech', currency: 'XOF' },
    { code: 'MA', name: 'Maroc', flag: '🇲🇦', phoneCode: '+212', phoneFormat: '6XX XX XX XX', phonePlaceholder: '612 34 56 78', paymentGateway: 'chaabi', currency: 'MAD' },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', phoneCode: '+225', phoneFormat: '07 XX XX XX XX', phonePlaceholder: '07 12 34 56 78', paymentGateway: 'paytech', currency: 'XOF' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', phoneCode: '+223', phoneFormat: '7X XX XX XX', phonePlaceholder: '76 12 34 56', paymentGateway: 'paytech', currency: 'XOF' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', phoneCode: '+226', phoneFormat: '7X XX XX XX', phonePlaceholder: '70 12 34 56', paymentGateway: 'paytech', currency: 'XOF' },
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯', phoneCode: '+229', phoneFormat: '9X XX XX XX', phonePlaceholder: '97 12 34 56', paymentGateway: 'paytech', currency: 'XOF' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', phoneCode: '+228', phoneFormat: '9X XX XX XX', phonePlaceholder: '90 12 34 56', paymentGateway: 'paytech', currency: 'XOF' },
    { code: 'NE', name: 'Niger', flag: '🇳🇪', phoneCode: '+227', phoneFormat: '9X XX XX XX', phonePlaceholder: '96 12 34 56', paymentGateway: 'paytech', currency: 'XOF' },
    { code: 'GN', name: 'Guinée', flag: '🇬🇳', phoneCode: '+224', phoneFormat: '6XX XX XX XX', phonePlaceholder: '621 12 34 56', paymentGateway: 'paytech', currency: 'GNF' },
    { code: 'CM', name: 'Cameroun', flag: '🇨🇲', phoneCode: '+237', phoneFormat: '6 XX XX XX XX', phonePlaceholder: '6 77 12 34 56', paymentGateway: 'paytech', currency: 'XAF' },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦', phoneCode: '+241', phoneFormat: '0X XX XX XX', phonePlaceholder: '07 12 34 56', paymentGateway: 'paytech', currency: 'XAF' },
    { code: 'CG', name: 'Congo', flag: '🇨🇬', phoneCode: '+242', phoneFormat: '0X XXX XX XX', phonePlaceholder: '06 123 45 67', paymentGateway: 'paytech', currency: 'XAF' },
    { code: 'CD', name: 'RD Congo', flag: '🇨🇩', phoneCode: '+243', phoneFormat: '9XX XXX XXX', phonePlaceholder: '997 123 456', paymentGateway: 'paytech', currency: 'CDF' },
    { code: 'MR', name: 'Mauritanie', flag: '🇲🇷', phoneCode: '+222', phoneFormat: 'XX XX XX XX', phonePlaceholder: '22 12 34 56', paymentGateway: 'paytech', currency: 'MRU' },
    { code: 'DZ', name: 'Algérie', flag: '🇩🇿', phoneCode: '+213', phoneFormat: '5XX XX XX XX', phonePlaceholder: '551 23 45 67', paymentGateway: 'paytech_intl', currency: 'DZD' },
    { code: 'TN', name: 'Tunisie', flag: '🇹🇳', phoneCode: '+216', phoneFormat: 'XX XXX XXX', phonePlaceholder: '20 123 456', paymentGateway: 'paytech_intl', currency: 'TND' },
    { code: 'EG', name: 'Égypte', flag: '🇪🇬', phoneCode: '+20', phoneFormat: '1XX XXX XXXX', phonePlaceholder: '100 123 4567', paymentGateway: 'paytech_intl', currency: 'EGP' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', phoneCode: '+234', phoneFormat: '8XX XXX XXXX', phonePlaceholder: '803 123 4567', paymentGateway: 'paytech_intl', currency: 'NGN' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', phoneCode: '+233', phoneFormat: '2X XXX XXXX', phonePlaceholder: '24 123 4567', paymentGateway: 'paytech_intl', currency: 'GHS' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', phoneCode: '+254', phoneFormat: '7XX XXX XXX', phonePlaceholder: '712 345 678', paymentGateway: 'paytech_intl', currency: 'KES' },
    { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦', phoneCode: '+27', phoneFormat: '7X XXX XXXX', phonePlaceholder: '71 234 5678', paymentGateway: 'paytech_intl', currency: 'ZAR' },

    // Europe
    { code: 'FR', name: 'France', flag: '🇫🇷', phoneCode: '+33', phoneFormat: '6 XX XX XX XX', phonePlaceholder: '6 12 34 56 78', paymentGateway: 'paytech_intl', currency: 'EUR' },
    { code: 'BE', name: 'Belgique', flag: '🇧🇪', phoneCode: '+32', phoneFormat: '4XX XX XX XX', phonePlaceholder: '470 12 34 56', paymentGateway: 'paytech_intl', currency: 'EUR' },
    { code: 'CH', name: 'Suisse', flag: '🇨🇭', phoneCode: '+41', phoneFormat: '7X XXX XX XX', phonePlaceholder: '79 123 45 67', paymentGateway: 'paytech_intl', currency: 'CHF' },
    { code: 'DE', name: 'Allemagne', flag: '🇩🇪', phoneCode: '+49', phoneFormat: '1XX XXXXXXX', phonePlaceholder: '151 1234567', paymentGateway: 'paytech_intl', currency: 'EUR' },
    { code: 'ES', name: 'Espagne', flag: '🇪🇸', phoneCode: '+34', phoneFormat: '6XX XXX XXX', phonePlaceholder: '612 345 678', paymentGateway: 'paytech_intl', currency: 'EUR' },
    { code: 'IT', name: 'Italie', flag: '🇮🇹', phoneCode: '+39', phoneFormat: '3XX XXX XXXX', phonePlaceholder: '312 345 6789', paymentGateway: 'paytech_intl', currency: 'EUR' },
    { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', phoneCode: '+44', phoneFormat: '7XXX XXXXXX', phonePlaceholder: '7911 123456', paymentGateway: 'paytech_intl', currency: 'GBP' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', phoneCode: '+351', phoneFormat: '9XX XXX XXX', phonePlaceholder: '912 345 678', paymentGateway: 'paytech_intl', currency: 'EUR' },
    { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱', phoneCode: '+31', phoneFormat: '6 XXXXXXXX', phonePlaceholder: '6 12345678', paymentGateway: 'paytech_intl', currency: 'EUR' },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', phoneCode: '+352', phoneFormat: '6XX XXX XXX', phonePlaceholder: '621 123 456', paymentGateway: 'paytech_intl', currency: 'EUR' },

    // Americas
    { code: 'US', name: 'États-Unis', flag: '🇺🇸', phoneCode: '+1', phoneFormat: '(XXX) XXX-XXXX', phonePlaceholder: '(555) 123-4567', paymentGateway: 'paytech_intl', currency: 'USD' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', phoneCode: '+1', phoneFormat: '(XXX) XXX-XXXX', phonePlaceholder: '(514) 123-4567', paymentGateway: 'paytech_intl', currency: 'CAD' },
    { code: 'BR', name: 'Brésil', flag: '🇧🇷', phoneCode: '+55', phoneFormat: '(XX) XXXXX-XXXX', phonePlaceholder: '(11) 98765-4321', paymentGateway: 'paytech_intl', currency: 'BRL' },

    // Middle East
    { code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪', phoneCode: '+971', phoneFormat: '5X XXX XXXX', phonePlaceholder: '50 123 4567', paymentGateway: 'paytech_intl', currency: 'AED' },
    { code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦', phoneCode: '+966', phoneFormat: '5X XXX XXXX', phonePlaceholder: '50 123 4567', paymentGateway: 'paytech_intl', currency: 'SAR' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', phoneCode: '+974', phoneFormat: 'XXXX XXXX', phonePlaceholder: '5512 3456', paymentGateway: 'paytech_intl', currency: 'QAR' },

    // Asia
    { code: 'CN', name: 'Chine', flag: '🇨🇳', phoneCode: '+86', phoneFormat: '1XX XXXX XXXX', phonePlaceholder: '138 1234 5678', paymentGateway: 'paytech_intl', currency: 'CNY' },
    { code: 'JP', name: 'Japon', flag: '🇯🇵', phoneCode: '+81', phoneFormat: '90-XXXX-XXXX', phonePlaceholder: '90-1234-5678', paymentGateway: 'paytech_intl', currency: 'JPY' },
    { code: 'IN', name: 'Inde', flag: '🇮🇳', phoneCode: '+91', phoneFormat: 'XXXXX XXXXX', phonePlaceholder: '98765 43210', paymentGateway: 'paytech_intl', currency: 'INR' },

    // Oceania
    { code: 'AU', name: 'Australie', flag: '🇦🇺', phoneCode: '+61', phoneFormat: '4XX XXX XXX', phonePlaceholder: '412 345 678', paymentGateway: 'paytech_intl', currency: 'AUD' },
];

// Get country by code
export function getCountryByCode(code: string): CountryData | undefined {
    return COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

// Props for CountrySelect
interface CountrySelectProps {
    value: string;
    onChange: (country: CountryData) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

// Country Select Component with Search
export function CountrySelect({
    value,
    onChange,
    label,
    placeholder = 'Sélectionnez un pays',
    className = '',
    disabled = false,
}: CountrySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedCountry = useMemo(() => getCountryByCode(value), [value]);

    const filteredCountries = useMemo(() => {
        if (!search) return COUNTRIES;
        const searchLower = search.toLowerCase();
        return COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(searchLower) ||
            c.code.toLowerCase().includes(searchLower) ||
            c.phoneCode.includes(search)
        );
    }, [search]);

    const handleSelect = (country: CountryData) => {
        onChange(country);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}

            {/* Selected value button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full flex items-center justify-between px-4 py-3 
          border border-nubia-gold/30 rounded-lg bg-white
          focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20
          transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-nubia-gold/50 cursor-pointer'}
        `}
            >
                {selectedCountry ? (
                    <span className="flex items-center gap-3">
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-nubia-black">{selectedCountry.name}</span>
                        <span className="text-gray-400 text-sm">({selectedCountry.phoneCode})</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-2 text-gray-400">
                        <Globe className="w-5 h-5" />
                        {placeholder}
                    </span>
                )}
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-nubia-gold/30 rounded-lg shadow-xl max-h-80 overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher un pays..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-nubia-gold"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Country list */}
                    <div className="overflow-y-auto max-h-60">
                        {filteredCountries.length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 text-center">Aucun pays trouvé</div>
                        ) : (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleSelect(country)}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left
                    hover:bg-nubia-gold/10 transition-colors
                    ${value === country.code ? 'bg-nubia-gold/20' : ''}
                  `}
                                >
                                    <span className="text-xl">{country.flag}</span>
                                    <span className="flex-1 text-nubia-black">{country.name}</span>
                                    <span className="text-gray-400 text-sm">{country.phoneCode}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

// Props for PhoneInput
interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    countryCode: string;
    label?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
}

// Phone Input with Country Code
export function PhoneInput({
    value,
    onChange,
    countryCode,
    label,
    className = '',
    disabled = false,
    required = false,
}: PhoneInputProps) {
    const country = useMemo(() => getCountryByCode(countryCode), [countryCode]);

    // Extract phone number without country code
    const phoneNumber = useMemo(() => {
        if (!value) return '';
        if (!country) return value;
        // Remove country code if present
        if (value.startsWith(country.phoneCode)) {
            return value.slice(country.phoneCode.length).trim();
        }
        return value;
    }, [value, country]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/[^\d\s\-]/g, '');
        if (country) {
            onChange(`${country.phoneCode} ${newValue}`);
        } else {
            onChange(newValue);
        }
    };

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}

            <div className="flex">
                {/* Country code (read-only) */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-r-0 border-nubia-gold/30 rounded-l-lg min-w-[100px]">
                    {country ? (
                        <>
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-gray-600 font-medium">{country.phoneCode}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">
                            <Phone className="w-5 h-5" />
                        </span>
                    )}
                </div>

                {/* Phone number input */}
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handleChange}
                    placeholder={country?.phonePlaceholder || 'Numéro de téléphone'}
                    disabled={disabled || !country}
                    required={required}
                    className={`
            flex-1 px-4 py-3 border border-nubia-gold/30 rounded-r-lg
            focus:outline-none focus:border-nubia-gold focus:ring-2 focus:ring-nubia-gold/20
            ${disabled || !country ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          `}
                />
            </div>

            {/* Format hint */}
            {country && (
                <p className="mt-1 text-xs text-gray-400">
                    Format: {country.phoneFormat}
                </p>
            )}
        </div>
    );
}

// Combined export
export default { CountrySelect, PhoneInput, COUNTRIES, getCountryByCode };
