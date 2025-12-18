'use client';

import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ThemeToggleProps {
    compact?: boolean;
    className?: string;
}

export function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
    const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (compact) {
        return (
            <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg hover:bg-nubia-gold/10 transition-colors ${className}`}
                aria-label={resolvedTheme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
                {resolvedTheme === 'dark' ? (
                    <Sun size={20} className="text-nubia-gold" />
                ) : (
                    <Moon size={20} className="text-nubia-black" />
                )}
            </button>
        );
    }

    return (
        <div ref={menuRef} className={`relative ${className}`}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-nubia-gold/10 transition-colors border border-nubia-gold/20"
                aria-label="Changer le thème"
                aria-expanded={showMenu}
            >
                {resolvedTheme === 'dark' ? (
                    <Moon size={18} className="text-nubia-gold" />
                ) : (
                    <Sun size={18} className="text-nubia-gold" />
                )}
                <span className="text-sm text-nubia-black dark:text-nubia-white">
                    {theme === 'system' ? 'Auto' : resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
                </span>
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-nubia-black border border-nubia-gold/20 rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                        onClick={() => { setTheme('light'); setShowMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-nubia-gold/10 transition-colors ${theme === 'light' ? 'bg-nubia-gold/10' : ''
                            }`}
                    >
                        <Sun size={16} className="text-nubia-gold" />
                        <span className="text-sm">Clair</span>
                    </button>
                    <button
                        onClick={() => { setTheme('dark'); setShowMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-nubia-gold/10 transition-colors ${theme === 'dark' ? 'bg-nubia-gold/10' : ''
                            }`}
                    >
                        <Moon size={16} className="text-nubia-gold" />
                        <span className="text-sm">Sombre</span>
                    </button>
                    <button
                        onClick={() => { setTheme('system'); setShowMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-nubia-gold/10 transition-colors ${theme === 'system' ? 'bg-nubia-gold/10' : ''
                            }`}
                    >
                        <Monitor size={16} className="text-nubia-gold" />
                        <span className="text-sm">Système</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ThemeToggle;
