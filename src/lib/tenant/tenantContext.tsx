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
    userName: string;
    tenantId: string | undefined;
    userRole: string | undefined;
    activeRole: string | undefined;
    switchRole: (role: string) => void;
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
    userName: 'Guest User',
    tenantId: undefined,
    userRole: undefined,
    activeRole: undefined,
    switchRole: () => { },
    isSidebarExpanded: false,
    setIsSidebarExpanded: () => { },
    status: 'ACTIVE',
    isReadOnly: false,
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    const [tenantType, setTenantTypeState] = useState<TenantType | undefined>(undefined);
    const [tenantName, setTenantName] = useState('Loading...');
    const [userName, setUserName] = useState('Guest User');
    const [tenantId, setTenantId] = useState<string | undefined>(undefined);
    const [userRole, setUserRole] = useState<string | undefined>(undefined);
    const [activeRole, setActiveRole] = useState<string | undefined>(undefined);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const status: TenantStatus = 'ACTIVE';
    const isReadOnly = status !== 'ACTIVE';

    const switchRole = (role: string) => {
        setActiveRole(role);
        localStorage.setItem('active_role', role);
        console.log('DEBUG: Switched role to:', role);
    };

    useEffect(() => {
        let mounted = true;

        const fetchTenantDetails = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: profileData, error } = await supabase.rpc('get_session_profile');
                    if (!mounted) return;

                    if (profileData) {
                        const profile = profileData as any;
                        const originalRole = (profile.role || '').toUpperCase();
                        setUserRole(originalRole);

                        // Set User Name
                        setUserName(profile.full_name || user.email?.split('@')[0] || 'User');
                        localStorage.setItem('user_name', profile.full_name || user.email?.split('@')[0] || 'User');

                        // Persistence Restore
                        const savedRole = localStorage.getItem('active_role');
                        const finalRole = (originalRole === 'SUPER_ADMIN' || originalRole === 'MARKETPLACE_ADMIN')
                            ? (savedRole || originalRole)
                            : originalRole;

                        setActiveRole(finalRole);

                        if (finalRole === 'SUPER_ADMIN' || finalRole === 'MARKETPLACE_ADMIN') {
                            setTenantTypeState('MARKETPLACE');
                            setTenantName(profile.tenant_name || 'BookMyBike Platform');
                        } else {
                            const dbType = (profile.tenant_type || '').toUpperCase();
                            setTenantTypeState(dbType as TenantType || 'DEALER');
                            setTenantName(profile.tenant_name || 'Business Partner');
                        }
                        setTenantId(profile.tenant_id);
                    }
                } else {
                    // Fallback for no auth (dev/mock)
                    const localName = localStorage.getItem('user_name');
                    if (localName) setUserName(localName);
                }
            } catch (err) {
                console.error(err);
                setTenantTypeState('DEALER');
            }
        };

        fetchTenantDetails();
        return () => { mounted = false; };
    }, []);

    return (
        <TenantContext.Provider value={{
            tenantType,
            setTenantType: setTenantTypeState,
            tenantName,
            userName,
            tenantId,
            userRole,
            activeRole,
            switchRole,
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
