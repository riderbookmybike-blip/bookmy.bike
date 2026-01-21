'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getQuotes } from '@/actions/crm';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import {
    FileText,
    FileCheck,
    Clock,
    BarChart3,
    AlertCircle,
    LayoutGrid,
    Search as SearchIcon,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export interface Quote {
    id: string;
    displayId: string;
    customerName: string;
    productName: string;
    productSku: string;
    price: number;
    status: string;
    date: string;
    version: number;
}

export default function QuotesPage() {
    const { tenantId } = useTenant();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchQuotes = async () => {
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
    };

    useEffect(() => {
        fetchQuotes();
    }, [tenantId]);

    const handleNewQuote = () => {
        toast.info('Create Quote from Leads module for now');
    };

    const filteredQuotes = quotes.filter(q =>
        q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.displayId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        { label: 'Total Quotes', value: quotes.length, icon: FileText, color: 'indigo' as const, trend: '+5.2%' },
        { label: 'Accepted', value: quotes.filter(q => q.status === 'ACCEPTED').length, icon: FileCheck, color: 'emerald' as const, trend: '85% Rate' },
        { label: 'Pending', value: quotes.filter(q => q.status === 'SENT').length, icon: Clock, color: 'amber' as const },
        { label: 'Conv. Rate', value: '64%', icon: BarChart3, color: 'blue' as const, trend: 'High' },
        { label: 'Expired', value: 0, icon: AlertCircle, color: 'rose' as const },
    ];

    // --- LANDING VIEW ---
    if (!selectedQuote) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0d10]">
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
                            {filteredQuotes.map((quote) => (
                                <div
                                    key={quote.id}
                                    onClick={() => setSelectedQuote(quote)}
                                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                V{quote.version} • {quote.displayId}
                                            </div>
                                            <div className="text-indigo-600 font-black text-sm italic tracking-tighter">
                                                ₹{quote.price.toLocaleString()}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                            {quote.customerName}
                                        </h3>

                                        <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate mb-6">
                                            {quote.productName}
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${quote.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                }`}>
                                                {quote.status}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400">
                                                {quote.date}
                                            </div>
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
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Quote ID</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Value (INR)</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuotes.map((quote) => (
                                        <tr
                                            key={quote.id}
                                            onClick={() => setSelectedQuote(quote)}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                                                    V{quote.version} • {quote.displayId}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                    {quote.customerName}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                    {quote.productName}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black text-indigo-600">
                                                    ₹{quote.price.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block ${quote.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                    }`}>
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
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans">
            <MasterListDetailLayout mode="list-detail" listPosition="left">
                {/* Sidebar List */}
                <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                Quotes <span className="text-indigo-600">Index</span>
                            </h2>
                            <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400">
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
                                placeholder="Search quotes..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {filteredQuotes.map((quote) => (
                            <button
                                key={quote.id}
                                onClick={() => setSelectedQuote(quote)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${selectedQuote?.id === quote.id
                                    ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20 text-white translate-x-2'
                                    : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-indigo-500/30 text-slate-900 dark:text-white shadow-sm'
                                    }`}
                            >
                                <div className="text-[9px] font-black uppercase opacity-60 mb-1">
                                    V{quote.version} • {quote.displayId}
                                </div>
                                <div className="text-sm font-black italic tracking-tighter uppercase mb-1 truncate">
                                    {quote.customerName}
                                </div>
                                <div className={`text-[9px] font-bold ${selectedQuote?.id === quote.id ? 'text-white/80' : 'text-slate-500'}`}>
                                    ₹{quote.price.toLocaleString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail Content (Paper View) */}
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#08090b]">
                    {/* We reuse the paper view pattern here but integrated into the layout */}
                    <div className="p-10 flex flex-col items-center">
                        <div className="w-full max-w-4xl mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
                                    {selectedQuote.customerName}
                                </h1>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Proposal_Breakdown</p>
                            </div>
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-8 h-12 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
                                Convert_to_Booking
                            </button>
                        </div>

                        <div className="w-full max-w-4xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-16 min-h-[800px] relative overflow-hidden">
                            {/* Watermark */}
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] select-none pointer-events-none">
                                <FileText size={400} />
                            </div>

                            <div className="flex justify-between items-start mb-20 relative z-10">
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 mb-6 flex items-center gap-2">
                                        <span className="w-4 h-[2px] bg-indigo-500" />
                                        Commercial Quotation
                                    </h2>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">{selectedQuote.customerName}</p>
                                        <p className="text-xs font-bold text-slate-400">Customer Profile Reference</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-2">QUOTATION</div>
                                    <p className="text-indigo-600 font-mono text-sm font-bold">{selectedQuote.displayId}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-20 relative z-10">
                                <div className="bg-slate-50 dark:bg-white/[0.02] p-8 rounded-3xl border border-slate-100 dark:border-white/5">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Product Configuration</h3>
                                    <p className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-2">{selectedQuote.productName}</p>
                                    <p className="text-[10px] font-bold text-indigo-500 font-mono bg-indigo-500/5 px-2 py-1 rounded-md inline-block uppercase">{selectedQuote.productSku}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/[0.02] p-8 rounded-3xl border border-slate-100 dark:border-white/5">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Timeline Details</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-[9px] font-bold text-slate-400">DATE ISSUED</span>
                                            <span className="text-[10px] font-black dark:text-white uppercase">{selectedQuote.date}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[9px] font-bold text-slate-400">VERSION</span>
                                            <span className="text-[10px] font-black dark:text-white uppercase">V{selectedQuote.version}.0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 dark:border-white/10 pt-12 relative z-10">
                                <div className="flex justify-between items-center mb-12">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description of Charges</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Amount (INR)</span>
                                </div>

                                <div className="space-y-6 mb-12">
                                    <div className="flex justify-between items-center group">
                                        <div className="text-sm font-black italic uppercase tracking-tighter text-slate-700 dark:text-slate-300">Ex-Showroom Base Configuration</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">₹ ---</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-black italic uppercase tracking-tighter text-slate-700 dark:text-slate-300">Registration & Statutory Fees</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">₹ ---</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-black italic uppercase tracking-tighter text-slate-700 dark:text-slate-300">Comprehensive Insurance Premium</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">₹ ---</div>
                                    </div>
                                </div>

                                <div className="bg-indigo-600 rounded-[2rem] p-10 flex justify-between items-center shadow-2xl shadow-indigo-600/30">
                                    <div>
                                        <div className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">UNIFIED PROPOSAL TOTAL</div>
                                        <div className="text-sm font-bold text-white uppercase italic">All-Inclusive Final Price</div>
                                    </div>
                                    <div className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                                        ₹{selectedQuote.price.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
