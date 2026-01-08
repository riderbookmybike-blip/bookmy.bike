'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TenantType = 'DEALER' | 'BANK' | 'MARKETPLACE';

// Enhanced TenantContext with Status props
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED';

interface TenantContextProps {
    tenantType: TenantType | undefined;
    setTenantType: (type: TenantType) => void;
    tenantName: string;
    // Legacy / Status props
    status: TenantStatus;
    isReadOnly: boolean;
}

const TenantContext = createContext<TenantContextProps>({
    tenantType: undefined,
    setTenantType: () => { },
    tenantName: 'Loading...',
    status: 'ACTIVE',
    isReadOnly: false,
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    // Start as undefined so we don't default to DEALER prematurely
    const [tenantType, setTenantTypeState] = useState<TenantType | undefined>(undefined);
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
                    console.log('DEBUG: User ID:', user.id);
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*, tenants(name, type)')
                        .eq('id', user.id)
                        .single();

                    if (error) {
                        console.error('DEBUG: Error fetching profile:', error);
                        return;
                    }

                    if (profile && profile.tenants) {
                        console.log('DEBUG: Full Profile Data:', profile);
                        // Ensure type mapping is exact
                        const dbType = profile.tenants.type;

                        // If DB returned a type, use it. Otherwise warn.
                        if (dbType) {
                            setTenantTypeState(dbType as TenantType);
                        } else {
                            console.warn('DEBUG: Tenant has no TYPE column value!');
                            setTenantTypeState('DEALER'); // Fallback only if strictly missing
                        }
                        setTenantName(profile.tenants.name);
                    } else {
                        console.warn('DEBUG: Profile or Tenant not found for user');
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
