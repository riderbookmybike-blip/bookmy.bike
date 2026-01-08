'use client';

import React from 'react';
import DealerBrandList from '@/components/dealer/products/DealerBrandList';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/auth/RoleGuard';

export default function DealerProductsPage() {
    const { tenantType } = useTenant();
    const router = useRouter();

    // Manual check removed in favor of RoleGuard


    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950">
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Brand Enablement</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage active brands and pricing rules. Variants inherit automatically.</p>
                </div>
            </div>

            <div className="flex-1">
                <RoleGuard resource="brand-enablement" action="view">
                    <MasterListDetailLayout mode="list-only">
                        <DealerBrandList
                            selectedBrand={null}
                            basePath="/brand-enablement"
                        />
                    </MasterListDetailLayout>
                </RoleGuard>
            </div>
        </div>
    );
}
