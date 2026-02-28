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
}

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

export const DiscoveryProvider = ({ children }: { children: ReactNode }) => {
    const searchParams = useSearchParams();
    const [resultsCount, setResultsCount] = useState<number | null>(null);
    const [pricingMode, setPricingMode] = useState<PricingMode>('finance');

    // Sync initial state from URL/LocalStorage
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'cash' || mode === 'finance') {
            setPricingMode(mode);
        } else {
            const stored = localStorage.getItem('bkmb_pricing_mode');
            if (stored === 'cash' || stored === 'finance') {
                setPricingMode(stored as PricingMode);
            }
        }
    }, [searchParams]);

    // Persist pricing mode changes
    useEffect(() => {
        localStorage.setItem('bkmb_pricing_mode', pricingMode);
    }, [pricingMode]);

    const [locationLabel, setLocationLabel] = useState<string | null>(null);
    const [showDiscoveryBar, setShowDiscoveryBar] = useState(false);

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
