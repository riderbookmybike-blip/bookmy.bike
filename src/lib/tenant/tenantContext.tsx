'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type TenantType = 'DEALER' | 'BANK' | 'SUPER_ADMIN';

// Enhanced TenantContext with Status props
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED';

interface TenantContextProps {
    tenantType: TenantType;
    setTenantType: (type: TenantType) => void;
    tenantName: string;
    // Legacy / Status props
    status: TenantStatus;
    isReadOnly: boolean;
}

const TenantContext = createContext<TenantContextProps>({
    tenantType: 'DEALER',
    setTenantType: () => { },
    tenantName: 'Demo Dealership',
    status: 'ACTIVE',
    isReadOnly: false,
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    // Persist mock tenant selection
    const [tenantType, setTenantTypeState] = useState<TenantType>('DEALER');

    // Mock status logic
    const status: TenantStatus = 'ACTIVE';
    const isReadOnly = status !== 'ACTIVE';

    useEffect(() => {
        const stored = localStorage.getItem('mock_tenant_type');
        if (stored) setTenantTypeState(stored as TenantType);
    }, []);

    const setTenantType = (type: TenantType) => {
        setTenantTypeState(type);
        localStorage.setItem('mock_tenant_type', type);
        // Force reload to clear any stale state if needed, or simple re-render
        // window.location.reload(); 
    };

    const getTenantName = () => {
        switch (tenantType) {
            case 'DEALER': return 'Ace Honda (Dealer)';
            case 'BANK': return 'HDFC Bank (Tenant)';
            case 'SUPER_ADMIN': return 'AUMS Admin';
            default: return 'Unknown';
        }
    };

    return (
        <TenantContext.Provider value={{
            tenantType,
            setTenantType,
            tenantName: getTenantName(),
            status,
            isReadOnly
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
