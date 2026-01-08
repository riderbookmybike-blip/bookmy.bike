'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TenantType = 'DEALER' | 'BANK' | 'MARKETPLACE';

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
    const [tenantType, setTenantTypeState] = useState<TenantType>('DEALER');
    const [tenantName, setTenantName] = useState('Loading...');

    // Mock status logic (Can be real later)
    const status: TenantStatus = 'ACTIVE';
    const isReadOnly = status !== 'ACTIVE';

    useEffect(() => {
        const fetchTenantDetails = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*, tenants(name, type)')
                        .eq('id', user.id)
                        .single();

                    if (profile && profile.tenants) {
                        // Map DB Tenant Type to UI Tenant Type
                        // Ensure DB types match UI types (MARKETPLACE, DEALER, BANK)
                        const dbType = profile.tenants.type;
                        setTenantTypeState(dbType as TenantType);
                        setTenantName(profile.tenants.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching tenant details:', error);
            }
        };

        fetchTenantDetails();
    }, []);

    const setTenantType = (type: TenantType) => {
        // For debugging/switching specific roles if needed
        setTenantTypeState(type);
    };

    return (
        <TenantContext.Provider value={{
            tenantType,
            setTenantType,
            tenantName,
            status,
            isReadOnly
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
