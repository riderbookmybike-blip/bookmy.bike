'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    FileOutput,
    Plus,
    Search,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRightCircle,
    Package,
    Calendar,
    Loader2,
    ShieldAlert,
    Bookmark,
    Zap,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import NewRequisitionModal from './components/NewRequisitionModal';

interface Requisition {
    id: string;
    display_id: string | null;
    status: string;
    source_type: string;
    booking_id: string | null;
    delivery_branch_id: string | null;
    created_at: string;
    items: Array<{
        id: string;
        cost_type: string;
        expected_amount: number;
        description: string | null;
    }>;
    quotes: Array<{ id: string; status: string }>;
    orders: Array<{ id: string }>;
}

const STATUS_COLORS: Record<string, string> = {
    QUOTING:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    ORDERED:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    RECEIVED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    CANCELLED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    QUOTING: <Clock size={14} />,
    ORDERED: <ArrowRightCircle size={14} />,
    RECEIVED: <CheckCircle2 size={14} />,
    CANCELLED: <XCircle size={14} />,
};

export default function RequisitionsPage() {
    const supabase = createClient();
    const { tenantId, tenantSlug } = useTenant();
    const params = useParams<{ slug?: string }>();
    const router = useRouter();
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRequisitions = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            let query = supabase
                .from('inv_requests')
                .select(
                    `
                    *,
                    items:inv_request_items (
                        id, cost_type, expected_amount, description
                    ),
                    quotes:inv_dealer_quotes(
                        id, status
                    ),
                    orders:inv_purchase_orders(
                        id
                    )
                `
                )
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter as any);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequisitions((data as any[]) || []);
        } catch (err) {
            console.error('Error fetching requisitions:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, statusFilter, supabase]);

    useEffect(() => {
        fetchRequisitions();
    }, [fetchRequisitions]);

    const filteredRequisitions = requisitions.filter(req => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const idMatch = (req.display_id || req.id).toLowerCase().includes(query);
        return idMatch;
    });

    const stats = {
        quoting: requisitions.filter(r => r.status === 'QUOTING').length,
        ordered: requisitions.filter(r => r.status === 'ORDERED').length,
        received: requisitions.filter(r => r.status === 'RECEIVED').length,
        booking: requisitions.filter(r => r.source_type === 'BOOKING').length,
    };

    const slugFromParams = typeof params?.slug === 'string' ? params.slug : undefined;
    const resolvedSlug = slugFromParams || tenantSlug;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <FileOutput className="text-purple-500" size={32} />
                        REQUISITIONS
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                        Demand management — direct + booking-triggered
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-95 uppercase tracking-wide shrink-0"
                >
                    <Plus size={18} strokeWidth={3} />
                    New Requisition
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Quoting', value: stats.quoting, icon: <Clock size={24} />, color: 'amber' },
                    {
                        label: 'Ordered',
                        value: stats.ordered,
                        icon: <ArrowRightCircle size={24} />,
                        color: 'indigo',
                    },
                    { label: 'Received', value: stats.received, icon: <CheckCircle2 size={24} />, color: 'emerald' },
                    { label: 'Booking-Triggered', value: stats.booking, icon: <Bookmark size={24} />, color: 'purple' },
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
                        placeholder="SEARCH BY ID..."
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase tracking-widest placeholder:text-slate-400/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    {['ALL', 'QUOTING', 'ORDERED', 'RECEIVED', 'CANCELLED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                                statusFilter === status
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg'
                                    : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'
                            }`}
                        >
                            {status.replace('_', ' ')}
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
                ) : filteredRequisitions.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-6 text-center px-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <Package size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                No Requisitions Found
                            </h3>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-2 max-w-xs">
                                Create a new requisition to track demand.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Source
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Cost Lines
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Quotes
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        PO
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Status
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
                                {filteredRequisitions.map(req => (
                                    <tr
                                        key={req.id}
                                        onClick={() =>
                                            router.push(
                                                resolvedSlug
                                                    ? `/app/${resolvedSlug}/dashboard/inventory/requisitions/${req.id}`
                                                    : `/dashboard/inventory/requisitions/${req.id}`
                                            )
                                        }
                                        className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                {req.display_id || `REQ-${req.id.slice(0, 8).toUpperCase()}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${
                                                    req.source_type === 'BOOKING'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                                }`}
                                            >
                                                {req.source_type === 'BOOKING' ? (
                                                    <Bookmark size={10} />
                                                ) : (
                                                    <Zap size={10} />
                                                )}
                                                {req.source_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                {req.items?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">
                                                {req.quotes?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                    (req.orders?.length || 0) > 0
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                                }`}
                                            >
                                                {(req.orders?.length || 0) > 0 ? 'Linked' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                                                    STATUS_COLORS[req.status] || STATUS_COLORS.QUOTING
                                                }`}
                                            >
                                                {STATUS_ICONS[req.status] || <Clock size={14} />}
                                                {req.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-bold">
                                                    {format(new Date(req.created_at), 'dd MMM yyyy')}
                                                </span>
                                            </div>
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
