'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getBookings } from '@/actions/crm';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import BookingEditorWrapper from '@/components/modules/bookings/BookingEditorWrapper';
import {
    ShoppingBag,
    CreditCard,
    Landmark,
    FileCheck,
    ShieldCheck,
    Truck,
    LayoutGrid,
    Search as SearchIcon,
    User,
    Wallet,
    Key,
    Zap,
    CheckCircle2,
    Clock,
    Circle,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';
import { useBreakpoint } from '@/hooks/useBreakpoint';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SalesOrder {
    id: string;
    displayId: string;
    customerName: string;
    customerPhone: string;
    customerLocation: string;
    productName: string;
    price: number;
    status: string;
    currentStage?: string | null;
    date: string;
    createdAt: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleVariant: string;
    vehicleColor: string;
    vehicleColorHex?: string;
    financeMode?: string | null;
    vinNumber?: string | null;
    paymentStatus?: string | null;
    allotmentStatus?: string | null;
    pdiStatus?: string | null;
    insuranceStatus?: string | null;
    registrationStatus?: string | null;
    bookingAmountReceived?: number | null;
    memberAvatarUrl?: string | null;
}

type BookingDetailTab = 'DYNAMIC' | 'FINANCE' | 'MEMBER' | 'TASKS' | 'DOCUMENTS' | 'TIMELINE' | 'NOTES' | 'HISTORY';

// ─── Stage Pipeline Config ────────────────────────────────────────────────────

const PIPELINE_STAGES = [
    { key: 'BOOKING', short: 'BK' },
    { key: 'PAYMENT', short: 'PAY' },
    { key: 'FINANCE', short: 'FIN' },
    { key: 'ALLOTMENT', short: 'ALT' },
    { key: 'PDI', short: 'PDI' },
    { key: 'INSURANCE', short: 'INS' },
    { key: 'REGISTRATION', short: 'REG' },
    { key: 'COMPLIANCE', short: 'CMP' },
    { key: 'DELIVERY', short: 'DEL' },
    { key: 'DELIVERED', short: '✓' },
] as const;

const STAGE_ORDER = PIPELINE_STAGES.map(s => s.key);

function getStagePipelineIndex(stage: string | null | undefined): number {
    if (!stage) return 0;
    const idx = STAGE_ORDER.indexOf(stage as any);
    return idx >= 0 ? idx : 0;
}

// ─── Mini stage dots bar ──────────────────────────────────────────────────────

function StagePipeline({ stage }: { stage: string | null | undefined }) {
    const current = getStagePipelineIndex(stage);
    const isDone = stage === 'DELIVERED' || stage === 'FEEDBACK';

    return (
        <div className="flex items-center gap-[3px]">
            {PIPELINE_STAGES.map((s, i) => {
                const isPast = i < current;
                const isActive = i === current && !isDone;
                const isCompleted = isDone || i <= current;
                return (
                    <div
                        key={s.key}
                        title={s.key}
                        className={[
                            'h-1.5 rounded-full transition-all',
                            i === 0 ? 'w-3' : 'w-1.5',
                            isActive
                                ? 'w-3 bg-indigo-500'
                                : isDone
                                  ? 'bg-emerald-400'
                                  : isPast
                                    ? 'bg-indigo-300'
                                    : 'bg-slate-200 dark:bg-white/10',
                        ].join(' ')}
                    />
                );
            })}
        </div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STAGE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    QUOTE: { label: 'Quote', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-white/10' },
    BOOKING: { label: 'Booked', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/15' },
    PAYMENT: { label: 'Payment', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/15' },
    FINANCE: { label: 'Finance', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/15' },
    ALLOTMENT: { label: 'Allotment', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/15' },
    PDI: { label: 'PDI', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/15' },
    INSURANCE: { label: 'Insurance', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-500/15' },
    REGISTRATION: { label: 'RTO', color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-500/15' },
    COMPLIANCE: { label: 'Compliance', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/15' },
    DELIVERY: { label: 'Delivery', color: 'text-lime-600', bg: 'bg-lime-50 dark:bg-lime-500/15' },
    DELIVERED: { label: 'Delivered ✓', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/15' },
    FEEDBACK: { label: 'Feedback', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    // Legacy quote statuses
    CONFIRMED: { label: 'Confirmed', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/15' },
    BOOKED: { label: 'Booked', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/15' },
};

function StageBadge({ stage }: { stage: string | null | undefined }) {
    const key = (stage || 'BOOKING').toUpperCase();
    const cfg = STAGE_BADGE[key] || { label: key, color: 'text-slate-500', bg: 'bg-slate-100' };
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${cfg.color} ${cfg.bg}`}
        >
            {cfg.label}
        </span>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function CustomerAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
    const initials =
        name === 'N/A'
            ? '?'
            : name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-sm shrink-0"
            />
        );
    }
    return (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-black shadow-sm shrink-0">
            {initials}
        </div>
    );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────

function ColorSwatch({ color, hex }: { color: string; hex?: string }) {
    return (
        <span className="inline-flex items-center gap-1">
            <span
                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                style={{ background: hex || '#94a3b8' }}
            />
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{color || '—'}</span>
        </span>
    );
}

// ─── Finance badge ────────────────────────────────────────────────────────────

function FinanceBadge({ mode }: { mode?: string | null }) {
    if (!mode) return null;
    const isLoan = mode === 'LOAN';
    return (
        <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isLoan ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-500 bg-slate-100 dark:bg-white/10'}`}
        >
            {isLoan ? <Landmark size={8} /> : <Wallet size={8} />}
            {isLoan ? 'Loan' : 'Cash'}
        </span>
    );
}

// ─── VIN chip ─────────────────────────────────────────────────────────────────

function VinChip({ vin }: { vin?: string | null }) {
    if (!vin)
        return (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black text-slate-300 dark:text-white/20 bg-slate-50 dark:bg-white/5 uppercase tracking-wider">
                <Key size={8} /> VIN pending
            </span>
        );
    return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 uppercase tracking-wider">
            <Key size={8} /> {vin.slice(-6)}
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesOrdersPage({
    initialOrderId,
    initialDetailTab = 'DYNAMIC',
}: {
    initialOrderId?: string;
    initialDetailTab?: BookingDetailTab;
}) {
    const { tenantId, tenantType } = useTenant();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const stageParam = (searchParams?.get('stage') || '').toUpperCase();
    const { device } = useBreakpoint();

    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBookings(tenantType === 'AUMS' ? undefined : tenantId);
            const mapped = (data || []).map((b: any) => ({
                id: b.id,
                displayId: b.displayId || b.display_id || formatDisplayId(b.id),
                customerName: b.customerName || 'N/A',
                customerPhone: b.customerPhone || '',
                customerLocation: b.customerLocation || '',
                productName: [b.vehicleBrand, b.vehicleModel, b.vehicleVariant].filter(Boolean).join(' '),
                price: Number(b.price || 0),
                status: b.status || 'BOOKED',
                currentStage: b.currentStage || null,
                date: b.date || (b.created_at ? String(b.created_at).split('T')[0] : ''),
                createdAt: b.createdAt || b.created_at || '',
                vehicleBrand: b.vehicleBrand || '',
                vehicleModel: b.vehicleModel || '',
                vehicleVariant: b.vehicleVariant || '',
                vehicleColor: b.vehicleColor || '',
                vehicleColorHex: b.vehicleColorHex || '',
                financeMode: b.financeMode || null,
                vinNumber: b.vinNumber || null,
                paymentStatus: b.paymentStatus || null,
                allotmentStatus: b.allotmentStatus || null,
                pdiStatus: b.pdiStatus || null,
                insuranceStatus: b.insuranceStatus || null,
                registrationStatus: b.registrationStatus || null,
                bookingAmountReceived: b.bookingAmountReceived || null,
                memberAvatarUrl: b.memberAvatarUrl || null,
            }));
            setOrders(mapped);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('sales-orders-live')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'crm_bookings',
                    ...(tenantType !== 'AUMS' && tenantId ? { filter: `tenant_id=eq.${tenantId}` } : {}),
                },
                () => {
                    fetchOrders();
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, fetchOrders]);

    useEffect(() => {
        if (initialOrderId) setSelectedOrderId(initialOrderId);
    }, [initialOrderId]);

    const stageFilteredOrders = useMemo(() => {
        if (!stageParam || stageParam === 'ALL') return orders;
        return orders.filter(o => (o.currentStage || o.status || '').toUpperCase() === stageParam);
    }, [orders, stageParam]);

    const filteredOrders = useMemo(
        () =>
            stageFilteredOrders.filter(
                o =>
                    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    o.customerPhone.includes(searchQuery) ||
                    formatDisplayId(o.displayId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (o.vehicleModel || '').toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [stageFilteredOrders, searchQuery]
    );

    // Stat counts by operational_stage
    const stageCount = useMemo(() => {
        const counts: Record<string, number> = {};
        stageFilteredOrders.forEach(o => {
            const s = (o.currentStage || o.status || 'BOOKING').toUpperCase();
            counts[s] = (counts[s] || 0) + 1;
        });
        return counts;
    }, [stageFilteredOrders]);

    const stageTitleMap: Record<string, { title: string; subtitle: string }> = {
        BOOKING: { title: 'Bookings Index', subtitle: 'Pipeline' },
        PAYMENT: { title: 'Payments Registry', subtitle: 'Finance' },
        FINANCE: { title: 'Finance Center', subtitle: 'Underwriting' },
        ALLOTMENT: { title: 'Allotment Hub', subtitle: 'Inventory' },
        PDI: { title: 'PDI Queue', subtitle: 'Pre-Delivery' },
        INSURANCE: { title: 'Insurance Hub', subtitle: 'Compliance' },
        REGISTRATION: { title: 'RTO Queue', subtitle: 'Registration' },
        COMPLIANCE: { title: 'Compliance Center', subtitle: 'Final Check' },
        DELIVERY: { title: 'Delivery Queue', subtitle: 'Handovers' },
        DELIVERED: { title: 'Delivery Log', subtitle: 'Completed' },
    };

    const stageTitle = stageTitleMap[stageParam]?.title || 'Sales Orders';
    const stageSubtitle = stageTitleMap[stageParam]?.subtitle || 'ORDER_COLLECTION';

    const stats = [
        {
            label: 'Total Orders',
            value: stageFilteredOrders.length,
            icon: ShoppingBag,
            color: 'indigo' as const,
            trend: '+4.1%',
        },
        {
            label: 'Allotment',
            value: stageCount['ALLOTMENT'] || 0,
            icon: Key,
            color: 'amber' as const,
        },
        {
            label: 'PDI',
            value: stageCount['PDI'] || 0,
            icon: FileCheck,
            color: 'blue' as const,
        },
        {
            label: 'Compliance',
            value: (stageCount['COMPLIANCE'] || 0) + (stageCount['INSURANCE'] || 0) + (stageCount['REGISTRATION'] || 0),
            icon: ShieldCheck,
            color: 'emerald' as const,
        },
        {
            label: 'Delivered',
            value: stageCount['DELIVERED'] || 0,
            icon: Truck,
            color: 'rose' as const,
        },
    ];

    const handleOpenOrder = (orderId: string) => {
        setSelectedOrderId(orderId);
        if (slug) router.push(`/app/${slug}/sales-orders/${orderId}`);
    };

    const handleCloseDetail = () => {
        setSelectedOrderId(null);
        if (slug) {
            const stageQuery = stageParam ? `?stage=${stageParam}` : '';
            router.push(`/app/${slug}/sales-orders${stageQuery}`);
        }
    };

    const effectiveView = device === 'phone' ? 'list' : view;

    // ── Formatters ──────────────────────────────────────────────────────────────

    const fmtDate = (iso: string) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return iso;
        }
    };

    // ── List-only landing view ──────────────────────────────────────────────────

    if (!selectedOrderId) {
        return (
            <div className="h-full bg-[#f8fafc] dark:bg-[#0b0d10]">
                <ModuleLanding
                    title={stageTitle}
                    subtitle={stageSubtitle}
                    onNew={() => toast.info('Initiate from Quotes module')}
                    searchPlaceholder={`Search ${stageTitle}...`}
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={effectiveView}
                    onViewChange={setView}
                    device={device}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-24 text-slate-300 text-sm font-bold tracking-widest uppercase animate-pulse">
                            Loading orders…
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                            <ShoppingBag size={32} className="opacity-20" />
                            <p className="text-[11px] font-black uppercase tracking-widest">No orders found</p>
                        </div>
                    ) : effectiveView === 'grid' ? (
                        // ── Grid cards ──────────────────────────────────────────
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => handleOpenOrder(order.id)}
                                    className="group bg-white dark:bg-[#13151a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:border-indigo-400/30 hover:-translate-y-0.5 shadow-sm"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <CustomerAvatar
                                                name={order.customerName}
                                                avatarUrl={order.memberAvatarUrl}
                                            />
                                            <div>
                                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                                    {formatDisplayId(order.displayId)}
                                                </div>
                                                <div className="text-[9px] font-semibold text-slate-400 mt-0.5">
                                                    {fmtDate(order.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                                ₹{order.price.toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer */}
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5 truncate">
                                        {order.customerName}
                                    </h3>
                                    {order.customerPhone && (
                                        <div className="text-[10px] font-bold text-slate-400 tracking-widest mb-3">
                                            {order.customerPhone}
                                            {order.customerLocation && order.customerLocation !== 'Location N/A' && (
                                                <> · {order.customerLocation}</>
                                            )}
                                        </div>
                                    )}

                                    {/* Vehicle */}
                                    <div className="text-[10px] font-bold text-slate-900 dark:text-white/80 uppercase tracking-widest truncate mb-1">
                                        {[order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
                                            .filter(Boolean)
                                            .join(' ')}
                                    </div>
                                    <ColorSwatch color={order.vehicleColor} hex={order.vehicleColorHex} />

                                    {/* Pipeline bar */}
                                    <div className="mt-4 mb-3">
                                        <StagePipeline stage={order.currentStage || order.status} />
                                    </div>

                                    {/* Footer badges */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                                        <StageBadge stage={order.currentStage || order.status} />
                                        <div className="flex items-center gap-1.5">
                                            <FinanceBadge mode={order.financeMode} />
                                            <VinChip vin={order.vinNumber} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // ── Enriched table ──────────────────────────────────────
                        <div className="bg-white dark:bg-[#13151a] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                                        <th className="px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Client Node
                                        </th>
                                        <th className="px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Configuration
                                        </th>
                                        <th className="px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Stage Pipeline
                                        </th>
                                        <th className="px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                                            Valuation
                                        </th>
                                        <th className="px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                                            Mode / VIN
                                        </th>
                                        <th className="px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr
                                            key={order.id}
                                            onClick={() => handleOpenOrder(order.id)}
                                            className="group hover:bg-indigo-50/30 dark:hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0"
                                        >
                                            {/* CLIENT NODE */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <CustomerAvatar
                                                        name={order.customerName}
                                                        avatarUrl={order.memberAvatarUrl}
                                                    />
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[140px]">
                                                            {order.customerName}
                                                        </div>
                                                        {order.customerPhone && order.customerPhone !== 'N/A' && (
                                                            <div className="text-[9px] font-bold text-slate-400 tracking-wider">
                                                                {order.customerPhone}
                                                            </div>
                                                        )}
                                                        {order.customerLocation &&
                                                            order.customerLocation !== 'Location N/A' && (
                                                                <div className="text-[9px] font-semibold text-slate-400 truncate max-w-[130px]">
                                                                    📍 {order.customerLocation}
                                                                </div>
                                                            )}
                                                        <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">
                                                            {formatDisplayId(order.displayId)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* CONFIGURATION */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <div className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest truncate max-w-[200px]">
                                                        {[order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
                                                            .filter(Boolean)
                                                            .join(' ') || '—'}
                                                    </div>
                                                    <ColorSwatch
                                                        color={order.vehicleColor}
                                                        hex={order.vehicleColorHex}
                                                    />
                                                    <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                                                        {fmtDate(order.createdAt)}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* STAGE PIPELINE */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col gap-1.5">
                                                    <StagePipeline stage={order.currentStage || order.status} />
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {(order.currentStage || order.status || '').replace('_', ' ')}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* VALUATION */}
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                                    ₹{order.price.toLocaleString('en-IN')}
                                                </div>
                                                {order.bookingAmountReceived && order.bookingAmountReceived > 0 && (
                                                    <div className="text-[9px] font-semibold text-emerald-600 tabular-nums mt-0.5">
                                                        +₹{Number(order.bookingAmountReceived).toLocaleString('en-IN')}{' '}
                                                        rcvd
                                                    </div>
                                                )}
                                            </td>

                                            {/* FINANCE MODE / VIN */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <FinanceBadge mode={order.financeMode} />
                                                    <VinChip vin={order.vinNumber} />
                                                </div>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-5 py-3.5 text-center">
                                                <StageBadge stage={order.currentStage || order.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModuleLanding>
            </div>
        );
    }

    // ── Master-detail split view (when an order is selected) ─────────────────

    return (
        <div className="h-full bg-white dark:bg-[#0b0d10] flex overflow-hidden font-sans">
            <MasterListDetailLayout
                mode="list-detail"
                listPosition="left"
                device={device}
                hasActiveDetail={!!selectedOrderId}
                onBack={handleCloseDetail}
            >
                {/* LEFT: order list */}
                <div className="h-full flex flex-col bg-[#fdfdfd] dark:bg-[#0f1117] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-4 border-b border-slate-200 dark:border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                                Orders <span className="text-indigo-600">Core</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all text-slate-400"
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-7 pr-3 text-[10px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500/50 shadow-sm"
                                placeholder="Search name, phone, model…"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {filteredOrders.map(order => {
                            const isActive = selectedOrderId === order.id;
                            const stage = order.currentStage || order.status;
                            return (
                                <button
                                    key={order.id}
                                    onClick={() => handleOpenOrder(order.id)}
                                    className={`w-full text-left rounded-xl p-3 transition-all border ${
                                        isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
                                            : 'bg-white dark:bg-white/[0.02] border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <CustomerAvatar name={order.customerName} avatarUrl={order.memberAvatarUrl} />
                                        <div className="min-w-0 flex-1">
                                            <div
                                                className={`text-[10px] font-black uppercase tracking-tight truncate ${isActive ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}
                                            >
                                                {order.customerName}
                                            </div>
                                            <div
                                                className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}
                                            >
                                                {formatDisplayId(order.displayId)}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-900 dark:text-white tabular-nums shrink-0">
                                            ₹{Math.round(order.price / 1000)}k
                                        </div>
                                    </div>

                                    <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 truncate">
                                        {order.vehicleModel || '—'} · {order.vehicleColor || '—'}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <StagePipeline stage={stage} />
                                        <StageBadge stage={stage} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: detail panel */}
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-white dark:bg-[#0b0d10]">
                    <BookingEditorWrapper
                        bookingId={selectedOrderId}
                        onClose={handleCloseDetail}
                        onRefresh={fetchOrders}
                        defaultTab={initialDetailTab}
                    />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
