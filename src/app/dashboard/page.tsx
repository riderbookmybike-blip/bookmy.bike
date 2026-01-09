'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import DealerDashboard from '@/components/dashboard/DealerDashboard';
import BankDashboard from '@/components/dashboard/BankDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

// MAIN PAGE SHELL
export default function DashboardPage() {
    const { tenantType, setTenantType } = useTenant();

    return (
        <div className="p-6 lg:p-12 max-w-[1600px] mx-auto bg-transparent min-h-screen transition-colors duration-500">

            {/* Loading State */}
            {!tenantType && (
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium animate-pulse">Loading workspace...</p>
                    </div>
                </div>
            )}

            {/* Tenant specific Dashboard */}
            {tenantType === 'DEALER' && <DealerDashboard />}
            {tenantType === 'BANK' && <BankDashboard />}
            {tenantType === 'MARKETPLACE' && <AdminDashboard />}
        </div>
    );
}
