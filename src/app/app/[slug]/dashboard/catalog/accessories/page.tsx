'use client';

import React from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { usePermission } from '@/hooks/usePermission';
import { Package, Tag, AlertCircle, IndianRupee } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';

// MOCK DATA FOR ACCESSORIES (Would normally come from API/Store)
const ACCESSORIES_DATA = [
    { id: 'ACC-HL-001', sku: 'ACC-HL-001', name: 'Premium Helmet', category: 'Safety', compatibility: 'Universal', gst: '18%', price: 2500 },
    { id: 'ACC-SG-002', sku: 'ACC-SG-002', name: 'Saddle Bags', category: 'Storage', compatibility: 'Cruiser Models', gst: '18%', price: 4500 },
    { id: 'ACC-EG-003', sku: 'ACC-EG-003', name: 'Engine Guard', category: 'Protection', compatibility: 'Royal Enfield Classic', gst: '18%', price: 3200 },
];

const COLUMNS = [
    { key: 'sku', header: 'SKU', type: 'id' as const, width: '120px' },
    {
        key: 'name',
        header: 'Product Profile',
        type: 'rich' as const,
        icon: Tag,
        subtitle: (item: any) => `${item.category} • ${item.compatibility}`
    },
    { key: 'gst', header: 'GST', width: '80px' },
    { key: 'price', header: 'Price', type: 'amount' as const, align: 'right' as const, width: '120px' }
];


// ... (previous helper and columns)

export default function AccessoriesMasterPage() {
    const { can } = usePermission();

    // Check if user can edit (Admin) to show Action Button
    const canEdit = can('catalog-accessories', 'create');

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mb-4">
            {[
                { label: 'Total Accessories', value: 3, icon: Package, color: 'text-blue-500' },
                { label: 'Categories', value: 3, icon: Tag, color: 'text-emerald-500' },
                { label: 'Low Stock', value: 1, icon: AlertCircle, color: 'text-rose-500' },
                { label: 'Total Inventory', value: '₹ 10,200', icon: IndianRupee, color: 'text-purple-500' },
            ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-4 flex flex-col justify-center relative overflow-hidden group shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
                    <div className="flex items-center gap-2">
                        <stat.icon size={16} className={stat.color} />
                        <span className="text-xl font-black italic text-slate-800 dark:text-white tracking-tighter">{stat.value}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <RoleGuard resource="catalog-accessories" action="view">
            <MasterListDetailLayout mode="list-only">
                <ListPanel
                    title="Accessories"
                    columns={COLUMNS}
                    data={ACCESSORIES_DATA}
                    actionLabel={canEdit ? "New Accessory" : ""}
                    onActionClick={() => alert("Create Accessory Modal (Admin Only)")}
                    basePath="/catalog/accessories"
                    metrics={metrics}
                />
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
