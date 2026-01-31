'use client';

import React, { useState, useMemo } from 'react';
import { Logo } from '@/components/brand/Logo';
import { X, Menu, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneMenuDrawer } from './PhoneMenuDrawer';
import { useActiveColor } from '@/contexts/ColorContext';
import { useTheme } from '@/components/providers/ThemeProvider';

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
    const [mounted, setMounted] = React.useState(false);
    const { activeColorHex } = useActiveColor();
    const { theme, setTheme } = useTheme();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Determine if we should use dark or light text based on background
    // If not mounted, default to a safe value (usually dark for matching SSR white/black variants if possible, 
    // but here we just need consistency. Let's assume server renders 'light' for system)
    const isDarkTheme = mounted && (theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    const logoMode = isDarkTheme ? 'dark' : 'light';

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[120] flex items-center justify-between px-5 py-4 bg-white/70 dark:bg-black/40 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 transition-colors duration-500">
                {/* Full Logo on the Left */}
                <div className="flex-shrink-0">
                    <Logo className="h-6 w-auto" mode={logoMode} />
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full active:scale-90 transition-all border border-slate-200 dark:border-white/10"
                        aria-label="Toggle theme"
                    >
                        <AnimatePresence mode="wait">
                            {isDarkTheme ? (
                                <motion.div key="sun" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                    <Sun size={20} className="text-white" />
                                </motion.div>
                            ) : (
                                <motion.div key="moon" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                    <Moon size={20} className="text-slate-900" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>

                    {/* Hamburger on the Right */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full active:scale-90 transition-all border border-slate-200 dark:border-white/10"
                        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        <AnimatePresence mode="wait">
                            {isMenuOpen ? (
                                <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                                    <X size={24} className="text-slate-900 dark:text-white" />
                                </motion.div>
                            ) : (
                                <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                                    <Menu size={24} className="text-slate-900 dark:text-white" />
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
