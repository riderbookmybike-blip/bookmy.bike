'use client';

import React, { useState, useMemo } from 'react';
import { Logo } from '@/components/brand/Logo';
import { X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { useActiveColor } from '@/contexts/ColorContext';

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

export const MobileHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { activeColorHex } = useActiveColor();

    // Determine if we should use dark or light text based on background
    const isDarkBackground = useMemo(() => {
        const luminance = getLuminance(activeColorHex);
        return luminance < 0.5; // Threshold for light vs dark
    }, [activeColorHex]);

    const textColor = isDarkBackground ? 'text-white' : 'text-black';
    const logoMode = isDarkBackground ? 'dark' : 'light';

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[120] flex items-center justify-between px-5 py-4 bg-black/40 backdrop-blur-xl">
                {/* Full Logo on the Left */}
                <div className="flex-shrink-0">
                    <Logo className="h-6 w-auto" mode={logoMode} />
                </div>

                {/* Hamburger on the Right */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center justify-center active:scale-90 transition-all"
                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    <AnimatePresence mode="wait">
                        {isMenuOpen ? (
                            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                                <X size={24} className={textColor} />
                            </motion.div>
                        ) : (
                            <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                                <Menu size={24} className={textColor} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </header>

            {/* Menu Drawer */}
            <MobileMenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
};
