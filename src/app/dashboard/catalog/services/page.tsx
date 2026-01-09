'use client';

import React from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { usePermission } from '@/hooks/usePermission';

import { MOCK_SERVICES_MASTER } from '@/lib/mock/catalogMocks';
import { Wrench, Zap, IndianRupee, Layers } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';

const COLUMNS = [
    {
        key: 'name',
        header: 'Service Profile',
        type: 'rich' as const,
        icon: Wrench,
        subtitle: (item: any) => `${item.type} • ${item.price}`
    },
    { key: 'gst', header: 'GST', width: '100px' },
    { key: 'value', header: 'Price', type: 'amount' as const, align: 'right' as const, width: '140px' }
];

export default function ServicesMasterPage() {
    const { can } = usePermission();
    const canEdit = can('catalog-services', 'create');

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mb-4">
            {[
                { label: 'Total Services', value: MOCK_SERVICES_MASTER.length, icon: Wrench, color: 'text-blue-500' },
                { label: 'Service Types', value: new Set(MOCK_SERVICES_MASTER.map(s => s.type)).size, icon: Layers, color: 'text-emerald-500' },
                { label: 'Avg Price', value: "₹ 850", icon: IndianRupee, color: 'text-purple-500' },
                { label: 'Instant Sync', value: "Live", icon: Zap, color: 'text-amber-500' },
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
        <RoleGuard resource="catalog-services" action="view">
            <MasterListDetailLayout mode="list-only">
                <ListPanel
                    title="Services"
                    columns={COLUMNS}
                    data={MOCK_SERVICES_MASTER}
                    actionLabel={canEdit ? "New Service" : ""}
                    onActionClick={() => alert("Create Service (Admin Only)")}
                    basePath="/catalog/services"
                    metrics={metrics}
                />
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
