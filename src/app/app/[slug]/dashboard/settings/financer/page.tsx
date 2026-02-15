'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Landmark, Building2, Zap, TrendingUp, ShieldCheck, List } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ListPanel from '@/components/templates/ListPanel';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';

export default function FinancerSettingsPage() {
    const params = useParams();
    const slug = params?.slug as string | undefined;
    const { tenantType } = useTenant();
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanks = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data, error } = await supabase
                .from('id_tenants')
                .select('*')
                .eq('type', 'BANK')
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching banks:', error);
            }
            setBanks(data || []);
            setLoading(false);
        };
        fetchBanks();
    }, []);

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
            { key: 'schemesCount', header: 'Schemes', type: 'text' as const, width: '120px' },
            { key: 'status', header: 'Status', type: 'badge' as const, align: 'center' as const, width: '120px' },
        ],
        []
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
                    status: 'ACTIVE',
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
                    label: 'Active Schemes',
                    value: data.reduce((acc, p) => acc + ((p as any).schemesCount ? 1 : 0), 0),
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
                    <h1 className="text-2xl font-black">Financer</h1>
                    <p className="text-slate-500 text-sm">
                        Dealer view of finance partners and schemes. (Read-only partner info; scheme controls coming
                        next.)
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
        </div>
    );
}
