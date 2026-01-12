'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    FileOutput,
    Plus,
    Search,
    Filter,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRightCircle,
    Package,
    Users,
    Calendar,
    Loader2
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { format } from 'date-fns';
import NewRequisitionModal from './components/NewRequisitionModal';

interface RequisitionItem {
    id: string;
    sku_id: string;
    quantity: number;
    notes: string;
    vehicle_colors: {
        id: string;
        name: string;
        vehicle_variants: {
            id: string;
            name: string;
            vehicle_models: {
                id: string;
                name: string;
                brands: {
                    id: string;
                    name: string;
                    logo_svg: string;
                }
            }
        }
    }
}

interface Requisition {
    id: string;
    customer_name: string;
    status: string;
    created_at: string;
    requested_by: string;
    items: RequisitionItem[];
}

export default function RequisitionsPage() {
    const supabase = createClient();
    const { tenantId } = useTenant();
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (tenantId) {
            fetchRequisitions();
        }
    }, [tenantId, statusFilter]);

    const fetchRequisitions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('purchase_requisitions')
                .select(`
                    *,
                    items:purchase_requisition_items (
                        *,
                        vehicle_colors (
                            id,
                            name,
                            vehicle_variants (
                                id,
                                name,
                                vehicle_models (
                                    id,
                                    name,
                                    brands (id, name, logo_svg)
                                )
                            )
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequisitions(data || []);
        } catch (err) {
            console.error('Error fetching requisitions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Derived filtering for search
    const filteredRequisitions = requisitions.filter(req => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const customerMatch = req.customer_name?.toLowerCase().includes(query);
        const idMatch = req.id.toLowerCase().includes(query);
        const vehicleMatch = req.items.some(item =>
            item.vehicle_colors.vehicle_variants.vehicle_models.name.toLowerCase().includes(query) ||
            item.vehicle_colors.vehicle_variants.name.toLowerCase().includes(query)
        );

        return customerMatch || idMatch || vehicleMatch;
    });

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
            case 'REJECTED': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
            case 'CONVERTED': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
            default: return 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return <Clock size={14} />;
            case 'APPROVED': return <CheckCircle2 size={14} />;
            case 'REJECTED': return <XCircle size={14} />;
            case 'CONVERTED': return <ArrowRightCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Top Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <FileOutput className="text-purple-500" size={32} />
                        VEHICLE REQUISITIONS
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                        Internal demand management for sales teams
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-95 uppercase tracking-wide shrink-0 transition-transform"
                >
                    <Plus size={18} strokeWidth={3} />
                    New Requisition
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                            <Clock size={24} />
                        </div>
                        <span className="text-[10px] font-black text-amber-500 uppercase">Pending</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                        {requisitions.filter(r => r.status === 'PENDING').length}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">Awaiting Approval</p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                            <ArrowRightCircle size={24} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase">Converted</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                        {requisitions.filter(r => r.status === 'CONVERTED').length}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">Moved to PO</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="SEARCH BY CUSTOMER OR REQUISITION ID..."
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase tracking-widest placeholder:text-slate-400/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    {['ALL', 'PENDING', 'APPROVED', 'CONVERTED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                                ${statusFilter === status
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg'
                                    : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* List View */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-indigo-500" size={40} />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching Demand Data...</span>
                    </div>
                ) : requisitions.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-6 text-center px-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <Package size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">No Requisitions Found</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-2 max-w-xs">Raise a new requisition to start tracking vehicle demand from your sales team.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Requisition Details</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle Requested</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequisitions.map((req) => (
                                    <tr key={req.id} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">REQ-{req.id.slice(0, 8).toUpperCase()}</span>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Calendar size={12} />
                                                    <span className="text-[10px] font-bold">{format(new Date(req.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                                    <Users size={16} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[150px]">
                                                    {req.customer_name || 'Generic Stock'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.items.map((item, idx) => (
                                                <div key={item.id} className="flex flex-col mb-2 last:mb-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">
                                                            {item.vehicle_colors.vehicle_variants.vehicle_models.brands.name} {item.vehicle_colors.vehicle_variants.vehicle_models.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                        {item.vehicle_colors.vehicle_variants.name} • {item.vehicle_colors.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                {req.items.reduce((sum, item) => sum + item.quantity, 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(req.status)}`}>
                                                {getStatusIcon(req.status)}
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
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

            <NewRequisitionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchRequisitions}
                tenantId={tenantId || ''}
            />
        </div>
    );
}
