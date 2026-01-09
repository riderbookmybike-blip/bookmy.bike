'use client';

import React, { useEffect, useState } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import { Landmark, Shield, Globe, Info } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';

import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';

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
    const canEdit = can('catalog-registration', 'create');

    const [ruleList, setRuleList] = useState<any[]>([]);
    const [checkedIds, setCheckedIds] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    const STORAGE_KEY = 'aums_registration_rules_v2';

    // Helper: Load Rules from Storage or Mock
    const loadRulesFromStorage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to load from storage", e);
        }
        return MOCK_REGISTRATION_RULES; // Fallback to initial mock
    };

    useEffect(() => {
        setIsMounted(true);
        const rules = loadRulesFromStorage();
        setRuleList(rules);
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

    const handleBulkDelete = (ids: any[]) => {
        if (confirm(`Are you sure you want to delete ${ids.length} registration rules?`)) {
            const newList = ruleList.filter(item => !ids.includes(item.id));
            setRuleList(newList);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
            setCheckedIds([]);
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
                    onActionClick={() => router.push('/catalog/registration/new')}
                    basePath="/catalog/registration"
                    checkedIds={checkedIds}
                    onCheckChange={setCheckedIds}
                    onBulkDelete={handleBulkDelete}
                    metrics={metrics}
                />
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
