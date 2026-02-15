'use client';

import React, { useEffect, useState } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import DealerInstrumentCluster from '@/components/dashboard/DealerInstrumentCluster';
import BankInstrumentCluster from '@/components/dashboard/BankInstrumentCluster';
import AdminInstrumentCluster from '@/components/dashboard/AdminInstrumentCluster';
import UserDashboard from '@/components/dashboard/UserDashboard';
import DynamicDashboard from '@/components/dashboard/DynamicDashboard';
import { DashboardConfig } from '@/modules/core/types';

// MAIN PAGE SHELL
export default function DashboardPage() {
    const { tenantType, tenantName, activeRole } = useTenant();

    const [dynamicConfig, setDynamicConfig] = useState<DashboardConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    // Fetch Dynamic Configuration
    useEffect(() => {
        const fetchConfig = async () => {
            if (!tenantType || !activeRole) return;
            setLoadingConfig(true);
            try {
                const res = await fetch(`/api/me/dashboard-config?tenantType=${tenantType}&role=${activeRole}`);
                const data = await res.json();
                if (data.found && data.config) {
                    setDynamicConfig(data.config);
                } else {
                    setDynamicConfig(null);
                }
            } catch (e) {
                console.error('Failed to load dynamic dashboard', e);
            } finally {
                setLoadingConfig(false);
            }
        };

        fetchConfig();
    }, [tenantType, activeRole]);

    // 1. Loading State (Initial Hydration)
    if ((!tenantType && !activeRole) || (tenantType && loadingConfig)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic animate-pulse">
                    Loading Dashboard...
                </p>
            </div>
        );
    }

    // 2. Access Denied State (Blocker)
    if (tenantName === 'Access Denied') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                    <div className="relative w-24 h-24 rounded-[32px] bg-white dark:bg-slate-900 border border-red-500/20 shadow-2xl flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <span className="text-red-500 font-bold text-xl">!</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-2 text-center">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        Access Denied
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto">
                        You don&apos;t have an active membership for this dealership.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">
            {/* Main Content Area */}
            {tenantType && tenantName !== 'Access Denied' && (
                <>
                    {/* Prefer Dynamic Config if available */}
                    {dynamicConfig ? (
                        <div className="space-y-6">
                            <DynamicDashboard config={dynamicConfig} />
                        </div>
                    ) : (
                        /* Fallback to legacy hardcoded dashboards */
                        <>
                            {tenantType === 'DEALER' && activeRole !== 'BMB_USER' && <DealerInstrumentCluster />}
                            {tenantType === 'BANK' && activeRole !== 'BMB_USER' && <BankInstrumentCluster />}
                            {tenantType === 'MARKETPLACE' &&
                                (activeRole &&
                                ['OWNER', 'DEALERSHIP_ADMIN', 'DEALERSHIP_STAFF'].includes(activeRole) ? (
                                    <AdminInstrumentCluster />
                                ) : (
                                    <UserDashboard />
                                ))}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
