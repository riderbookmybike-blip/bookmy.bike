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
import DataSourceIndicator from '@/components/dev/DataSourceIndicator';
import { calculateRegistrationCharges } from '@/lib/aums/registrationEngine';
import { CalculationContext } from '@/types/registration';

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
    { key: 'formattedId', header: 'Rule ID', type: 'id' as const, width: '180px' }, // Displaying formatted ID
    {
        key: 'ruleName',
        header: 'Jurisdiction',
        type: 'rich' as const,
        icon: Globe,
        subtitle: (item: any) => `${item.stateCode} • RTO Rule`
    },
    { key: 'fixedTotal', header: 'Fixed Fees', type: 'amount' as const, width: '180px' },
    { key: 'taxRange', header: 'Tax % Range', width: '200px' },
    { key: 'sampleTotal', header: 'Est. (State 1L)', type: 'amount' as const, width: '200px' },
    { key: 'status', header: 'Status', type: 'badge' as const, align: 'right' as const, width: '120px' }
];

export default function RegistrationMasterPage() {
    const { can } = usePermission();
    const router = useRouter();
    const { tenantSlug } = useTenant();
    const canEdit = can('catalog-registration', 'create');
    const basePath = tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/registration` : '/dashboard/catalog/registration';

    const [ruleList, setRuleList] = useState<any[]>([]);
    const [dataSource, setDataSource] = useState<'LIVE' | 'MOCK'>('MOCK');
    const [checkedIds, setCheckedIds] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    const fetchRules = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('registration_rules')
            .select('*')
            .order('state_code', { ascending: true });

        if (!error && data) {
            const formatted = data.map(r => {
                const stateCode = r.state_code || r.stateCode;
                const ruleName = r.rule_name || r.ruleName;
                const components = r.components || [];

                // 1. Calculate Fixed Charges Sum
                const fixedTotal = components
                    .filter((c: any) => c.type === 'FIXED')
                    .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

                // 2. Calculate Tax Range (Min/Max)
                const percentages: number[] = [];
                components.forEach((c: any) => {
                    if (c.type === 'PERCENTAGE') percentages.push(c.percentage || 0);
                    if (c.type === 'SLAB') (c.ranges || []).forEach((range: any) => percentages.push(range.percentage || 0));
                });
                const minTax = percentages.length ? Math.min(...percentages) : 0;
                const maxTax = percentages.length ? Math.max(...percentages) : 0;
                const taxRange = percentages.length ? `${minTax}% - ${maxTax}%` : 'N/A';

                // 3. Sample Calculation (1L, 100cc)
                let sampleTotal = 0;
                try {
                    const ctx: CalculationContext = {
                        exShowroom: 100000,
                        invoiceBase: 100000,
                        engineCc: 100,
                        fuelType: 'PETROL',
                        regType: 'STATE_INDIVIDUAL',
                        variantConfig: { stateTenure: 15, bhTenure: 2, companyMultiplier: 2 }
                    };
                    // Ensure 'r' has necessary fields for engine (it might be raw JSON, but structure should match)
                    const res = calculateRegistrationCharges(r as any, ctx);
                    sampleTotal = res.totalAmount;
                } catch (e) {
                    console.error("Sample calc failed for", stateCode, e);
                }

                // 4. Format ID: Last 9 chars in 3-3-3 format
                const rawUuid = r.id || '';
                const cleanUuid = rawUuid.replace(/-/g, '');
                const last9 = cleanUuid.slice(-9);
                const formattedId = last9.length === 9
                    ? `${last9.slice(0, 3).toUpperCase()}-${last9.slice(3, 6).toUpperCase()}-${last9.slice(6, 9).toUpperCase()}`
                    : rawUuid.slice(0, 8); // Fallback

                return {
                    ...r,
                    id: r.id,
                    formattedId, // New field for display
                    displayId: r.display_id || r.displayId,
                    stateCode: stateCode,
                    ruleName: ruleName?.includes('(')
                        ? ruleName
                        : `${STATE_NAMES[stateCode] || stateCode} (${stateCode})`,
                    fixedTotal,
                    taxRange,
                    sampleTotal
                };
            });
            setRuleList(formatted);
            setDataSource('LIVE');
        } else {
            console.error("Error fetching registration rules:", error);
            setRuleList([]);
            setDataSource('LIVE'); // Still LIVE even if empty, as we aren't using MOCK
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
                    title={
                        <div className="flex items-center gap-3">
                            Registration (RTO)
                            <DataSourceIndicator source={dataSource} />
                        </div>
                    }
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
