'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TRANSLATION_LANGUAGES, TranslationLanguage } from '@/i18n/languages';

const STORAGE_KEY = 'bmb_lang';

export type TranslationMap = Record<string, string>;

interface I18nContextValue {
    language: string;
    setLanguage: (language: string) => void;
    t: (text: string) => string;
    scriptText: (text: string, type: 'brand' | 'model' | 'variant' | 'color') => string;
    isLoading: boolean;
    languages: TranslationLanguage[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const normalizeLang = (value: string) => value.toLowerCase().split('-')[0];

const detectInitialLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;

    const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
    const normalized = browserLanguages.map(lang => normalizeLang(lang));

    const supported = TRANSLATION_LANGUAGES.map(lang => lang.code);
    const match = normalized.find(lang => supported.includes(lang));
    return match || 'en';
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState('en');
    const [translations, setTranslations] = useState<TranslationMap>({});
    const [isLoading, setIsLoading] = useState(false);
    const [termOverrides, setTermOverrides] = useState<Record<'brand' | 'model' | 'variant' | 'color', Record<string, string>>>({
        brand: {},
        model: {},
        variant: {},
        color: {},
    });

    useEffect(() => {
        const initial = detectInitialLanguage();
        setLanguageState(initial);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_KEY, language);
    }, [language]);

    useEffect(() => {
        if (language === 'en') {
            setTranslations({});
            return;
        }

        let isActive = true;
        setIsLoading(true);
        fetch(`/api/i18n/marketplace?lang=${encodeURIComponent(language)}`)
            .then(res => res.json())
            .then(data => {
                if (!isActive) return;
                setTranslations(data?.translations || {});
            })
            .catch(() => {
                if (!isActive) return;
                setTranslations({});
            })
            .finally(() => {
                if (!isActive) return;
                setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [language]);

    useEffect(() => {
        if (language === 'en') {
            setTermOverrides({ brand: {}, model: {}, variant: {}, color: {} });
            return;
        }

        let isActive = true;
        fetch(`/api/i18n/terms?lang=${encodeURIComponent(language)}`)
            .then(res => res.json())
            .then(data => {
                if (!isActive) return;
                const overrides = data?.overrides || [];
                const next: Record<'brand' | 'model' | 'variant' | 'color', Record<string, string>> = {
                    brand: {},
                    model: {},
                    variant: {},
                    color: {},
                };
                overrides.forEach((row: { term_type: string; source_text: string; translated_text: string }) => {
                    const type = row.term_type as 'brand' | 'model' | 'variant' | 'color';
                    if (!next[type]) return;
                    const key = row.source_text?.toLowerCase().trim();
                    if (key) next[type][key] = row.translated_text;
                });
                setTermOverrides(next);
            })
            .catch(() => {
                if (!isActive) return;
                setTermOverrides({ brand: {}, model: {}, variant: {}, color: {} });
            });

        return () => {
            isActive = false;
        };
    }, [language]);

    const setLanguage = (next: string) => {
        setLanguageState(next);
    };

    const t = useMemo(() => {
        return (text: string) => {
            if (!text) return text;
            return translations[text] || text;
        };
    }, [translations]);

    const scriptText = useMemo(() => {
        return (text: string, type: 'brand' | 'model' | 'variant' | 'color') => {
            if (!text || language === 'en') return text;
            const key = text.toLowerCase().trim();
            const override = termOverrides?.[type]?.[key];
            return override || text;
        };
    }, [termOverrides, language]);

    const value = useMemo(
        () => ({
            language,
            setLanguage,
            t,
            scriptText,
            isLoading,
            languages: TRANSLATION_LANGUAGES,
        }),
        [language, t, scriptText, isLoading]
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used within I18nProvider');
    return ctx;
};
