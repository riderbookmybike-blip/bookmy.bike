'use client';

import React from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { usePermission } from '@/hooks/usePermission';

import { Wrench, Zap, IndianRupee, Layers } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataSourceIndicator from '@/components/dev/DataSourceIndicator';

const COLUMNS = [
    {
        key: 'name',
        header: 'Service Profile',
        type: 'rich' as const,
        icon: Wrench,
        subtitle: (item: any) => `${item.type} • ${item.gst}`,
    },
    { key: 'displayId', header: 'Service ID', type: 'id' as const, width: '150px' },
    { key: 'value', header: 'Price', type: 'amount' as const, align: 'right' as const, width: '140px' },
];

export default function ServicesMasterPage() {
    const { can } = usePermission();
    const canEdit = can('catalog-services', 'create');
    const [data, setData] = React.useState<any[]>([]);
    const [dataSource, setDataSource] = React.useState<'LIVE' | 'MOCK'>('LIVE');

    React.useEffect(() => {
        const fetchServices = async () => {
            const supabase = createClient();
            const { data: dbData, error } = await (supabase as any).from('catalog_services').select('*').order('name');

            if (!error && dbData) {
                setData(
                    (dbData as any[]).map(d => ({
                        ...d,
                        displayId: d.display_id,
                    }))
                );
                setDataSource('LIVE');
            } else {
                console.error('Error fetching services:', error);
                setData([]);
                setDataSource('LIVE');
            }
        };
        fetchServices();
    }, []);

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mb-4">
            {[
                { label: 'Total Services', value: data.length, icon: Wrench, color: 'text-blue-500' },
                {
                    label: 'Service Types',
                    value: new Set(data.map(s => s.type)).size,
                    icon: Layers,
                    color: 'text-emerald-500',
                },
                {
                    label: 'Avg Price',
                    value: `₹ ${Math.round(data.reduce((acc, d) => acc + Number(d.value), 0) / (data.length || 1))}`,
                    icon: IndianRupee,
                    color: 'text-purple-500',
                },
                { label: 'Source', value: dataSource, icon: Zap, color: 'text-amber-500' },
            ].map((stat, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-4 flex flex-col justify-center relative overflow-hidden group shadow-sm"
                >
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        {stat.label}
                    </span>
                    <div className="flex items-center gap-2">
                        <stat.icon size={16} className={stat.color} />
                        <span className="text-xl font-black italic text-slate-800 dark:text-white tracking-tighter">
                            {stat.value}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <RoleGuard resource="catalog-services" action="view">
            <MasterListDetailLayout mode="list-only">
                <ListPanel
                    title={
                        <div className="flex items-center gap-3">
                            Services
                            <DataSourceIndicator source={dataSource} />
                        </div>
                    }
                    columns={COLUMNS}
                    data={data}
                    actionLabel={canEdit ? 'New Service' : ''}
                    onActionClick={() => alert('Create Service (Admin Only)')}
                    basePath="/catalog/services"
                    metrics={metrics}
                />
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
