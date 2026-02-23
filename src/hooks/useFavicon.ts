'use client';

import { useEffect } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

/**
 * useFavicon - Dynamic Favicon Hook
 *
 * Changes the browser favicon when theme changes.
 * Part of the AUMS Design System.
 *
 * @example
 * // In your layout or app component:
 * useFavicon();
 */
export function useFavicon() {
    const { theme } = useTheme();

    useEffect(() => {
        const faviconPath = '/favicons/favicon-light.png';

        // Update or create favicon link element
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = faviconPath;

        // Also update apple-touch-icon if present
        const appleTouchIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
        if (appleTouchIcon) {
            appleTouchIcon.href = '/favicons/apple-touch-icon-light.png';
        }
    }, [theme]);
}

/**
 * FaviconProvider - Component wrapper for useFavicon
 *
 * Use this in your layout if you prefer component syntax.
 *
 * @example
 * <FaviconProvider />
 */
export function FaviconProvider() {
    useFavicon();
    return null;
}
