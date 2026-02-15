'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Warehouse,
    Plus,
    Search,
    Filter,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Package,
    Tag,
    Hash,
    Car,
    Loader2,
    ArrowDownToLine,
    ShieldCheck,
    Calendar,
    User,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { format } from 'date-fns';
import InwardStockModal from './components/InwardStockModal';

interface InventoryItem {
    id: string;
    chassis_number: string;
    engine_number: string;
    status: string;
    created_at: string;
    vehicle_colors: {
        name: string;
        vehicle_variants: {
            name: string;
            vehicle_models: {
                name: string;
                brands: {
                    name: string;
                };
            };
        };
    };
    allocated_to?: {
        customer_name: string;
    };
}

export default function StockPage() {
    const supabase: any = createClient();
    const { tenantId } = useTenant();
    const [stock, setStock] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (tenantId) {
            fetchStock();
        }
    }, [tenantId, statusFilter]);

    const fetchStock = async () => {
        setLoading(true);
        try {
            let query = (supabase as any)
                .from('vehicle_inventory')
                .select(
                    `
                    *,
                    vehicle_colors (
                        name,
                        vehicle_variants (
                            name,
                            vehicle_models (
                                name,
                                brands (name)
                            )
                        )
                    ),
                    allocated_to:purchase_requisitions!allocated_to_requisition_id (
                        customer_name
                    )
                `
                )
                .order('created_at', { ascending: false });

            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setStock((data as any) || []);
        } catch (err) {
            console.error('Error fetching stock:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'AVAILABLE':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
            case 'BOOKED':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
            case 'SOLD':
                return 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10';
        }
    };

    const filteredStock = stock.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
            item.chassis_number.toLowerCase().includes(query) ||
            item.engine_number.toLowerCase().includes(query) ||
            item.vehicle_colors.vehicle_variants.vehicle_models.name.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Warehouse className="text-emerald-500" size={32} />
                        LIVE STOCK
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                        Real-time inventory of physical vehicle assets
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 uppercase tracking-wide shrink-0 transition-transform"
                >
                    <ArrowDownToLine size={18} strokeWidth={3} />
                    Inward New Stock (GRN)
                </button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Available</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                        {stock.filter(s => s.status === 'AVAILABLE').length}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">Ready for Sale</p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                            <Tag size={24} />
                        </div>
                        <span className="text-[10px] font-black text-amber-500 uppercase">Booked</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                        {stock.filter(s => s.status === 'BOOKED').length}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">Against Requisitions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group w-full">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="SEARCH BY CHASSIS, ENGINE, OR MODEL..."
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest placeholder:text-slate-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full md:w-auto">
                    {['ALL', 'AVAILABLE', 'BOOKED', 'SOLD'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                                ${
                                    statusFilter === status
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                                        : 'bg-white dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-white/5'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stock List */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-emerald-500" size={40} />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                            Auditing Physical Assets...
                        </span>
                    </div>
                ) : filteredStock.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-6 text-center px-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300">
                            <Package size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Zero Stock
                            </h3>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-2">
                                Inward vehicles from your Purchase Orders to see them here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Asset Identifiers
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Vehicle Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Aquisition Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStock.map(item => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Hash size={12} className="text-slate-400" />
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                        C: {item.chassis_number}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        E: {item.engine_number}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">
                                                    {item.vehicle_colors.vehicle_variants.vehicle_models.brands.name}{' '}
                                                    {item.vehicle_colors.vehicle_variants.vehicle_models.name}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                    {item.vehicle_colors.vehicle_variants.name} •{' '}
                                                    {item.vehicle_colors.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                                    {format(new Date(item.created_at), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={`px-3 py-1 bg-transparent rounded-full text-[10px] font-black border uppercase tracking-widest inline-flex w-fit ${getStatusColor(item.status)}`}
                                                >
                                                    {item.status}
                                                </span>
                                                {item.allocated_to?.customer_name && (
                                                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                                        <User size={10} />
                                                        <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-[120px]">
                                                            {item.allocated_to.customer_name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl transition-all">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <InwardStockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchStock}
                tenantId={tenantId || ''}
            />
        </div>
    );
}
