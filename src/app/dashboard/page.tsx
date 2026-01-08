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

            {/* Tenant specific Dashboard */}
            {tenantType === 'DEALER' && <DealerDashboard />}
            {tenantType === 'BANK' && <BankDashboard />}
            {tenantType === 'SUPER_ADMIN' && <AdminDashboard />}
        </div>
    );
}
