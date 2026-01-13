'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import DealerDashboard from '@/components/dashboard/DealerDashboard';
import BankDashboard from '@/components/dashboard/BankDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import UserDashboard from '@/components/dashboard/UserDashboard';

// MAIN PAGE SHELL
export default function DashboardPage() {
    const {
        tenantType,
        tenantName,
        activeRole
    } = useTenant();

    // 1. Loading State (Initial Hydration)
    if (!tenantType && !activeRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic animate-pulse">
                    Synchronizing...
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
                    <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Access Denied</h1>
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
                    {tenantType === 'DEALER' && activeRole !== 'BMB_USER' && <DealerDashboard />}
                    {tenantType === 'BANK' && activeRole !== 'BMB_USER' && <BankDashboard />}
                    {(tenantType === 'MARKETPLACE') && (
                        (activeRole && ['OWNER', 'DEALERSHIP_ADMIN', 'DEALERSHIP_STAFF'].includes(activeRole))
                            ? <AdminDashboard />
                            : <UserDashboard />
                    )}
                </>
            )}
        </div>
    );
}
