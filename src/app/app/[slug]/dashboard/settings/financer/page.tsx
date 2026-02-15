'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Landmark, Building2, Zap, TrendingUp, ShieldCheck, List, Loader2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ListPanel from '@/components/templates/ListPanel';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getDealerFinancers, toggleDealerFinancer } from '@/actions/finance-partners';
import FinancerAccessModal from '@/components/finance/FinancerAccessModal';

export default function FinancerSettingsPage() {
    const params = useParams();
    const slug = params?.slug as string | undefined;
    const { tenantType, tenantId } = useTenant();
    const [banks, setBanks] = useState<any[]>([]);
    const [linkedIds, setLinkedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    // Access Modal State
    const [accessModal, setAccessModal] = useState<{ open: boolean; financeId: string; name: string }>({
        open: false,
        financeId: '',
        name: '',
    });

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();

        const [banksRes, linksRes] = await Promise.all([
            supabase.from('id_tenants').select('*').eq('type', 'BANK').order('name', { ascending: true }),
            tenantId ? getDealerFinancers(tenantId) : Promise.resolve({ success: true, financerIds: [] }),
        ]);

        if (banksRes.data) setBanks(banksRes.data);
        if (linksRes.success) setLinkedIds(linksRes.financerIds || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [tenantId]);

    const handleToggleLink = async (financeId: string, currentStatus: boolean) => {
        if (!tenantId) return;
        setToggling(financeId);
        const res = await toggleDealerFinancer(tenantId, financeId, !currentStatus);
        if (res.success) {
            setLinkedIds(prev => (!currentStatus ? [...prev, financeId] : prev.filter(id => id !== financeId)));
        }
        setToggling(null);
    };

    const columns = useMemo(
        () => [
            {
                key: 'name',
                header: 'Financier',
                type: 'rich' as const,
                icon: Building2,
                subtitle: () => 'Finance Partner',
            },
            { key: 'displayId', header: 'Partner ID', type: 'id' as const, width: '140px' },
            { key: 'product', header: 'Product', type: 'text' as const, width: '180px' },
            {
                key: 'isLinked',
                header: 'Marketplace Link',
                width: '180px',
                render: (item: any) => {
                    const isLinked = linkedIds.includes(item.id);
                    const isToggling = toggling === item.id;
                    return (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    handleToggleLink(item.id, isLinked);
                                }}
                                disabled={isToggling}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                    isLinked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/10'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        isLinked ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                                {isToggling && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 size={10} className="animate-spin text-blue-400" />
                                    </div>
                                )}
                            </button>
                            <span
                                className={`text-[10px] font-black uppercase tracking-widest ${isLinked ? 'text-blue-600' : 'text-slate-400'}`}
                            >
                                {isLinked ? 'Linked' : 'Offline'}
                            </span>
                        </div>
                    );
                },
            },
            {
                key: 'access',
                header: 'Staff Access',
                width: '160px',
                render: (item: any) => {
                    const isLinked = linkedIds.includes(item.id);
                    if (!isLinked) return null;
                    return (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setAccessModal({ open: true, financeId: item.id, name: item.name });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all"
                        >
                            <Users size={12} /> Manage Access
                        </button>
                    );
                },
            },
        ],
        [linkedIds, toggling]
    );

    const data = useMemo(
        () =>
            (banks || []).map(p => {
                const schemesCount = (p.config as any)?.schemes?.length || 0;
                return {
                    ...p,
                    displayId: p.display_id || (p.id || '').slice(0, 8).toUpperCase(),
                    product: 'Two Wheeler Loan',
                    schemesCount: `${schemesCount} Items`,
                };
            }),
        [banks]
    );

    // Guard: only dealers can view (after hooks)
    if (tenantType && tenantType !== 'DEALER') {
        return (
            <div className="p-6">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 font-semibold">
                    Financer settings are only available to dealerships.
                </div>
            </div>
        );
    }

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
                { label: 'Total Partners', value: data.length, icon: Building2, color: 'text-blue-500' },
                {
                    label: 'Linked Partners',
                    value: linkedIds.length,
                    icon: Zap,
                    color: 'text-emerald-500',
                },
                { label: 'Avg. ROI', value: '10.5%', icon: TrendingUp, color: 'text-purple-500' },
                { label: 'Lending Reach', value: 'PAN India', icon: ShieldCheck, color: 'text-amber-500' },
            ].map((stat, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 flex flex-col justify-center relative overflow-hidden group shadow-sm dark:shadow-xl transition-all hover:scale-[1.02]"
                >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 dark:bg-white/5 blur-2xl -z-10 opacity-50" />
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        {stat.label}
                    </span>
                    <div className="flex items-center gap-3">
                        <stat.icon size={18} className={stat.color} />
                        <span className="text-2xl font-black italic text-slate-900 dark:text-white tracking-tighter">
                            {stat.value}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    const basePath = slug ? `/app/${slug}/dashboard/finance-partners` : '/dashboard/finance-partners';

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Landmark className="text-emerald-600" />
                <div>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter">Financer Connectivity</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        Manage your dealership's finance partner links and cross-tenant staff permissions.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl w-fit mb-4 border border-slate-200 dark:border-white/5">
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-blue-600 shadow-sm shadow-black/5">
                    <List size={14} /> Partner Directory
                </button>
            </div>

            <ListPanel
                title="Finance Partners"
                data={data}
                columns={columns}
                metrics={metrics}
                isLoading={loading}
                basePath={basePath}
                actionLabel="" // hide action
                onActionClick={undefined}
            />

            <FinancerAccessModal
                isOpen={accessModal.open}
                onClose={() => setAccessModal({ ...accessModal, open: false })}
                dealerId={tenantId || ''}
                financeId={accessModal.financeId}
                financeName={accessModal.name}
            />
        </div>
    );
}
