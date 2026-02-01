'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Sun, Moon, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneMenuDrawer } from './PhoneMenuDrawer';
import { useActiveColor } from '@/contexts/ColorContext';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useI18n } from '@/components/providers/I18nProvider';
import { usePathname } from 'next/navigation';

// Calculate luminance to determine if color is light or dark
const getLuminance = (hex: string): number => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    // Calculate relative luminance (WCAG formula)
    const a = [r, g, b].map(v => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const PhoneHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const languageMenuRef = useRef<HTMLDivElement | null>(null);
    const [mounted, setMounted] = React.useState(false);
    const { activeColorHex } = useActiveColor();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, languages, t } = useI18n();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (!isLanguageMenuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (!languageMenuRef.current?.contains(event.target as Node)) {
                setIsLanguageMenuOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsLanguageMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isLanguageMenuOpen]);

    // Determine if we should use dark or light text based on background
    // If not mounted, default to a safe value (usually dark for matching SSR white/black variants if possible, 
    // but here we just need consistency. Let's assume server renders 'light' for system)
    const isDarkTheme = mounted && (theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    const pathname = usePathname();
    const isHeroHome = pathname === '/phone';
    // On hero home: always white icons. Elsewhere: theme-aware
    const logoMode = isHeroHome ? 'dark' : (isDarkTheme ? 'dark' : 'light');
    const iconClass = isHeroHome ? 'text-white' : 'text-slate-700 dark:text-white';

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-[120] flex items-center justify-between px-5 py-4 backdrop-blur-xl transition-all duration-500 ${isHeroHome ? 'bg-black/40 border-b border-white/10' : 'bg-black/5 dark:bg-black/60 border-b border-slate-200/60 dark:border-white/10'}`}>
                {/* Full Logo on the Left */}
                <div className="flex-shrink-0">
                    <Logo className="h-6 w-auto" mode={logoMode} />
                </div>

                <div className="flex items-center gap-4">
                    {/* Language Toggle */}
                    <div className="relative" ref={languageMenuRef}>
                        <button
                            onClick={() => setIsLanguageMenuOpen(prev => !prev)}
                            className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all"
                            aria-label={t('Language')}
                            aria-haspopup="listbox"
                            aria-expanded={isLanguageMenuOpen}
                        >
                            <Languages size={20} className={iconClass} />
                        </button>
                        <AnimatePresence>
                            {isLanguageMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                    className="absolute right-0 mt-3 w-48 rounded-2xl bg-black/90 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-2 z-[200] backdrop-blur-xl"
                                >
                                    <div className="px-2 pt-2 pb-3 border-b border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                                            {t('Language')}
                                        </p>
                                        <p className="text-[10px] font-bold text-white/70 mt-1">
                                            {language.toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="py-2 space-y-1">
                                        {languages.map(lang => {
                                            const isActiveLang = language === lang.code;
                                            const isDisabled = lang.status !== 'ACTIVE';
                                            return (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => {
                                                        if (isDisabled) return;
                                                        setLanguage(lang.code);
                                                        setIsLanguageMenuOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${isActiveLang
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/80'
                                                        } ${isDisabled
                                                            ? 'opacity-40 cursor-not-allowed'
                                                            : 'hover:bg-white/5'
                                                        }`}
                                                >
                                                    <span className="text-sm font-bold">{lang.nativeName}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                                                        {lang.code.toUpperCase()}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all"
                        aria-label="Toggle theme"
                    >
                        <AnimatePresence mode="wait">
                            {isDarkTheme ? (
                                <motion.div key="sun" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                    <Sun size={20} className={iconClass} />
                                </motion.div>
                            ) : (
                                <motion.div key="moon" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                    <Moon size={20} className={iconClass} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </header>

            {/* Menu Drawer */}
            <PhoneMenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
};
