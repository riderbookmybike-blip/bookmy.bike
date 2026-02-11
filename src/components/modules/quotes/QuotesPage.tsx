'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getQuotes } from '@/actions/crm';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import QuoteEditorWrapper from '@/components/modules/quotes/QuoteEditorWrapper';
import { FileText, FileCheck, Clock, BarChart3, AlertCircle, LayoutGrid, Search as SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';

export interface Quote {
    id: string;
    displayId: string;
    customerName: string;
    productName: string;
    productSku: string;
    price: number;
    status: string;
    date: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleVariant: string;
    vehicleColor: string;
}

export default function QuotesPage({ initialQuoteId }: { initialQuoteId?: string }) {
    const { tenantId } = useTenant();
    const router = useRouter();
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(initialQuoteId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchQuotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getQuotes(tenantId);
            setQuotes(data || []);
        } catch (error) {
            console.error('Failed to fetch quotes:', error);
            toast.error('Failed to load quotes');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    // ── Supabase Realtime: Live quote updates (Facebook-style) ──
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('quotes-live')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'crm_quotes',
                    filter: `tenant_id=eq.${tenantId}`,
                },
                _payload => {
                    // Auto-refresh the quotes list on any change
                    fetchQuotes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, fetchQuotes]);

    useEffect(() => {
        if (initialQuoteId) {
            setSelectedQuoteId(initialQuoteId);
        }
    }, [initialQuoteId]);

    const handleNewQuote = () => {
        toast.info('Create Quote from Leads module for now');
    };

    const filteredQuotes = useMemo(
        () =>
            quotes.filter(
                q =>
                    q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    formatDisplayId(q.displayId).toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [quotes, searchQuery]
    );

    const stats = [
        { label: 'Total Quotes', value: quotes.length, icon: FileText, color: 'indigo' as const, trend: '+5.2%' },
        {
            label: 'Approved',
            value: quotes.filter(q => q.status === 'APPROVED').length,
            icon: FileCheck,
            color: 'emerald' as const,
            trend: '85% Rate',
        },
        {
            label: 'Pending',
            value: quotes.filter(q => q.status === 'SENT').length,
            icon: Clock,
            color: 'amber' as const,
        },
        { label: 'Conv. Rate', value: '64%', icon: BarChart3, color: 'blue' as const, trend: 'High' },
        { label: 'Expired', value: 0, icon: AlertCircle, color: 'rose' as const },
    ];

    const handleOpenQuote = (quoteId: string) => {
        setSelectedQuoteId(quoteId);
        if (slug) {
            router.push(`/app/${slug}/quotes/${quoteId}`);
        }
    };

    const handleCloseDetail = () => {
        setSelectedQuoteId(null);
        if (slug) {
            router.push(`/app/${slug}/quotes`);
        }
    };

    // --- LANDING VIEW ---
    if (!selectedQuoteId) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0d10] -m-6 md:-m-8">
                <ModuleLanding
                    title="Quotes"
                    subtitle="Commercial Proposals"
                    onNew={handleNewQuote}
                    searchPlaceholder="Search Quotes Index..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} />}
                    view={view}
                    onViewChange={setView}
                >
                    {view === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {filteredQuotes.map(quote => (
                                <div
                                    key={quote.id}
                                    onClick={() => handleOpenQuote(quote.id)}
                                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                {formatDisplayId(quote.displayId)}
                                            </div>
                                            <div className="text-indigo-600 font-black text-sm italic tracking-tighter">
                                                ₹{quote.price.toLocaleString()}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                            {quote.customerName}
                                        </h3>

                                        <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate mb-6">
                                            {[quote.vehicleBrand, quote.vehicleModel, quote.vehicleVariant]
                                                .filter(Boolean)
                                                .join(' ')}
                                            {quote.vehicleColor ? ` • ${quote.vehicleColor}` : ''}
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div
                                                className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                                    quote.status === 'APPROVED'
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                }`}
                                            >
                                                {quote.status}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400">{quote.date}</div>
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
                                            Quote ID
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Customer
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Product
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Value (INR)
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuotes.map(quote => (
                                        <tr
                                            key={quote.id}
                                            onClick={() => handleOpenQuote(quote.id)}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                                                    {formatDisplayId(quote.displayId)}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                    {quote.customerName}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                    {[quote.vehicleBrand, quote.vehicleModel, quote.vehicleVariant]
                                                        .filter(Boolean)
                                                        .join(' ')}
                                                    {quote.vehicleColor ? (
                                                        <span className="text-slate-400"> • {quote.vehicleColor}</span>
                                                    ) : (
                                                        ''
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black text-indigo-600">
                                                    ₹{quote.price.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div
                                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block ${
                                                        quote.status === 'APPROVED'
                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                    }`}
                                                >
                                                    {quote.status}
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

    // --- DETAIL VIEW ---
    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans -m-6 md:-m-8">
            <MasterListDetailLayout mode="list-detail" listPosition="left">
                {/* Sidebar List */}
                <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                Quotes <span className="text-indigo-600">Index</span>
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
                                placeholder="Search quotes..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
                        {filteredQuotes.map(quote => {
                            const isActive = selectedQuoteId === quote.id;
                            const statusColor =
                                quote.status === 'APPROVED' || quote.status === 'SENT'
                                    ? 'emerald'
                                    : quote.status === 'IN_REVIEW'
                                      ? 'amber'
                                      : quote.status === 'SUPERSEDED'
                                        ? 'slate'
                                        : 'indigo';
                            return (
                                <button
                                    key={quote.id}
                                    onClick={() => handleOpenQuote(quote.id)}
                                    className={`w-full text-left rounded-xl border transition-all duration-300 group overflow-hidden ${
                                        isActive
                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20 text-white'
                                            : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.06] hover:border-indigo-500/30 text-slate-900 dark:text-white hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex">
                                        {/* Status accent bar */}
                                        <div
                                            className={`w-1 shrink-0 ${
                                                isActive
                                                    ? 'bg-white/30'
                                                    : statusColor === 'emerald'
                                                      ? 'bg-emerald-500'
                                                      : statusColor === 'amber'
                                                        ? 'bg-amber-500'
                                                        : statusColor === 'slate'
                                                          ? 'bg-slate-300 dark:bg-slate-600'
                                                          : 'bg-indigo-500'
                                            }`}
                                        />
                                        <div className="flex-1 px-3.5 py-3 min-w-0">
                                            {/* Row 1: ID + Status */}
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                                                >
                                                    {formatDisplayId(quote.displayId)}
                                                </span>
                                                <span
                                                    className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                                        isActive
                                                            ? 'bg-white/20 text-white'
                                                            : statusColor === 'emerald'
                                                              ? 'bg-emerald-500/10 text-emerald-600'
                                                              : statusColor === 'amber'
                                                                ? 'bg-amber-500/10 text-amber-600'
                                                                : statusColor === 'slate'
                                                                  ? 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                                  : 'bg-indigo-500/10 text-indigo-600'
                                                    }`}
                                                >
                                                    {quote.status}
                                                </span>
                                            </div>
                                            {/* Row 2: Customer Name */}
                                            <div
                                                className={`text-[12px] font-black tracking-tight uppercase truncate mb-0.5 ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}
                                            >
                                                {quote.customerName}
                                            </div>
                                            {/* Row 3: Vehicle + Price */}
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-[10px] font-bold truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                                                >
                                                    {quote.vehicleBrand
                                                        ? [quote.vehicleBrand, quote.vehicleModel, quote.vehicleVariant]
                                                              .filter(Boolean)
                                                              .join(' ')
                                                        : quote.productName || '—'}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-black tabular-nums shrink-0 ml-2 ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}
                                                >
                                                    ₹{Number(quote.price).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Detail Content - Quote Editor */}
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#08090b]">
                    <QuoteEditorWrapper quoteId={selectedQuoteId} onClose={handleCloseDetail} onRefresh={fetchQuotes} />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
