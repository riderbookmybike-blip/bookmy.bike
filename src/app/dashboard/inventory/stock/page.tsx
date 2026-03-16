'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    LayoutGrid,
    User,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { getAvailableStock } from '@/actions/inventory';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';

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
    const { device } = useBreakpoint();
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchStockData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const result = await getAvailableStock(tenantId, { include_shared: true });
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

    const filtered = useMemo(
        () =>
            stock.filter(item => {
                const q = searchQuery.toLowerCase().trim();
                const matchesSearch =
                    !q ||
                    item.chassis_number?.toLowerCase().includes(q) ||
                    item.engine_number?.toLowerCase().includes(q) ||
                    parseSkuName(item.sku).toLowerCase().includes(q);
                const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
                return matchesSearch && matchesStatus;
            }),
        [stock, searchQuery, statusFilter]
    );

    const stats = [
        {
            label: 'Available',
            value: stock.filter(s => s.status === 'AVAILABLE').length,
            icon: CheckCircle2,
            color: 'emerald' as const,
        },
        {
            label: 'Reserved',
            value: stock.filter(s => s.status === 'SOFT_LOCKED' || s.status === 'HARD_LOCKED').length,
            icon: Tag,
            color: 'amber' as const,
        },
        {
            label: 'In Transit',
            value: stock.filter(s => s.status === 'IN_TRANSIT').length,
            icon: Truck,
            color: 'indigo' as const,
        },
        { label: 'Total Units', value: stock.length, icon: Warehouse, color: 'indigo' as const },
    ];

    const slugFromParams = typeof params?.slug === 'string' ? params.slug : undefined;
    const resolvedSlug = slugFromParams || tenantSlug;
    const ordersBasePath = resolvedSlug
        ? `/app/${resolvedSlug}/dashboard/inventory/orders`
        : '/dashboard/inventory/orders';
    const stockBasePath = resolvedSlug
        ? `/app/${resolvedSlug}/dashboard/inventory/stock`
        : '/dashboard/inventory/stock';

    const effectiveView = device === 'phone' ? 'list' : view;

    return (
        <div className="h-full bg-[#f8fafc]">
            <ModuleLanding
                title="Live Inventory"
                subtitle="PHYSICAL_ASSETS"
                onNew={() => router.push(ordersBasePath)}
                searchPlaceholder="Search Inventory Node..."
                onSearch={setSearchQuery}
                statsContent={<StatsHeader stats={stats} device={device} />}
                view={effectiveView}
                onViewChange={setView}
                device={device}
            >
                <div className="space-y-4">
                    {/* Filter Chips */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg w-fit overflow-x-auto no-scrollbar">
                        {['ALL', 'AVAILABLE', 'SOFT_LOCKED', 'HARD_LOCKED', 'IN_TRANSIT', 'SOLD'].map(chip => (
                            <button
                                key={chip}
                                onClick={() => setStatusFilter(chip)}
                                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    statusFilter === chip
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {chip.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Auditing Physical Registry...
                            </span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <Package size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                No matching assets found
                            </p>
                        </div>
                    ) : effectiveView === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filtered.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => router.push(`${stockBasePath}/${item.id}`)}
                                    className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:border-indigo-500/30 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 truncate max-w-[150px]">
                                            {item.chassis_number}
                                        </div>
                                        <div className="text-slate-900 font-black text-xs tabular-nums">
                                            {parsePoValue(item.po)
                                                ? `₹${Math.round(Number(parsePoValue(item.po)) / 1000)}k`
                                                : '—'}
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {parseSkuName(item.sku) || 'Product Specs Pending'}
                                    </h3>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                                        Engine: {item.engine_number}
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div
                                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                                item.status === 'AVAILABLE'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : item.status === 'SOLD'
                                                      ? 'bg-slate-50 text-slate-400 border-slate-100'
                                                      : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}
                                        >
                                            {item.status.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {format(new Date(item.created_at), 'dd MMM yy')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Asset Chassis/Engine
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Inventory SKU
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                                            Valuation
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(item => (
                                        <tr
                                            key={item.id}
                                            onClick={() => router.push(`${stockBasePath}/${item.id}`)}
                                            className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                        {item.chassis_number}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Eng: {item.engine_number}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-tight">
                                                {parseSkuName(item.sku) || 'SPECS_NOT_FOUND'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-slate-900 tabular-nums">
                                                {parsePoValue(item.po)
                                                    ? `₹${Number(parsePoValue(item.po)).toLocaleString()}`
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div
                                                    className={`px-2.5 py-1 rounded inline-block text-[9px] font-black uppercase border ${
                                                        item.status === 'AVAILABLE'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}
                                                >
                                                    {item.status.replace(/_/g, ' ')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </ModuleLanding>
        </div>
    );
}
