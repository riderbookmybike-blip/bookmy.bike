import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Search, Plus } from 'lucide-react';

export interface Lead {
    id: string;
    displayId?: string;
    customerName: string;
    phone: string;
    status: string;
    source: string;
    interestModel?: string;
    created_at: string;
    intentScore?: 'HOT' | 'WARM' | 'COLD';
    customerId: string;
}

interface LeadListProps {
    leads: Lead[];
    selectedId: string | null;
    onSelect: (lead: Lead) => void;
    onNewLead: () => void;
}

const formatLeadId = (id: string) => {
    if (!id) return '---';
    const cleanId = id.replace(/-/g, '').toUpperCase();
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`;
};

export default function LeadList({ leads, selectedId, onSelect, onNewLead }: LeadListProps) {
    const [searchQuery, setSearchQuery] = React.useState('');

    // Filter leads based on search query
    // Note: specialized virtualization libraries often handle filtering internally if datasets are massive,
    // but for <10k client-side, this filter + Virtuoso is extremely fast.
    const filteredLeads = React.useMemo(() => {
        const query = searchQuery.toLowerCase();
        return leads.filter(l =>
            l.customerName.toLowerCase().includes(query) ||
            l.phone.includes(query) ||
            (l.displayId && l.displayId.toLowerCase().includes(query))
        );
    }, [leads, searchQuery]);

    const Row = (_index: number, item: Lead) => (
        <div className="pb-2 px-1">
            <div
                onClick={() => onSelect(item)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${item.id === selectedId
                    ? 'bg-white dark:bg-white/5 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/10'
                    }`}
            >
                {item.id === selectedId && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                )}

                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${item.id === selectedId ? 'text-indigo-500' : 'text-slate-400'
                        }`}>
                        ID: {formatLeadId(item.id)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 opacity-60">
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <h3 className={`text-sm font-black tracking-tight mb-2 transition-colors ${item.id === selectedId ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                    {item.customerName}
                </h3>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${item.id === selectedId
                            ? 'bg-indigo-600/10 text-indigo-600'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                            }`}>
                            {item.status}
                        </div>
                    </div>
                    {item.intentScore === 'HOT' && (
                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900/10 font-sans border-r border-slate-200 dark:border-white/5">
            {/* 1. Header: Functional Index */}
            <div className="p-6 pb-4 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Pipeline Index</h2>
                    <button
                        onClick={onNewLead}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Intelligence..."
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* 2. Virtualized Scrollable List */}
            <div className="flex-1 px-3 pb-2">
                {filteredLeads.length > 0 ? (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={filteredLeads}
                        itemContent={Row}
                        className="no-scrollbar"
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <span className="text-xs font-bold">No leads found</span>
                    </div>
                )}
            </div>
        </div>
    );
}
