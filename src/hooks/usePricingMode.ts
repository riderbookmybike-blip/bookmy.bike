/**
 * usePricingMode — global EMI/Cash toggle
 *
 * Persists to localStorage and broadcasts via a 'pricingModeChanged' window
 * event so every mounted component (catalog, compare, home) stays in sync
 * without prop-drilling or a context provider.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export type PricingMode = 'cash' | 'finance';

const KEY = 'bmb_pricing_mode';
const EVENT = 'pricingModeChanged';

function readStored(): PricingMode {
    if (typeof window === 'undefined') return 'finance';
    try {
        const v = localStorage.getItem(KEY);
        return v === 'cash' ? 'cash' : 'finance';
    } catch {
        return 'finance';
    }
}

export function usePricingMode(): [PricingMode, (m: PricingMode) => void] {
    const [mode, setMode] = useState<PricingMode>(readStored);

    // Subscribe to changes from other components
    useEffect(() => {
        const onEvent = (e: Event) => {
            const detail = (e as CustomEvent<PricingMode>).detail;
            if (detail === 'cash' || detail === 'finance') setMode(detail);
        };
        window.addEventListener(EVENT, onEvent);
        // Sync on mount in case another tab/component already changed it
        setMode(readStored());
        return () => window.removeEventListener(EVENT, onEvent);
    }, []);

    const setPricingMode = useCallback((m: PricingMode) => {
        try {
            localStorage.setItem(KEY, m);
        } catch {
            /* ignore */
        }
        setMode(m);
        window.dispatchEvent(new CustomEvent<PricingMode>(EVENT, { detail: m }));
    }, []);

    return [mode, setPricingMode];
}
