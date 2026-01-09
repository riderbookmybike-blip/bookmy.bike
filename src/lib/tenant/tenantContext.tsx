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
    userRole: string | undefined;
    // Sidebar State
    isSidebarExpanded: boolean;
    setIsSidebarExpanded: (expanded: boolean) => void;
    // Legacy / Status props
    status: TenantStatus;
    isReadOnly: boolean;
}

const TenantContext = createContext<TenantContextProps>({
    tenantType: undefined,
    setTenantType: () => { },
    tenantName: 'Loading...',
    tenantId: undefined,
    userRole: undefined,
    isSidebarExpanded: false,
    setIsSidebarExpanded: () => { },
    status: 'ACTIVE',
    isReadOnly: false,
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    // Start as undefined so we don't default to DEALER prematurely
    const [tenantType, setTenantTypeState] = useState<TenantType | undefined>(undefined);
    const [tenantName, setTenantName] = useState('Loading...');
    const [tenantId, setTenantId] = useState<string | undefined>(undefined);
    const [userRole, setUserRole] = useState<string | undefined>(undefined);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Mock status logic (Can be real later)
    const status: TenantStatus = 'ACTIVE';
    const isReadOnly = status !== 'ACTIVE';

    useEffect(() => {
        let mounted = true;

        // Safety Timeout: If fetch hangs for 5s, force fallback to DEALER 
        const timeoutId = setTimeout(() => {
            if (mounted) {
                setTenantTypeState(prev => {
                    if (prev === undefined) {
                        console.warn('DEBUG: Fetch timed out, forcing fallback to DEALER');
                        return 'DEALER';
                    }
                    return prev;
                });
                setTenantName(prev => prev === 'Loading...' ? 'System Timeout' : prev);
            }
        }, 5000);

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
                    clearTimeout(timeoutId);

                    if (error) {
                        console.error('DEBUG: RPC get_session_profile error:', error);
                        setTenantTypeState('DEALER');
                        setTenantName('Connection Error');
                        return;
                    }

                    console.log('DEBUG: RPC Profile Result:', JSON.stringify(profileData));
                    const profile = profileData as any;

                    if (profile && profile.id) {
                        const role = (profile.role || profile.user_role || '').toUpperCase();
                        console.log('DEBUG: Normalized Role:', role);

                        // PRIORITY 1: Admin Roles (Super Admin bypass)
                        if (role === 'SUPER_ADMIN' || role === 'MARKETPLACE_ADMIN') {
                            console.log('DEBUG: Admin Access Granted');
                            setTenantTypeState('MARKETPLACE');
                            setTenantName(profile.tenant_name || 'BookMyBike Platform');
                            setTenantId(profile.tenant_id);
                            setUserRole(role);
                            return;
                        }

                        // PRIORITY 2: Linked Tenant logic
                        const dbType = (profile.tenant_type || '').toUpperCase();
                        if (dbType) {
                            console.log('DEBUG: Found Tenant Type:', dbType);
                            // Normalize weird DB types
                            if (dbType === 'SUPER_ADMIN' || dbType === 'MARKETPLACE_ADMIN' || dbType === 'MARKETPLACE') {
                                setTenantTypeState('MARKETPLACE');
                            } else {
                                setTenantTypeState(dbType as TenantType);
                            }
                            setTenantName(profile.tenant_name || 'Business Partner');
                            setTenantId(profile.tenant_id);
                            setUserRole(role);
                        } else {
                            console.warn('DEBUG: No tenant link found, defaulting to DEALER');
                            setTenantTypeState('DEALER');
                            setTenantName('Guest User');
                            setUserRole(role);
                        }
                    } else {
                        console.warn('DEBUG: RPC returned empty or invalid profile object');
                        setTenantTypeState('DEALER');
                        setTenantName('Unknown Profile');
                    }
                } else {
                    console.log('DEBUG: No user session found');
                    // If no user, we might be on a public page or need to redirect, 
                    // but for the context we just stop loading.
                    setTenantTypeState('DEALER');
                    setTenantName('Guest');
                }
            } catch (error) {
                console.error('Fatal error in TenantProvider:', error);
                setTenantTypeState('DEALER');
            }
        };

        fetchTenantDetails();

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
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
            userRole,
            isSidebarExpanded,
            setIsSidebarExpanded,
            status,
            isReadOnly
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
