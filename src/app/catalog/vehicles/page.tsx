'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { Edit3, Trash2, Package, ShieldCheck, AlertTriangle, Layers, Plus, Box, AlertCircle } from 'lucide-react';

import RoleGuard from '@/components/auth/RoleGuard';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';
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
        <div className="flex gap-4">
            <div
                className="flex-1 min-w-[200px] p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[32px] shadow-sm hover:border-indigo-500/50 transition-all cursor-pointer group"
                onClick={() => setSearchQuery('')}
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Brands</span>
                    <ShieldCheck size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                    {Array.from(new Set(allSKUs.map(s => s.brand))).length}
                </div>
            </div>
            <div className="flex-1 min-w-[200px] p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[32px] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered SKUs</span>
                    <Box size={16} className="text-emerald-500" />
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                    {allSKUs.length}
                </div>
            </div>
            <div
                className="flex-1 min-w-[200px] p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[32px] shadow-sm hover:border-red-500/50 transition-all cursor-pointer group"
                onClick={() => setSearchQuery('inactive')}
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inactive</span>
                    <AlertCircle size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                    {allSKUs.filter(s => s.status === 'Inactive').length}
                </div>
            </div>
            <div className="flex-1 min-w-[200px] p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[32px] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Variants</span>
                    <Layers size={16} className="text-amber-500" />
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                    {Array.from(new Set(allSKUs.map(s => s.variant))).length}
                </div>
            </div>
        </div>
    );

    return (
        <RoleGuard resource="catalog-vehicles" action="view">
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
                        // Example: Handle metric clicks to filter the list
                        if (metricId === 'totalBrands') {
                            setSearchQuery('');
                        } else if (metricId === 'inactiveSKUs') {
                            setSearchQuery('inactive');
                        }
                    }}
                />
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
