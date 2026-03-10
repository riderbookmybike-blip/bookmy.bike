'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

type PricingMode = 'cash' | 'finance';
type OfferMode = 'BEST_OFFER' | 'FAST_DELIVERY';

interface DiscoveryContextType {
    resultsCount: number | null;
    setResultsCount: (count: number | null) => void;
    pricingMode: PricingMode;
    setPricingMode: React.Dispatch<React.SetStateAction<PricingMode>>;
    offerMode: OfferMode;
    setOfferMode: React.Dispatch<React.SetStateAction<OfferMode>>;
    locationLabel: string | null;
    setLocationLabel: (label: string | null) => void;
    showDiscoveryBar: boolean;
    setShowDiscoveryBar: (show: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isFilterPanelOpen: boolean;
    setFilterPanelOpen: (open: boolean) => void;
}

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

export const DiscoveryProvider = ({ children }: { children: ReactNode }) => {
    const searchParams = useSearchParams();
    const [resultsCount, setResultsCount] = useState<number | null>(null);

    // Always start with 'finance' to match SSR output, then correct from localStorage on the client.
    // A lazy useState initializer also runs on the server where localStorage is undefined,
    // causing a hydration mismatch when the client resolves a stored 'cash' value.
    const [pricingMode, setPricingMode] = useState<PricingMode>('finance');
    const [offerMode, setOfferMode] = useState<OfferMode>('BEST_OFFER');

    // On mount (client only): read saved preference and apply it
    useEffect(() => {
        const storedPricing = localStorage.getItem('bkmb_pricing_mode');
        const urlMode = searchParams.get('mode');

        // URL param takes priority over localStorage
        if (urlMode === 'cash' || urlMode === 'finance') {
            setPricingMode(urlMode);
        } else if (storedPricing === 'cash' || storedPricing === 'finance') {
            setPricingMode(storedPricing);
        }

        const storedOfferMode = localStorage.getItem('bkmb_offer_mode');
        const urlOffer = searchParams.get('offer');

        if (urlOffer === 'BEST_OFFER' || urlOffer === 'FAST_DELIVERY') {
            setOfferMode(urlOffer);
        } else if (storedOfferMode === 'BEST_OFFER' || storedOfferMode === 'FAST_DELIVERY') {
            setOfferMode(storedOfferMode);
        }
    }, [searchParams]);

    // Persist changes to localStorage
    useEffect(() => {
        localStorage.setItem('bkmb_pricing_mode', pricingMode);
    }, [pricingMode]);

    useEffect(() => {
        localStorage.setItem('bkmb_offer_mode', offerMode);
    }, [offerMode]);

    const [locationLabel, setLocationLabel] = useState<string | null>(null);
    const [showDiscoveryBar, setShowDiscoveryBar] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [isFilterPanelOpen, setFilterPanelOpen] = useState(false);

    return (
        <DiscoveryContext.Provider
            value={{
                resultsCount,
                setResultsCount,
                pricingMode,
                setPricingMode,
                offerMode,
                setOfferMode,
                locationLabel,
                setLocationLabel,
                showDiscoveryBar,
                setShowDiscoveryBar,
                searchQuery,
                setSearchQuery,
                isFilterPanelOpen,
                setFilterPanelOpen,
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
