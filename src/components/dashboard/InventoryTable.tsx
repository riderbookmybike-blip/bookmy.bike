import React from 'react';
import { Package, Search, Plus, MoreHorizontal, Share2, Edit2, ArrowUpRight } from 'lucide-react';

const MOCK_INVENTORY = [
    { id: 1, model: 'Honda Activa 6G', variant: 'Standard', color: 'Matte Axis Grey', stock: 4, status: 'AVAILABLE', price: '₹ 82,684' },
    { id: 2, model: 'Honda Activa 6G', variant: 'Deluxe', color: 'Pearl Precious White', stock: 2, status: 'AVAILABLE', price: '₹ 85,184' },
    { id: 3, model: 'Honda CB Shine', variant: 'Disc', color: 'Black', stock: 0, status: 'SOLD OUT', price: '₹ 94,842' },
    { id: 4, model: 'Honda Dio', variant: 'Standard', color: 'Sports Red', stock: 1, status: 'RESERVED', price: '₹ 78,542' },
];

export const InventoryTable = () => {
    return (
        <div className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm group/table">
            {/* Header / Actions */}
            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl -z-0 group-hover/table:scale-110 transition-transform duration-1000" />

                <div className="relative z-10">
                    <h3 className="text-sm font-black uppercase italic tracking-[0.2em] text-slate-900 dark:text-white mb-1">Live Inventory // Node 01</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time stock synchronization</p>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative group/search">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="FILTER_STOCK..."
                            className="pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black w-48 focus:w-72 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none uppercase tracking-widest placeholder:text-slate-400 shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Model Definition</th>
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Colorway</th>
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Unit Count</th>
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Operation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {MOCK_INVENTORY.map((item) => (
                            <tr key={item.id} className="group/row hover:bg-indigo-500/[0.02] transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10 group-hover/row:scale-110 group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all duration-500 shadow-inner">
                                            <Package size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{item.model}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{item.variant}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{item.color}</span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`inline-flex items-center justify-center min-w-[3rem] h-10 px-3 rounded-xl text-xs font-black font-mono tracking-tighter shadow-sm border ${item.stock > 0
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'
                                        }`}>
                                        {item.stock.toString().padStart(2, '0')}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                                        <button className="p-2.5 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-600 group/btn" title="Edit Master Record">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="p-2.5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black text-slate-400 rounded-xl transition-all shadow-sm border border-transparent" title="Inspect Vehicle">
                                            <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.01]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    Displaying 4/4 Registry Entries
                </p>
                <div className="flex gap-3">
                    <button className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-30">Prev</button>
                    <button className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Next</button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        AVAILABLE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-emerald-500/5',
        RESERVED: 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-amber-500/5',
        'SOLD OUT': 'bg-slate-100 dark:bg-white/10 text-slate-500 border-slate-200 dark:border-white/20'
    };

    return (
        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${styles[status as keyof typeof styles] || styles['SOLD OUT']}`}>
            {status}
        </span>
    );
};
