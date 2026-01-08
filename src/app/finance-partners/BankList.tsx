'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_BANK_PARTNERS } from '@/types/bankPartner';
import { Search, Plus, Upload, Filter, Building2, Edit3, Trash2, ShieldCheck, BarChart4, TrendingUp, Zap } from 'lucide-react';
import ListPanel from '@/components/templates/ListPanel';

export default function BankList() {
    const router = useRouter();

    const BANK_COLUMNS = [
        {
            key: 'name',
            header: 'Financier',
            type: 'rich' as const,
            icon: Building2,
            subtitle: () => 'Finance Partner'
        },
        { key: 'displayId', header: 'Partner ID', type: 'id' as const, width: '140px' },
        {
            key: 'product',
            header: 'Product',
            type: 'text' as const,
            width: '180px'
        },
        {
            key: 'schemesCount',
            header: 'Schemes',
            type: 'text' as const,
            width: '120px'
        },
        { key: 'status', header: 'Status', type: 'badge' as const, align: 'center' as const, width: '120px' },
    ];

    const bankData = MOCK_BANK_PARTNERS.map(p => ({
        ...p,
        product: 'Two Wheeler Loan',
        schemesCount: `${p.schemes.length} Items`,
    }));

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
                { label: 'Total Partners', value: MOCK_BANK_PARTNERS.length, icon: Building2, color: 'text-blue-500' },
                { label: 'Active Schemes', value: MOCK_BANK_PARTNERS.reduce((acc, p) => acc + p.schemes.length, 0), icon: Zap, color: 'text-emerald-500' },
                { label: 'Avg. ROI', value: '10.5%', icon: TrendingUp, color: 'text-purple-500' },
                { label: 'Lending Reach', value: 'PAN India', icon: ShieldCheck, color: 'text-amber-500' },
            ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 flex flex-col justify-center relative overflow-hidden group shadow-sm dark:shadow-xl transition-all hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 dark:bg-white/5 blur-2xl -z-10 opacity-50" />
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
                    <div className="flex items-center gap-3">
                        <stat.icon size={18} className={stat.color} />
                        <span className="text-2xl font-black italic text-slate-900 dark:text-white tracking-tighter">{stat.value}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <ListPanel
                title="FINANCE PARTNERS"
                data={bankData}
                columns={BANK_COLUMNS}
                metrics={metrics}
                basePath="/finance-partners"
                actionLabel="Add New Partner"
                onActionClick={() => { }}
            />
        </div>
    );
}
