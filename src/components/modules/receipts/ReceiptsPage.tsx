'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getReceiptsForTenant } from '@/actions/crm';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import ReceiptEditorWrapper from '@/components/modules/receipts/ReceiptEditorWrapper';
import {
    Receipt,
    CreditCard,
    Landmark,
    CheckCircle2,
    AlertCircle,
    LayoutGrid,
    Search as SearchIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';

export interface ReceiptRow {
    id: string;
    displayId: string;
    amount: number;
    method: string;
    status: string;
    date: string;
    memberName?: string;
}

export default function ReceiptsPage({ initialReceiptId }: { initialReceiptId?: string }) {
    const { tenantId } = useTenant();
    const router = useRouter();
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
    const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(initialReceiptId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchReceipts = useCallback(async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const data = await getReceiptsForTenant(tenantId);
            const mapped = (data || []).map((r: any) => ({
                id: r.id,
                displayId: r.display_id || formatDisplayId(r.id),
                amount: Number(r.amount || 0),
                method: r.method || '—',
                status: r.status || 'PENDING',
                date: r.created_at ? String(r.created_at).split('T')[0] : '',
                memberName: r.member_name || r.customer_name || '',
            }));
            setReceipts(mapped);
        } catch (error) {
            console.error('Failed to fetch receipts:', error);
            toast.error('Failed to load receipts');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('receipts-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'crm_receipts', filter: `tenant_id=eq.${tenantId}` },
                () => fetchReceipts()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, fetchReceipts]);

    useEffect(() => {
        if (initialReceiptId) setSelectedReceiptId(initialReceiptId);
    }, [initialReceiptId]);

    const filteredReceipts = useMemo(
        () =>
            receipts.filter(
                r =>
                    formatDisplayId(r.displayId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.method.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [receipts, searchQuery]
    );

    const stats = [
        { label: 'Total Receipts', value: receipts.length, icon: Receipt, color: 'indigo' as const, trend: '+4.2%' },
        {
            label: 'Captured',
            value: receipts.filter(r => ['captured', 'success', 'paid'].includes(String(r.status).toLowerCase()))
                .length,
            icon: CheckCircle2,
            color: 'emerald' as const,
        },
        {
            label: 'Pending',
            value: receipts.filter(r => !['captured', 'success', 'paid'].includes(String(r.status).toLowerCase()))
                .length,
            icon: AlertCircle,
            color: 'amber' as const,
        },
        {
            label: 'Methods',
            value: new Set(receipts.map(r => r.method)).size || 0,
            icon: CreditCard,
            color: 'blue' as const,
        },
    ];

    const handleOpenReceipt = (receiptId: string) => {
        setSelectedReceiptId(receiptId);
        if (slug) router.push(`/app/${slug}/receipts/${receiptId}`);
    };

    const handleCloseDetail = () => {
        setSelectedReceiptId(null);
        if (slug) router.push(`/app/${slug}/receipts`);
    };

    if (!selectedReceiptId) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0d10] -m-6 md:-m-8">
                <ModuleLanding
                    title="Receipts"
                    subtitle="Customer Collections"
                    onNew={() => toast.info('Create Receipt from Sales Order')}
                    searchPlaceholder="Search Receipts..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} />}
                    view={view}
                    onViewChange={setView}
                >
                    {view === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {filteredReceipts.map(receipt => (
                                <div
                                    key={receipt.id}
                                    onClick={() => handleOpenReceipt(receipt.id)}
                                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                {formatDisplayId(receipt.displayId)}
                                            </div>
                                            <div className="text-indigo-600 font-black text-sm italic tracking-tighter">
                                                ₹{receipt.amount.toLocaleString()}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                            {receipt.method}
                                        </h3>
                                        <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate mb-6">
                                            {receipt.status}
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 text-slate-400">
                                                {receipt.status}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400">{receipt.date}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Receipt ID
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Method
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Amount
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReceipts.map(receipt => (
                                        <tr
                                            key={receipt.id}
                                            onClick={() => handleOpenReceipt(receipt.id)}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                                                    {formatDisplayId(receipt.displayId)}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                    {receipt.method}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                    ₹{receipt.amount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block bg-slate-100 dark:bg-white/5 text-slate-400">
                                                    {receipt.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModuleLanding>
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans -m-6 md:-m-8">
            <MasterListDetailLayout mode="list-detail" listPosition="left">
                <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                Receipts <span className="text-indigo-600">Index</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
                                placeholder="Search receipts..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
                        {filteredReceipts.map(receipt => {
                            const isActive = selectedReceiptId === receipt.id;
                            return (
                                <button
                                    key={receipt.id}
                                    onClick={() => handleOpenReceipt(receipt.id)}
                                    className={`w-full text-left rounded-xl border transition-all duration-300 group overflow-hidden ${
                                        isActive
                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20 text-white'
                                            : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.06] hover:border-indigo-500/30 text-slate-900 dark:text-white hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex">
                                        <div className={`w-1 shrink-0 ${isActive ? 'bg-white/30' : 'bg-indigo-500'}`} />
                                        <div className="flex-1 px-3.5 py-3 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                                                >
                                                    {formatDisplayId(receipt.displayId)}
                                                </span>
                                                <span
                                                    className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600'}`}
                                                >
                                                    {receipt.status}
                                                </span>
                                            </div>
                                            <div
                                                className={`text-[12px] font-black tracking-tight uppercase truncate mb-0.5 ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}
                                            >
                                                ₹{receipt.amount.toLocaleString()}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-[10px] font-bold truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                                                >
                                                    {receipt.method}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#08090b]">
                    <ReceiptEditorWrapper receiptId={selectedReceiptId} />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
