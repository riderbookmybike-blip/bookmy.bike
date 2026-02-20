'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    ShoppingBag,
    Plus,
    Search,
    Truck,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    Package,
    Calendar,
    Loader2,
    Hash,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import CreatePOModal from './components/CreatePOModal';

interface POItem {
    id: string;
    sku_id: string;
    ordered_qty: number;
    received_qty: number;
    status: string;
}

interface PurchaseOrder {
    id: string;
    order_number: string;
    display_id: string | null;
    vendor_name: string;
    status: string;
    transporter_name: string | null;
    docket_number: string | null;
    expected_date: string | null;
    requisition_id: string | null;
    created_at: string;
    items: POItem[];
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
    ORDERED:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    PARTIALLY_RECEIVED:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    COMPLETED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    CANCELLED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    DRAFT: <Clock size={14} />,
    ORDERED: <Truck size={14} />,
    PARTIALLY_RECEIVED: <Package size={14} />,
    COMPLETED: <CheckCircle2 size={14} />,
    CANCELLED: <XCircle size={14} />,
};

export default function OrdersPage() {
    const supabase = createClient();
    const { tenantId } = useTenant();
    const router = useRouter();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchOrders = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            let query = (supabase as any)
                .from('inv_purchase_orders')
                .select(
                    `
                    *,
                    items:inv_purchase_order_items (
                        id, sku_id, ordered_qty, received_qty, status
                    )
                `
                )
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders((data as PurchaseOrder[]) || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, statusFilter, supabase]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filtered = orders.filter(o => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            o.order_number?.toLowerCase().includes(q) ||
            (o.display_id || '').toLowerCase().includes(q) ||
            (o.vendor_name || '').toLowerCase().includes(q)
        );
    });

    const stats = {
        ordered: orders.filter(o => o.status === 'ORDERED').length,
        partial: orders.filter(o => o.status === 'PARTIALLY_RECEIVED').length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        total: orders.length,
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <ShoppingBag className="text-indigo-500" size={32} />
                        PURCHASE ORDERS
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                        Supply chain procurement tracking
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-95 uppercase tracking-wide shrink-0"
                >
                    <Plus size={18} strokeWidth={3} />
                    New PO
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Ordered', value: stats.ordered, icon: <Truck size={24} />, color: 'indigo' },
                    { label: 'Partial', value: stats.partial, icon: <Package size={24} />, color: 'amber' },
                    { label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={24} />, color: 'emerald' },
                    { label: 'Total', value: stats.total, icon: <Hash size={24} />, color: 'slate' },
                ].map(s => (
                    <div
                        key={s.label}
                        className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-${s.color}-500/10 rounded-2xl text-${s.color}-500`}>{s.icon}</div>
                            <span className={`text-[10px] font-black text-${s.color}-500 uppercase`}>{s.label}</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group w-full">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="SEARCH BY PO NUMBER OR VENDOR..."
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase tracking-widest placeholder:text-slate-400/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    {['ALL', 'ORDERED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                                statusFilter === status
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg'
                                    : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'
                            }`}
                        >
                            {status.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-indigo-500" size={40} />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                            Loading...
                        </span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-6 text-center px-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <ShoppingBag size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                No Purchase Orders
                            </h3>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-2 max-w-xs">
                                Create a PO from pending requisitions.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        PO #
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Vendor
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Items
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Received
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Expected
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Created
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(po => {
                                    const totalOrdered = po.items?.reduce((s, i) => s + i.ordered_qty, 0) || 0;
                                    const totalReceived = po.items?.reduce((s, i) => s + (i.received_qty || 0), 0) || 0;
                                    return (
                                        <tr
                                            key={po.id}
                                            onClick={() => router.push(`/dashboard/inventory/orders/${po.id}`)}
                                            className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tighter">
                                                    {po.order_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[150px] block">
                                                    {po.vendor_name || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                                    {totalOrdered}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`text-sm font-black ${totalReceived >= totalOrdered ? 'text-emerald-600' : 'text-slate-400'}`}
                                                >
                                                    {totalReceived}/{totalOrdered}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[po.status] || STATUS_COLORS.DRAFT}`}
                                                >
                                                    {STATUS_ICONS[po.status] || <Clock size={14} />}
                                                    {po.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {po.expected_date ? (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Calendar size={12} />
                                                        <span className="text-[10px] font-bold">
                                                            {format(new Date(po.expected_date), 'dd MMM')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Calendar size={12} />
                                                    <span className="text-[10px] font-bold">
                                                        {format(new Date(po.created_at), 'dd MMM yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreatePOModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchOrders}
                tenantId={tenantId || ''}
            />
        </div>
    );
}
