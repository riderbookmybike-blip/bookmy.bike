'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MOCK_BANK_PARTNERS } from '@/types/bankPartner';
import {
    Search,
    Plus,
    Upload,
    Filter,
    Building2,
    Edit3,
    Trash2,
    ShieldCheck,
    BarChart4,
    TrendingUp,
    Zap,
} from 'lucide-react';
import ListPanel from '@/components/templates/ListPanel';
import { createClient } from '@/lib/supabase/client';
import OnboardBankModal from '@/components/finance/OnboardBankModal';
import { LayoutGrid, List, BarChart3 } from 'lucide-react';
import FinanceTargetingTab from './tabs/FinanceTargetingTab';
import { BankPartner } from '@/types/bankPartner';
import AllSchemesAPRView from './AllSchemesAPRView';

export default function BankList() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string;
    const [view, setView] = useState<'list' | 'routing' | 'apr'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBanks = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('id_tenants')
            .select('*')
            .eq('type', 'BANK')
            .order('name', { ascending: true });

        if (data) {
            setBanks(data);
        }
        if (error) {
            console.error('Error fetching banks:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const BANK_COLUMNS = [
        {
            key: 'name',
            header: 'Financier',
            type: 'rich' as const,
            icon: Building2,
            subtitle: () => 'Finance Partner',
        },
        { key: 'displayId', header: 'Partner ID', type: 'id' as const, width: '140px' },
        {
            key: 'product',
            header: 'Product',
            type: 'text' as const,
            width: '180px',
        },
        {
            key: 'schemesCount',
            header: 'Schemes',
            type: 'text' as const,
            width: '120px',
        },
        { key: 'status', header: 'Status', type: 'badge' as const, align: 'center' as const, width: '120px' },
    ];

    // Combine real data with display properties
    const finalData = banks.map(p => {
        const schemesCount = (p.config as any)?.schemes?.length || 0;
        return {
            ...p,
            displayId: p.display_id || p.id.slice(0, 8).toUpperCase(),
            product: 'Two Wheeler Loan',
            schemesCount: `${schemesCount} Items`,
            rawSchemesCount: schemesCount,
        };
    });

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
                { label: 'Total Partners', value: finalData.length, icon: Building2, color: 'text-blue-500' },
                {
                    label: 'Active Schemes',
                    value: finalData.reduce((acc, p) => acc + (p.rawSchemesCount || 0), 0),
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
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl w-fit mb-8 border border-slate-200 dark:border-white/5 mx-auto">
                <button
                    onClick={() => setView('list')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        view === 'list'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm shadow-black/5'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                >
                    <List size={14} /> Partner Directory
                </button>
                <button
                    onClick={() => setView('routing')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        view === 'routing'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm shadow-black/5'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                >
                    <LayoutGrid size={14} /> Routing Matrix
                </button>
                <button
                    onClick={() => setView('apr')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        view === 'apr'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm shadow-black/5'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                >
                    <BarChart3 size={14} /> APR Comparison
                </button>
            </div>

            {view === 'list' ? (
                <ListPanel
                    title="FINANCE PARTNERS"
                    data={finalData}
                    columns={BANK_COLUMNS}
                    metrics={metrics}
                    isLoading={loading}
                    basePath={basePath}
                    actionLabel="Add New Partner"
                    onActionClick={() => setIsModalOpen(true)}
                />
            ) : view === 'routing' ? (
                <FinanceTargetingTab />
            ) : (
                <AllSchemesAPRView banks={banks} />
            )}

            <OnboardBankModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchBanks} />
        </div>
    );
}
