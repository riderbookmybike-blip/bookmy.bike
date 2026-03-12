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
import { Receipt, CreditCard, CheckCircle2, AlertCircle, LayoutGrid, Search as SearchIcon, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';
import { useBreakpoint } from '@/hooks/useBreakpoint';

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
    const { device } = useBreakpoint();
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
                { event: '*', schema: 'public', table: 'crm_payments', filter: `tenant_id=eq.${tenantId}` },
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
                    r.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (r.memberName || '').toLowerCase().includes(searchQuery.toLowerCase())
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
    ];

    const handleOpenReceipt = (receiptId: string) => {
        setSelectedReceiptId(receiptId);
        if (slug) router.push(`/app/${slug}/receipts/${receiptId}`);
    };

    const handleCloseDetail = () => {
        setSelectedReceiptId(null);
        if (slug) router.push(`/app/${slug}/receipts`);
    };

    const effectiveView = device === 'phone' ? 'list' : view;

    if (!selectedReceiptId) {
        return (
            <div className="h-full bg-[#f8fafc]">
                <ModuleLanding
                    title="Receipts Registry"
                    subtitle="FINANCIAL_LOG"
                    onNew={() => toast.info('Register from Booking node')}
                    searchPlaceholder="Search Receipts Registry..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={effectiveView}
                    onViewChange={setView}
                    device={device}
                >
                    {effectiveView === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredReceipts.map(receipt => (
                                <div
                                    key={receipt.id}
                                    onClick={() => handleOpenReceipt(receipt.id)}
                                    className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:border-indigo-500/30 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                            {formatDisplayId(receipt.displayId)}
                                        </div>
                                        <div className="text-slate-900 font-black text-sm tabular-nums">
                                            ₹{receipt.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {receipt.memberName || receipt.method}
                                    </h3>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                        {receipt.date}
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                        <div className="px-2 py-0.5 rounded bg-slate-50 text-[9px] font-black uppercase text-slate-400 border border-slate-100">
                                            {receipt.status}
                                        </div>
                                        <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                            {receipt.method}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Node ID
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Identity
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Mode
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                                            Valuation
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReceipts.map(receipt => (
                                        <tr
                                            key={receipt.id}
                                            onClick={() => handleOpenReceipt(receipt.id)}
                                            className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                                        >
                                            <td className="px-6 py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                {formatDisplayId(receipt.displayId)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                                        <User size={14} />
                                                    </div>
                                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                        {receipt.memberName || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {receipt.method}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-slate-900 tabular-nums">
                                                ₹{receipt.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="px-2.5 py-1 rounded inline-block text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-100">
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
        <div className="h-full bg-white flex overflow-hidden font-sans">
            <MasterListDetailLayout
                mode="list-detail"
                listPosition="left"
                device={device}
                hasActiveDetail={!!selectedReceiptId}
                onBack={handleCloseDetail}
            >
                <div className="h-full flex flex-col bg-[#fdfdfd] border-r border-slate-200 w-full">
                    <div className="p-4 border-b border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                                Receipts <span className="text-indigo-600">Core</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400"
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-8 pr-4 text-[10px] font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/50 shadow-sm"
                                placeholder="Search receipt nodes..."
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {filteredReceipts.map(receipt => {
                            const isActive = selectedReceiptId === receipt.id;
                            return (
                                <button
                                    key={receipt.id}
                                    onClick={() => handleOpenReceipt(receipt.id)}
                                    className={`w-full text-left rounded-lg p-3 transition-all border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span
                                            className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            {formatDisplayId(receipt.displayId)}
                                        </span>
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${receipt.status === 'success' ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                                        />
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {receipt.memberName || 'N/A'}
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>{receipt.method}</span>
                                        <span className="text-slate-900 font-black tabular-nums">
                                            ₹{(receipt.amount / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-white">
                    <ReceiptEditorWrapper receiptId={selectedReceiptId} />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
