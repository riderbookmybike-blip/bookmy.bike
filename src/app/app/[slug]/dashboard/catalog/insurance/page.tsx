'use client';

import React, { useState, useEffect } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { usePermission } from '@/hooks/usePermission';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';

import { Landmark, Shield, Globe, Info, Activity, Percent, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataSourceIndicator from '@/components/dev/DataSourceIndicator';

const COLUMNS = [
    { key: 'displayId', header: 'Rule ID', type: 'id' as const, width: '120px' },
    {
        key: 'insurerName',
        header: 'Insurer Profile',
        type: 'rich' as const,
        icon: Shield,
        subtitle: (item: any) => `${item.stateCode} • ${item.vehicleType}`
    },
    { key: 'idvPercentage', header: 'IDV %', width: '100px', align: 'center' as const },
    { key: 'effectiveFrom', header: 'Effective', width: '120px' },
    { key: 'status', header: 'Status', type: 'badge' as const, width: '120px' }
];

export default function InsuranceMasterPage() {
    const { can } = usePermission();
    const router = useRouter();
    const { tenantSlug } = useTenant();
    const canEdit = can('catalog-insurance', 'create');
    const basePath = tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/insurance` : '/dashboard/catalog/insurance';

    const [checkedIds, setCheckedIds] = useState<any[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [dataSource, setDataSource] = useState<'LIVE' | 'MOCK'>('LIVE');

    useEffect(() => {
        const fetchInsurance = async () => {
            const supabase = createClient();
            const { data: dbData, error } = await supabase
                .from('insurance_rules')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && dbData) {
                setData(dbData.map(d => ({
                    ...d,
                    displayId: d.display_id,
                    insurerName: d.insurer_name,
                    stateCode: d.state_code,
                    vehicleType: d.vehicle_type,
                    idvPercentage: d.idv_percentage + '%',
                    effectiveFrom: d.created_at ? d.created_at.split('T')[0] : ''
                })));
                setDataSource('LIVE');
            } else {
                console.error("Error fetching insurance rules:", error);
                setData([]);
                setDataSource('LIVE');
            }
        };
        fetchInsurance();
    }, []);

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mb-4">
            {[
                { label: 'Insurers', value: new Set(data.map(d => d.insurerName)).size || 0, icon: Shield, color: 'text-blue-500' },
                { label: 'Active Rules', value: data.filter(d => d.status === 'Active').length, icon: Activity, color: 'text-emerald-500' },
                { label: 'Avg IDV %', value: `${Math.round(data.reduce((acc, d) => acc + parseFloat(d.idvPercentage), 0) / (data.length || 1))}%`, icon: Percent, color: 'text-purple-500' },
                { label: 'Fast Track', value: "Live", icon: Zap, color: 'text-amber-500' },
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

    const handleBulkDelete = (ids: any[]) => {
        if (confirm(`Are you sure you want to delete ${ids.length} insurance rules?`)) {
            const newData = data.filter(item => !ids.includes(item.id));
            setData(newData);
            setCheckedIds([]);
        }
    };

    return (
        <RoleGuard resource="catalog-insurance" action="view">
            <MasterListDetailLayout mode="list-only">
                <ListPanel
                    title={
                        <div className="flex items-center gap-3">
                            Insurance Rules
                            <DataSourceIndicator source={dataSource} />
                        </div>
                    }
                    columns={COLUMNS}
                    data={data}
                    actionLabel={canEdit ? "New Insurance Rule" : ""}
                    onActionClick={() => router.push(`${basePath}/new`)}
                    onItemClick={(item) => router.push(`${basePath}/${item.displayId || item.stateCode || item.id}`)}
                    basePath={basePath}
                    checkedIds={checkedIds}
                    onCheckChange={setCheckedIds}
                    onBulkDelete={handleBulkDelete}
                    metrics={metrics}
                />
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
