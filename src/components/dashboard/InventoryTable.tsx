import React from 'react';
import { Package, Search, Plus, Filter, MoreHorizontal, Share2, Edit2 } from 'lucide-react';

const MOCK_INVENTORY = [
    { id: 1, model: 'Honda Activa 6G', variant: 'Standard', color: 'Matte Axis Grey', stock: 4, status: 'AVAILABLE', price: '₹ 82,684' },
    { id: 2, model: 'Honda Activa 6G', variant: 'Deluxe', color: 'Pearl Precious White', stock: 2, status: 'AVAILABLE', price: '₹ 85,184' },
    { id: 3, model: 'Honda CB Shine', variant: 'Disc', color: 'Black', stock: 0, status: 'SOLD OUT', price: '₹ 94,842' },
    { id: 4, model: 'Honda Dio', variant: 'Standard', color: 'Sports Red', stock: 1, status: 'RESERVED', price: '₹ 78,542' },
];

export const InventoryTable = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
            {/* Header / Actions */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5">
                <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Live Inventory</h3>
                    <p className="text-xs text-slate-500 font-medium tracking-wide">Manage your stock availability across the network.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="SEARCH STOCK..."
                            className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold w-48 focus:w-64 transition-all outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/20">
                        <Plus size={14} /> Add Stock
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Model Details</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Color</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Stock</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {MOCK_INVENTORY.map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-black flex items-center justify-center text-slate-400">
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.model}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.variant}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.color}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg text-xs font-bold ${item.stock > 0
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                        }`}>
                                        {item.stock}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Generate Share Link">
                                            <Share2 size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing 4 of 4 Items</p>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50">Prev</button>
                    <button className="px-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">Next</button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        AVAILABLE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        RESERVED: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        'SOLD OUT': 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
    };

    return (
        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${styles[status as keyof typeof styles] || styles['SOLD OUT']}`}>
            {status}
        </span>
    );
};
