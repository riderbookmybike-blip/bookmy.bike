'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Warehouse,
    Search,
    ChevronRight,
    CheckCircle2,
    Package,
    Hash,
    Loader2,
    ShieldCheck,
    Calendar,
    Tag,
    Truck,
    AlertTriangle,
    ArrowRight,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { getAvailableStock } from '@/actions/inventory';

interface StockItem {
    id: string;
    sku_id: string;
    tenant_id: string;
    branch_id: string;
    is_shared: boolean;
    locked_by_tenant_id: string | null;
    chassis_number: string;
    engine_number: string;
    status: string;
    qc_status: string;
    created_at: string;
    sku: { name: string | null } | { name: string | null }[] | null;
    po: { total_po_value: number } | { total_po_value: number }[] | null;
}

const STATUS_COLORS: Record<string, string> = {
    AVAILABLE:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    SOFT_LOCKED:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    HARD_LOCKED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    SOLD: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
    IN_TRANSIT:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    AVAILABLE: <CheckCircle2 size={14} />,
    SOFT_LOCKED: <Tag size={14} />,
    HARD_LOCKED: <AlertTriangle size={14} />,
    SOLD: <Package size={14} />,
    IN_TRANSIT: <Truck size={14} />,
};

const parseSkuName = (value: StockItem['sku']) => {
    if (!value) return '';
    if (Array.isArray(value)) return value[0]?.name || '';
    return value.name || '';
};

const parsePoValue = (value: StockItem['po']) => {
    if (!value) return null;
    if (Array.isArray(value)) return value[0]?.total_po_value || null;
    return value.total_po_value || null;
};

export default function StockPage() {
    const { tenantId, tenantSlug } = useTenant();
    const params = useParams<{ slug?: string }>();
    const router = useRouter();
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchStockData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const result = await getAvailableStock(tenantId, {
                include_shared: true,
            });
            if (result.success && result.data) {
                setStock(result.data as StockItem[]);
            }
        } catch (err) {
            console.error('Error fetching stock:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchStockData();
    }, [fetchStockData]);

    const filtered = stock.filter(item => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            item.chassis_number?.toLowerCase().includes(q) ||
            item.engine_number?.toLowerCase().includes(q) ||
            parseSkuName(item.sku).toLowerCase().includes(q)
        );
    });

    const filteredByStatus = statusFilter === 'ALL' ? filtered : filtered.filter(item => item.status === statusFilter);

    const stats = {
        available: stock.filter(s => s.status === 'AVAILABLE').length,
        reserved: stock.filter(s => s.status === 'SOFT_LOCKED' || s.status === 'HARD_LOCKED').length,
        inTransit: stock.filter(s => s.status === 'IN_TRANSIT').length,
        total: stock.length,
    };

    const resolvedSlug = tenantSlug || (typeof params?.slug === 'string' ? params.slug : undefined);
    const ordersBasePath = resolvedSlug
        ? `/app/${resolvedSlug}/dashboard/inventory/orders`
        : '/dashboard/inventory/orders';
    const stockBasePath = resolvedSlug
        ? `/app/${resolvedSlug}/dashboard/inventory/stock`
        : '/dashboard/inventory/stock';

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
                    onClick={() => router.push(ordersBasePath)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 uppercase tracking-wide shrink-0"
                >
                    <ArrowRight size={18} strokeWidth={3} />
                    Inward via GRN
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Available', value: stats.available, icon: <CheckCircle2 size={24} />, color: 'emerald' },
                    { label: 'Reserved', value: stats.reserved, icon: <Tag size={24} />, color: 'amber' },
                    { label: 'In Transit', value: stats.inTransit, icon: <Truck size={24} />, color: 'indigo' },
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="SEARCH BY CHASSIS, ENGINE, OR SKU..."
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all uppercase tracking-widest placeholder:text-slate-400/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    {['ALL', 'AVAILABLE', 'SOFT_LOCKED', 'HARD_LOCKED', 'IN_TRANSIT', 'SOLD'].map(status => (
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
                        <Loader2 className="animate-spin text-emerald-500" size={40} />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                            Auditing Physical Assets...
                        </span>
                    </div>
                ) : filteredByStatus.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-6 text-center px-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <Package size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Zero Stock
                            </h3>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-2 max-w-xs">
                                Inward vehicles via GRN from your Purchase Orders.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Chassis / Engine
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        SKU
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Dealer Price
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Inwarded
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredByStatus.map(item => (
                                    <tr
                                        key={item.id}
                                        onClick={() => router.push(`${stockBasePath}/${item.id}`)}
                                        className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Hash size={12} className="text-slate-400" />
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                        {item.chassis_number}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        {item.engine_number}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[180px] block">
                                                {parseSkuName(item.sku) || item.sku_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                {parsePoValue(item.po)
                                                    ? `₹${Number(parsePoValue(item.po)).toLocaleString()}`
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[item.status] || STATUS_COLORS.AVAILABLE}`}
                                            >
                                                {STATUS_ICONS[item.status] || <Package size={14} />}
                                                {item.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-bold">
                                                    {format(new Date(item.created_at), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all">
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
        </div>
    );
}
