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
    tenantId: string | undefined;
    // Legacy / Status props
    status: TenantStatus;
    isReadOnly: boolean;
}

const TenantContext = createContext<TenantContextProps>({
    tenantType: undefined,
    setTenantType: () => { },
    tenantName: 'Loading...',
    tenantId: undefined,
    status: 'ACTIVE',
    isReadOnly: false,
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    // Start as undefined so we don't default to DEALER prematurely
    const [tenantType, setTenantTypeState] = useState<TenantType | undefined>(undefined);
    const [tenantName, setTenantName] = useState('Loading...');
    const [tenantId, setTenantId] = useState<string | undefined>(undefined);

    // Mock status logic (Can be real later)
    const status: TenantStatus = 'ACTIVE';
    const isReadOnly = status !== 'ACTIVE';

    useEffect(() => {
        let mounted = true;

        const fetchTenantDetails = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    if (!mounted) return;
                    console.log('DEBUG: User ID found, fetching profile via RPC...');

                    // Use RPC to bypass RLS infinite recursion
                    const { data: profileData, error } = await supabase.rpc('get_session_profile');

                    if (!mounted) return;

                    if (error) {
                        console.error('DEBUG: Error fetching profile (RPC):', error);
                        // Do NOT fallback to DEALER blindly. 
                        setTenantName('Connection Error');
                        return;
                    }

                    const profile = profileData as any;

                    if (profile) {
                        console.log('DEBUG: Profile Role:', profile.role);

                        // PRIORITY 1: Role check (Super Admin bypass)
                        if (profile.role === 'SUPER_ADMIN' || profile.role === 'MARKETPLACE_ADMIN') {
                            setTenantTypeState('MARKETPLACE');
                            setTenantName(profile.tenants?.name || 'BookMyBike Platform');
                            setTenantId(profile.tenants?.id);
                            return;
                        }

                        // PRIORITY 2: Linked Tenant logic
                        if (profile.tenants) {
                            const dbType = profile.tenants.type;
                            if (dbType) {
                                // Normalize weird DB types
                                if (dbType === 'SUPER_ADMIN' || dbType === 'MARKETPLACE_ADMIN') {
                                    setTenantTypeState('MARKETPLACE');
                                } else {
                                    setTenantTypeState(dbType as TenantType);
                                }
                            } else {
                                setTenantTypeState('DEALER'); // Final fallback for staff
                            }
                            setTenantName(profile.tenants.name);
                            setTenantId(profile.tenants.id);
                        }
                        else {
                            // No tenant and not a super admin
                            setTenantTypeState('DEALER');
                            setTenantName('Guest User');
                        }
                    } else {
                        // Edge case: No profile at all
                        setTenantTypeState('DEALER');
                        setTenantName('Unknown Profile');
                    }
                } else {
                    console.log('DEBUG: No user session found');
                }
            } catch (error) {
                console.error('Fatal error in TenantProvider:', error);
            }
        };

        fetchTenantDetails();

        return () => {
            mounted = false;
        };
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
            tenantId,
            status,
            isReadOnly
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
