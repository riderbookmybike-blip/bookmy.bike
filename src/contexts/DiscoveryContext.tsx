'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type PricingMode = 'cash' | 'finance';

interface DiscoveryContextType {
    resultsCount: number | null;
    setResultsCount: (count: number | null) => void;
    pricingMode: PricingMode;
    setPricingMode: React.Dispatch<React.SetStateAction<PricingMode>>;
    locationLabel: string | null;
    setLocationLabel: (label: string | null) => void;
    showDiscoveryBar: boolean;
    setShowDiscoveryBar: (show: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

export const DiscoveryProvider = ({ children }: { children: ReactNode }) => {
    const searchParams = useSearchParams();
    const [resultsCount, setResultsCount] = useState<number | null>(null);

    // Always start with 'finance' to match SSR output, then correct from localStorage on the client.
    // A lazy useState initializer also runs on the server where localStorage is undefined,
    // causing a hydration mismatch when the client resolves a stored 'cash' value.
    const [pricingMode, setPricingMode] = useState<PricingMode>('finance');

    // On mount (client only): read saved preference and apply it
    useEffect(() => {
        const stored = localStorage.getItem('bkmb_pricing_mode');
        if (stored === 'cash' || stored === 'finance') {
            setPricingMode(stored);
        }
    }, []); // ← runs once on mount only, no searchParams dependency

    // Persist pricing mode changes to localStorage
    useEffect(() => {
        localStorage.setItem('bkmb_pricing_mode', pricingMode);
    }, [pricingMode]);

    const [locationLabel, setLocationLabel] = useState<string | null>(null);
    const [showDiscoveryBar, setShowDiscoveryBar] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    return (
        <DiscoveryContext.Provider
            value={{
                resultsCount,
                setResultsCount,
                pricingMode,
                setPricingMode,
                locationLabel,
                setLocationLabel,
                showDiscoveryBar,
                setShowDiscoveryBar,
                searchQuery,
                setSearchQuery,
            }}
        >
            {children}
        </DiscoveryContext.Provider>
    );
};

export const useDiscovery = () => {
    const context = useContext(DiscoveryContext);
    if (context === undefined) {
        throw new Error('useDiscovery must be used within a DiscoveryProvider');
    }
    return context;
};
