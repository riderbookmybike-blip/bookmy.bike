'use client';

import React from 'react';
import DealerBrandList from '@/components/dealer/products/DealerBrandList';
import DealerBrandDetail from '@/components/dealer/products/DealerBrandDetail';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter, useParams } from 'next/navigation';

export default function DealerProductDetailPage() {
    const { tenantType } = useTenant();
    const router = useRouter();
    const params = useParams();

    // Explicitly decode the ID to handle brands like "Royal Enfield" that might have spaces
    const brandName = params.id ? decodeURIComponent(params.id as string) : null;

    React.useEffect(() => {
        if (tenantType !== 'DEALER') {
            // router.push('/dashboard'); // Strict Access
        }
    }, [tenantType, router]);

    const handleClose = () => {
        router.push('/brand-enablement');
    };

    if (tenantType !== 'DEALER') {
        return null;
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950">
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Brand Enablement</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage active brands and pricing rules. Variants inherit automatically.</p>
                </div>
            </div>

            <div className="flex-1">
                <MasterListDetailLayout mode="list-detail">
                    <DealerBrandList
                        selectedBrand={brandName}
                        basePath="/brand-enablement"
                    />
                    <DealerBrandDetail
                        brandName={brandName}
                        onClose={handleClose}
                    />
                </MasterListDetailLayout>
            </div>
        </div>
    );
}
