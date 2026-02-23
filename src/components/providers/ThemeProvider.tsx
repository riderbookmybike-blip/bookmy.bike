'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { THEME_STORAGE_KEY, type ResolvedTheme, type ThemePreference } from '@/lib/theme/themePreference';

interface ThemeContextType {
    theme: ThemePreference;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: ThemePreference) => void;
}

const LIGHT_THEME: ThemePreference = 'light';
const LIGHT_RESOLVED_THEME: ResolvedTheme = 'light';
const NOOP_SET_THEME = (_theme: ThemePreference) => {};

const fallbackThemeContext: ThemeContextType = {
    theme: LIGHT_THEME,
    resolvedTheme: LIGHT_RESOLVED_THEME,
    setTheme: NOOP_SET_THEME,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = window.document.documentElement;
        root.classList.remove('dark');
        root.classList.add('light');
        root.dataset.theme = LIGHT_THEME;
        root.style.colorScheme = LIGHT_RESOLVED_THEME;
        window.localStorage.setItem(THEME_STORAGE_KEY, LIGHT_THEME);
    }, []);

    return <ThemeContext.Provider value={fallbackThemeContext}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    return context || fallbackThemeContext;
};
