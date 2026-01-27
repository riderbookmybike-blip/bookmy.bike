'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import DealerProfileContent from '@/components/dealers/DealerProfileContent';

export default function CompanyProfilePage() {
    const { tenantId, tenantSlug } = useTenant();

    if (!tenantId) return <div className="flex h-[80vh] items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!tenantId) return <div className="p-10 text-center text-slate-400">Tenant session not found</div>;

    return (
        <DealerProfileContent
            dealerId={tenantId}
            superAdminMode={false} // Hide network view buttons
            currentTenantSlug={tenantSlug}
            isCompanyProfile={true}
        />
    );
}
