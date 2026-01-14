'use client';

import React, { useEffect, useState } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { usePermission } from '@/hooks/usePermission';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';
import { Landmark, Shield, Globe, Info } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';

import { createClient } from '@/lib/supabase/client';
import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';

const STATE_NAMES: Record<string, string> = {
    'MH': 'Maharashtra',
    'KA': 'Karnataka',
    'DL': 'Delhi',
    'TS': 'Telangana',
    'TN': 'Tamil Nadu',
    'KL': 'Kerala',
    'UP': 'Uttar Pradesh',
    'HR': 'Haryana',
    'RJ': 'Rajasthan',
    'GJ': 'Gujarat'
};

const COLUMNS = [
    { key: 'displayId', header: 'Rule ID', type: 'id' as const, width: '120px' },
    {
        key: 'ruleName',
        header: 'Jurisdiction',
        type: 'rich' as const,
        icon: Globe,
        subtitle: (item: any) => `${item.stateCode} • RTO Rule`
    },
    { key: 'status', header: 'Status', type: 'badge' as const, align: 'right' as const, width: '120px' }
];

export default function RegistrationMasterPage() {
    const { can } = usePermission();
    const router = useRouter();
    const { tenantSlug } = useTenant();
    const canEdit = can('catalog-registration', 'create');
    const basePath = tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/registration` : '/dashboard/catalog/registration';

    const [ruleList, setRuleList] = useState<any[]>([]);
    const [checkedIds, setCheckedIds] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    const fetchRules = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('registration_rules')
            .select('*')
            .order('state_code', { ascending: true });

        if (!error && data && data.length > 0) {
            const formatted = data.map(r => ({
                ...r,
                ruleName: r.ruleName?.includes('(') ? r.ruleName : `${STATE_NAMES[r.state_code || r.stateCode] || r.state_code || r.stateCode} (${r.state_code || r.stateCode})`
            }));
            setRuleList(formatted);
        } else {
            setRuleList(MOCK_REGISTRATION_RULES);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchRules();
    }, []);

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mb-4">
            {[
                { label: 'Total States', value: new Set(ruleList.map(r => r.stateCode)).size || 0, icon: Globe, color: 'text-blue-500' },
                { label: 'Active Rules', value: ruleList.filter(r => r.status === 'Active').length, icon: Shield, color: 'text-emerald-500' },
                { label: 'RTO Entities', value: ruleList.length, icon: Landmark, color: 'text-purple-500' },
                { label: 'Compliance', value: "100%", icon: Info, color: 'text-amber-500' },
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

    const handleBulkDelete = async (ids: any[]) => {
        if (confirm(`Are you sure you want to delete ${ids.length} registration rules?`)) {
            const supabase = createClient();
            const { error } = await supabase
                .from('registration_rules')
                .delete()
                .in('id', ids);

            if (!error) {
                fetchRules();
                setCheckedIds([]);
            } else {
                alert('Failed to delete rules');
            }
        }
    };

    if (!isMounted) return null;

    return (
        <RoleGuard resource="catalog-registration" action="view">
            <MasterListDetailLayout mode="list-only">
                <ListPanel
                    title="Registration (RTO)"
                    columns={COLUMNS}
                    data={ruleList}
                    actionLabel={canEdit ? "New RTO Rule" : ""}
                    onActionClick={() => router.push(`${basePath}/new`)}
                    onItemClick={(item) => router.push(`${basePath}/${item.stateCode || item.id}`)}
                    checkedIds={checkedIds}
                    onCheckChange={setCheckedIds}
                    onBulkDelete={handleBulkDelete}
                    metrics={metrics}
                />
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
