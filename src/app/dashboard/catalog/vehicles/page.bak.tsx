'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { Edit3, Trash2, Package, ShieldCheck, AlertTriangle, Layers, Plus, Box, AlertCircle } from 'lucide-react';

import RoleGuard from '@/components/auth/RoleGuard';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { KPICard } from '@/components/dashboard/KPICard';
import { useSearch } from '@/lib/context/SearchContext';

const VEHICLE_COLUMNS = [
    {
        key: 'image',
        header: 'Image',
        type: 'image' as const,
        width: '80px',
        align: 'center' as const
    },
    {
        key: 'brand',
        header: 'Brand',
        type: 'rich' as const,
        icon: ShieldCheck,
        subtitle: (item: any) => 'Vehicle Brand',
        width: '160px'
    },
    { key: 'model', header: 'Model', width: '140px' },
    { key: 'variant', header: 'Variant', width: '180px' },
    { key: 'color', header: 'Color', width: '140px' },
    { key: 'sku', header: 'SKU ID', type: 'id' as const, width: '180px' },
    { key: 'status', header: 'Status', type: 'badge' as const, width: '100px' },
];

export default function VehiclesPage() {
    const router = useRouter();
    const { setSearchQuery } = useSearch();

    // Get all unique SKUs (flattened from vehicles)
    const allSKUs = MOCK_VEHICLES.map(v => ({
        id: v.sku,
        sku: v.sku,
        image: v.bodyType === 'SCOOTER' ? '/images/categories/scooter.png' : '/images/categories/motorcycle.png',
        brand: v.make,
        model: v.model,
        variant: v.variant,
        color: v.color || '-',
        status: v.status === 'ACTIVE' ? 'Active' : 'Inactive',
    }));

    const metrics = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
                title="Total Brands"
                value={Array.from(new Set(allSKUs.map(s => s.brand))).length}
                icon={ShieldCheck}
                sub="Global Manufacturers"
                onClick={() => setSearchQuery('')}
            />
            <KPICard
                title="Registered SKUs"
                value={allSKUs.length}
                icon={Box}
                delta="+4"
                isUp={true}
                sub="Active in Inventory"
            />
            <KPICard
                title="Inactive SKUs"
                value={allSKUs.filter(s => s.status === 'Inactive').length}
                icon={AlertCircle}
                delta="0%"
                isUp={true}
                sub="Requires Attention"
                onClick={() => setSearchQuery('inactive')}
            />
            <KPICard
                title="Total Variants"
                value={Array.from(new Set(allSKUs.map(s => s.variant))).length}
                icon={Layers}
                sub="Model Configurations"
            />
        </div>
    );

    return (
        <RoleGuard resource="catalog-vehicles" action="view">
            <div className="space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="px-2 py-0.5 rounded-md bg-indigo-600/10 border border-indigo-600/20 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                CATALOG V2.0
                            </div>
                            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                SYNCED
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                            VEHICLES <span className="text-indigo-600">CATALOG</span>
                            <span className="block text-sm font-bold text-slate-400 not-italic tracking-widest uppercase mt-2">Master Inventory & SKU Management</span>
                        </h1>
                    </div>
                </div>

                <MasterListDetailLayout mode="list-only">
                    <ListPanel
                        title="Vehicles Catalog"
                        columns={VEHICLE_COLUMNS}
                        data={allSKUs}
                        actionLabel="Add Brand"
                        onActionClick={() => { }}
                        basePath="/catalog/vehicles"
                        metrics={metrics}
                        tight={true}
                        onQuickAction={(action, item) => console.log(`Quick action ${action} on`, item)}
                        onMetricClick={(metricId) => {
                            if (metricId === 'totalBrands') {
                                setSearchQuery('');
                            } else if (metricId === 'inactiveSKUs') {
                                setSearchQuery('inactive');
                            }
                        }}
                    />
                </MasterListDetailLayout>
            </div>
        </RoleGuard>
    );
}
