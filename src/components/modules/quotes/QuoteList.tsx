import React, { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Search, Plus, FileText, Calendar, DollarSign } from 'lucide-react';

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
    isLatest: boolean;
}

interface QuoteListProps {
    quotes: Quote[];
    selectedId: string | null;
    onSelect: (quote: Quote) => void;
    onNewQuote: () => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
};

export default function QuoteList({ quotes, selectedId, onSelect, onNewQuote }: QuoteListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredQuotes = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return quotes.filter(
            q =>
                q.customerName.toLowerCase().includes(query) ||
                q.displayId.toLowerCase().includes(query) ||
                q.productName.toLowerCase().includes(query)
        );
    }, [quotes, searchQuery]);

    const Row = (_index: number, item: Quote) => (
        <div className="pb-2 px-1">
            <div
                onClick={() => onSelect(item)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${
                    item.id === selectedId
                        ? 'bg-white dark:bg-white/5 border-indigo-500/50 dark:border-white/20 shadow-lg shadow-indigo-500/10 dark:shadow-white/5'
                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/10'
                }`}
            >
                {item.id === selectedId && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 dark:bg-white rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.5)] dark:shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                )}

                <div className="flex justify-between items-start mb-2">
                    <span
                        className={`text-[9px] font-black uppercase tracking-widest ${
                            item.id === selectedId ? 'text-indigo-500 dark:text-white' : 'text-slate-400'
                        }`}
                    >
                        {item.displayId}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 opacity-60 flex items-center gap-1">
                        ver.{item.version}
                    </span>
                </div>

                <h3
                    className={`text-sm font-black tracking-tight mb-1 transition-colors ${
                        item.id === selectedId ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                    {item.customerName}
                </h3>

                <p className="text-[10px] font-medium text-slate-500 mb-3 truncate">{item.productName}</p>

                <div className="flex items-center justify-between">
                    <div
                        className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                            item.status === 'ACCEPTED'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : item.status === 'SENT'
                                  ? 'bg-indigo-500/10 text-indigo-500'
                                  : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        {item.status}
                    </div>

                    <span
                        className={`text-[10px] font-bold ${item.id === selectedId ? 'text-indigo-600 dark:text-white' : 'text-slate-600 dark:text-slate-500'}`}
                    >
                        {formatPrice(item.price)}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] font-sans border-r border-slate-200 dark:border-white/5">
            {/* 1. Header: Functional Index */}
            <div className="p-6 pb-4 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        Global Quotes
                    </h2>
                    <button
                        onClick={onNewQuote}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 dark:shadow-white/10 active:scale-95"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search Quotes..."
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-white/10 focus:border-indigo-500 dark:focus:border-white/20 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* 2. List */}
            <div className="flex-1 px-3 pb-2">
                {filteredQuotes.length > 0 ? (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={filteredQuotes}
                        itemContent={Row}
                        className="no-scrollbar"
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
                        <FileText size={24} className="opacity-20" />
                        <span className="text-xs font-bold">No quotes found</span>
                    </div>
                )}
            </div>
        </div>
    );
}
