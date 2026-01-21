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
    pincode?: string;
    dob?: string;
    referralSource?: string;
}

interface LeadListProps {
    leads: Lead[];
    selectedId: string | null;
    onSelect: (lead: Lead) => void;
    onNewLead: () => void;
    isSidebar?: boolean;
}

const formatLeadId = (id: string) => {
    if (!id) return '---';
    const cleanId = id.replace(/-/g, '').toUpperCase();
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`;
};

export default function LeadList({ leads, selectedId, onSelect, onNewLead, isSidebar }: LeadListProps) {
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
        <div className="pb-3 px-2">
            <div
                onClick={() => onSelect(item)}
                className={`p-5 rounded-[2.5rem] cursor-pointer transition-all border group relative overflow-hidden active:scale-[0.98] ${item.id === selectedId
                    ? 'bg-white/80 dark:bg-white/10 border-indigo-500/30 shadow-2xl shadow-indigo-500/10 backdrop-blur-md'
                    : 'bg-white/40 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm'
                    }`}
            >
                {item.id === selectedId && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(79,70,229,0.8)]" />
                )}

                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${item.id === selectedId
                        ? 'bg-indigo-600/10 text-indigo-600'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                        }`}>
                        ID: {formatLeadId(item.id)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 opacity-60">
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <h3 className={`text-sm font-black tracking-tight mb-3 transition-colors uppercase italic ${item.id === selectedId ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                    {item.customerName}
                </h3>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.id === selectedId
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                            }`}>
                            {item.status}
                        </div>
                        {item.intentScore === 'HOT' && (
                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Priority</span>
                        )}
                    </div>
                    {item.intentScore === 'HOT' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,1)] animate-pulse" />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-transparent font-sans">
            {/* 1. Header: Functional Index */}
            <div className="p-8 pb-4 space-y-6 shrink-0">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                        {isSidebar ? 'Pipeline Index' : 'Leads Index'}
                    </h2>
                    <button
                        onClick={onNewLead}
                        className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-90 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="relative group px-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Intelligence..."
                        className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
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
