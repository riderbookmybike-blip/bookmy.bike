'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
    isThemePreference,
    type ResolvedTheme,
    resolveThemePreference,
    THEME_STORAGE_KEY,
    type ThemePreference,
} from '@/lib/theme/themePreference';

interface ThemeContextType {
    theme: ThemePreference;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const getInitialTheme = (): ThemePreference => {
        if (typeof window === 'undefined') return 'system';
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
        return isThemePreference(saved) ? saved : 'system';
    };

    const getInitialResolvedTheme = (initialTheme: ThemePreference): ResolvedTheme => {
        if (typeof window === 'undefined') return 'light';
        return resolveThemePreference(initialTheme, window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    const initialTheme = getInitialTheme();
    const [theme, setThemeState] = useState<ThemePreference>(initialTheme);
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(getInitialResolvedTheme(initialTheme));
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [remoteLoaded, setRemoteLoaded] = useState(false);
    const lastPersistedThemeRef = useRef<ThemePreference | null>(null);
    const preferenceCacheRef = useRef<Record<string, unknown>>({});

    const setTheme = (nextTheme: ThemePreference) => {
        setThemeState(prevTheme => (prevTheme === nextTheme ? prevTheme : nextTheme));
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const root = window.document.documentElement;

        const applyTheme = () => {
            const nextResolvedTheme = resolveThemePreference(theme, mediaQuery.matches);
            setResolvedTheme(nextResolvedTheme);
            root.classList.remove('light');
            root.classList.remove('dark');
            root.classList.add(nextResolvedTheme);
            root.dataset.theme = theme;
            root.style.colorScheme = nextResolvedTheme;
        };

        applyTheme();
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);

        if (theme !== 'system') return;

        const handleSystemThemeChange = () => applyTheme();
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, [theme]);

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        const syncThemeFromUser = async (user: User | null) => {
            if (cancelled) return;

            if (!user) {
                setCurrentUserId(null);
                preferenceCacheRef.current = {};
                lastPersistedThemeRef.current = null;
                setRemoteLoaded(true);
                return;
            }

            setRemoteLoaded(false);
            setCurrentUserId(user.id);

            let mergedPreferenceTheme: ThemePreference | null = isThemePreference(user.user_metadata?.theme_preference)
                ? user.user_metadata.theme_preference
                : null;
            let preferenceCache: Record<string, unknown> = {};

            const { data, error } = await supabase
                .from('id_members')
                .select('preferences')
                .eq('id', user.id)
                .maybeSingle();

            if (!error) {
                const rawPreferences = (data as any)?.preferences;
                if (rawPreferences && typeof rawPreferences === 'object' && !Array.isArray(rawPreferences)) {
                    preferenceCache = rawPreferences as Record<string, unknown>;
                    if (isThemePreference(preferenceCache.theme)) {
                        mergedPreferenceTheme = preferenceCache.theme;
                    }
                }
            } else if (!(error.message || '').toLowerCase().includes('preferences')) {
                console.warn('[ThemeProvider] Failed to fetch member theme preference:', error.message);
            }

            if (cancelled) return;

            preferenceCacheRef.current = preferenceCache;

            if (mergedPreferenceTheme) {
                lastPersistedThemeRef.current = mergedPreferenceTheme;
                setThemeState(prev => (prev === mergedPreferenceTheme ? prev : mergedPreferenceTheme));
            } else {
                lastPersistedThemeRef.current = null;
            }

            setRemoteLoaded(true);
        };

        supabase.auth.getUser().then(({ data }) => {
            syncThemeFromUser(data.user ?? null);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            syncThemeFromUser(session?.user ?? null);
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!remoteLoaded || !currentUserId) return;
        if (lastPersistedThemeRef.current === theme) return;

        const supabase = createClient();
        const mergedPreferences = { ...preferenceCacheRef.current, theme };
        preferenceCacheRef.current = mergedPreferences;
        lastPersistedThemeRef.current = theme;

        const persistTheme = async () => {
            const [{ error: memberError }, { error: authError }] = await Promise.all([
                supabase
                    .from('id_members')
                    .update({ preferences: mergedPreferences } as any)
                    .eq('id', currentUserId),
                supabase.auth.updateUser({
                    data: {
                        theme_preference: theme,
                    },
                }),
            ]);

            if (memberError && !(memberError.message || '').toLowerCase().includes('preferences')) {
                console.warn('[ThemeProvider] Failed to persist member theme preference:', memberError.message);
            }

            if (authError) {
                console.warn('[ThemeProvider] Failed to persist auth theme preference:', authError.message);
            }
        };

        persistTheme();
    }, [theme, currentUserId, remoteLoaded]);

    return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Allow server render fallback to avoid SSR crash in isolated routes (e.g. public dossier)
        if (typeof window === 'undefined') {
            return {
                theme: 'light' as const,
                resolvedTheme: 'light' as const,
                setTheme: (_theme: ThemePreference) => {},
            };
        }
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
