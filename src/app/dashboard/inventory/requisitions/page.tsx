'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    User2,
    CalendarClock,
    Flag,
    X,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import NewRequisitionModal from './components/NewRequisitionModal';
import { fetchSkuDisplayMap, type SkuDisplayCard } from '@/lib/inventory/skuDisplay';

interface Requisition {
    id: string;
    display_id: string | null;
    sku_id: string | null;
    status: string;
    source_type: string;
    booking_id: string | null;
    delivery_branch_id: string | null;
    created_by: string | null;
    created_at: string;
    booking?: {
        id: string;
        display_id: string | null;
        delivery_date: string | null;
        qty: number | null;
        status: string | null;
    } | null;
    delivery_branch?: {
        id: string;
        name: string | null;
        city: string | null;
    } | null;
    items: Array<{
        id: string;
        cost_type: string;
        expected_amount: number;
        description: string | null;
    }>;
    quotes: Array<{ id: string; status: string }>;
    orders: Array<{
        id: string;
        display_id: string | null;
        po_status: string;
        expected_delivery_date: string | null;
        id_tenants?: { name: string | null } | { name: string | null }[] | null;
    }>;
}

type UnitBreakdown = {
    available: number;
    transit: number;
    order: number;
    requisition: number;
};

type GroupMode = 'NONE' | 'BRAND' | 'SUPPLIER';
type GroupNode = {
    key: string;
    label: string;
    count: number;
    children: GroupNode[];
};

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

type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CLOSED' | 'CANCELLED';

const PRIORITY_BADGES: Record<RequestPriority, string> = {
    LOW: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10',
    MEDIUM: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20',
    HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    URGENT: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
    CLOSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    CANCELLED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
};

function parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const parsedIso = parseISO(value);
    if (isValid(parsedIso)) return parsedIso;
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : null;
}

function formatDateValue(value?: string | null, fallback = 'Not Scheduled'): string {
    const parsed = parseDate(value);
    if (!parsed) return fallback;
    return format(parsed, 'dd MMM yyyy');
}

function formatTripletId(raw?: string | null): string {
    if (!raw) return 'NA';
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 9)}`;
}

function resolvePriority(req: Requisition): RequestPriority {
    if (req.status === 'CANCELLED') return 'CANCELLED';
    if (req.status === 'RECEIVED') return 'CLOSED';

    const poSchedule = req.orders?.find(order => !!order.expected_delivery_date)?.expected_delivery_date || null;
    const scheduledDate = poSchedule || req.booking?.delivery_date || null;
    const parsedSchedule = parseDate(scheduledDate);

    if (parsedSchedule) {
        const dayDelta = differenceInCalendarDays(parsedSchedule, new Date());
        if (dayDelta <= 2) return 'URGENT';
        if (dayDelta <= 7) return 'HIGH';
        if (dayDelta <= 15) return 'MEDIUM';
        return 'LOW';
    }

    if (req.source_type === 'BOOKING') return 'HIGH';
    return 'MEDIUM';
}

export default function RequisitionsPage() {
    const supabase = createClient();
    const { tenantId, tenantSlug } = useTenant();
    const params = useParams<{ slug?: string }>();
    const router = useRouter();
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [groupMode, setGroupMode] = useState<GroupMode>('NONE');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creatorNameMap, setCreatorNameMap] = useState<Record<string, string>>({});
    const [skuMap, setSkuMap] = useState<Record<string, SkuDisplayCard>>({});
    const [skuUnitMap, setSkuUnitMap] = useState<Record<string, UnitBreakdown>>({});
    const [previewSku, setPreviewSku] = useState<{ label: string; image: string } | null>(null);

    const fetchRequisitions = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            let query = supabase
                .from('inv_requests')
                .select(
                    `
                    id, display_id, sku_id, status, source_type, booking_id, delivery_branch_id, created_by, created_at,
                    items:inv_request_items (
                        id, cost_type, expected_amount, description
                    ),
                    quotes:inv_dealer_quotes(
                        id, status
                    ),
                    orders:inv_purchase_orders(
                        id, display_id, po_status, expected_delivery_date,
                        id_tenants:dealer_tenant_id(name)
                    ),
                    booking:crm_bookings(
                        id, display_id, delivery_date, qty, status
                    ),
                    delivery_branch:id_locations!inv_requests_delivery_branch_id_fkey(
                        id, name, city
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

            const rows = (data as unknown as Requisition[]) || [];
            setRequisitions(rows);

            const skuIds = Array.from(new Set(rows.map(row => row.sku_id).filter(Boolean))) as string[];
            if (skuIds.length > 0) {
                const nextSkuMap = await fetchSkuDisplayMap(supabase, skuIds);
                setSkuMap(nextSkuMap);

                const { data: allReqRows } = await supabase
                    .from('inv_requests')
                    .select('id, sku_id, status')
                    .eq('tenant_id', tenantId)
                    .in('sku_id', skuIds);

                const typedReqRows =
                    (allReqRows as Array<{ id: string; sku_id: string | null; status: string | null }>) || [];
                const requestIds = typedReqRows.map(r => r.id);

                const { data: poRows } =
                    requestIds.length > 0
                        ? await supabase
                              .from('inv_purchase_orders')
                              .select('request_id, po_status')
                              .in('request_id', requestIds)
                        : ({ data: [] } as any);

                const { data: stockRows } = await supabase
                    .from('inv_stock')
                    .select('sku_id, status')
                    .eq('tenant_id', tenantId)
                    .in('sku_id', skuIds);

                const reqIdToSku = new Map<string, string>();
                for (const req of typedReqRows) {
                    if (req.id && req.sku_id) reqIdToSku.set(req.id, req.sku_id);
                }

                const nextUnits: Record<string, UnitBreakdown> = {};
                for (const skuId of skuIds) {
                    nextUnits[skuId] = { available: 0, transit: 0, order: 0, requisition: 0 };
                }

                for (const req of typedReqRows) {
                    if (!req.sku_id || !nextUnits[req.sku_id]) continue;
                    const reqStatus = (req.status || '').toUpperCase();
                    if (reqStatus === 'QUOTING') nextUnits[req.sku_id].requisition += 1;
                }

                for (const po of (poRows || []) as Array<{ request_id: string | null; po_status: string | null }>) {
                    if (!po.request_id) continue;
                    const skuId = reqIdToSku.get(po.request_id);
                    if (!skuId || !nextUnits[skuId]) continue;
                    const poStatus = (po.po_status || '').toUpperCase();
                    const isTransit =
                        poStatus.includes('TRANSIT') ||
                        poStatus.includes('DISPATCH') ||
                        poStatus.includes('SHIPPED') ||
                        poStatus.includes('IN_ROUTE');
                    const isClosed = poStatus.includes('RECEIVED') || poStatus.includes('CANCEL');
                    if (isTransit) nextUnits[skuId].transit += 1;
                    if (!isClosed && !isTransit) nextUnits[skuId].order += 1;
                }

                for (const stock of (stockRows || []) as Array<{ sku_id: string | null; status: string | null }>) {
                    if (!stock.sku_id || !nextUnits[stock.sku_id]) continue;
                    const stockStatus = (stock.status || '').toUpperCase();
                    const isUnavailable =
                        stockStatus.includes('SOLD') ||
                        stockStatus.includes('DELIVERED') ||
                        stockStatus.includes('RETURN') ||
                        stockStatus.includes('SCRAP') ||
                        stockStatus.includes('CANCEL') ||
                        stockStatus.includes('TRANSIT');
                    if (!isUnavailable) nextUnits[stock.sku_id].available += 1;
                }

                setSkuUnitMap(nextUnits);
            } else {
                setSkuMap({});
                setSkuUnitMap({});
            }

            const creatorIds = Array.from(new Set(rows.map(row => row.created_by).filter(Boolean))) as string[];
            if (creatorIds.length > 0) {
                const { data: membersData, error: membersError } = await supabase
                    .from('id_members')
                    .select('id, full_name')
                    .in('id', creatorIds);

                if (!membersError && Array.isArray(membersData)) {
                    const nextMap: Record<string, string> = {};
                    for (const member of membersData as Array<{ id: string; full_name: string | null }>) {
                        if (member.id && member.full_name) nextMap[member.id] = member.full_name;
                    }
                    setCreatorNameMap(nextMap);
                } else {
                    setCreatorNameMap({});
                }
            } else {
                setCreatorNameMap({});
            }
        } catch (err) {
            console.error('Error fetching requisitions:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, statusFilter, supabase]);

    useEffect(() => {
        fetchRequisitions();
    }, [fetchRequisitions]);

    const requisitionsWithContext = useMemo(() => {
        return requisitions.map(req => {
            const poSchedule =
                req.orders?.find(order => !!order.expected_delivery_date)?.expected_delivery_date || null;
            const scheduleDate = poSchedule || req.booking?.delivery_date || null;
            const scheduleSource = poSchedule ? 'PO ETA' : req.booking?.delivery_date ? 'Booking' : 'Not Set';
            const createdByName =
                (req.created_by && creatorNameMap[req.created_by]) ||
                (req.created_by ? `User ${req.created_by.slice(0, 6).toUpperCase()}` : 'System');
            const bookingLabel =
                req.booking?.display_id ||
                (req.booking_id ? `BK-${req.booking_id.slice(0, 8).toUpperCase()}` : 'Not Applicable');
            const deliveryBranchLabel = req.delivery_branch?.name || 'Branch Not Set';
            const priority = resolvePriority(req);

            return {
                ...req,
                createdByName,
                bookingLabel,
                deliveryBranchLabel,
                scheduleDate,
                scheduleSource,
                priority,
            };
        });
    }, [requisitions, creatorNameMap]);

    const filteredRequisitions = requisitionsWithContext.filter(req => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const searchableText = [
            req.display_id || req.id,
            req.bookingLabel,
            req.createdByName,
            req.deliveryBranchLabel,
            req.priority,
            req.source_type,
            req.status,
        ]
            .join(' ')
            .toLowerCase();
        return searchableText.includes(query);
    });

    const getSupplierName = useCallback((req: Requisition) => {
        const primaryOrder = req.orders?.[0];
        const supplierRef = Array.isArray(primaryOrder?.id_tenants)
            ? primaryOrder?.id_tenants?.[0]
            : primaryOrder?.id_tenants;
        return supplierRef?.name || 'Pending';
    }, []);

    const groupedNodes = useMemo(() => {
        if (groupMode === 'NONE') return [] as GroupNode[];

        const root = new Map<string, GroupNode>();
        for (const req of filteredRequisitions) {
            const sku = req.sku_id ? skuMap[req.sku_id] : undefined;
            const brand = sku?.brand || 'NA';
            const model = sku?.model || 'NA';
            const variant = sku?.variant || 'NA';
            const colour = sku?.colour || 'NA';
            const supplier = getSupplierName(req);
            const path =
                groupMode === 'SUPPLIER' ? [supplier, brand, model, variant, colour] : [brand, model, variant, colour];

            let levelMap = root;
            let parentNode: GroupNode | null = null;
            path.forEach((segment, index) => {
                const compositeKey = `${index}:${segment}:${parentNode?.key || 'root'}`;
                let node = levelMap.get(compositeKey);
                if (!node) {
                    node = { key: compositeKey, label: segment, count: 0, children: [] };
                    levelMap.set(compositeKey, node);
                    if (parentNode) parentNode.children.push(node);
                }
                node.count += 1;
                parentNode = node;
                const childMap = new Map<string, GroupNode>();
                node.children.forEach(child => childMap.set(child.key, child));
                levelMap = childMap;
            });
        }

        return Array.from(root.values()).sort((a, b) => b.count - a.count);
    }, [filteredRequisitions, getSupplierName, groupMode, skuMap]);

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
                        placeholder="SEARCH ID / BOOKING / REQUESTER / BRANCH..."
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
                <div className="w-full md:w-auto shrink-0">
                    <select
                        value={groupMode}
                        onChange={e => setGroupMode(e.target.value as GroupMode)}
                        className="w-full md:w-[190px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl py-2.5 px-3 text-[10px] font-black text-slate-700 dark:text-slate-100 uppercase tracking-widest"
                    >
                        <option value="NONE">Group: None</option>
                        <option value="BRAND">Group: Brand Cascade</option>
                        <option value="SUPPLIER">Group: Supplier Cascade</option>
                    </select>
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
                ) : groupMode !== 'NONE' ? (
                    <div className="p-4 md:p-6 space-y-3">
                        {groupedNodes.length === 0 ? (
                            <div className="py-10 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                No grouped rows
                            </div>
                        ) : (
                            (() => {
                                const levelLabels =
                                    groupMode === 'SUPPLIER'
                                        ? ['Supplier', 'Brand', 'Model', 'Variant', 'Colour']
                                        : ['Brand', 'Model', 'Variant', 'Colour'];
                                const renderNodes = (nodes: GroupNode[], level = 0): React.ReactNode =>
                                    nodes
                                        .sort((a, b) => b.count - a.count)
                                        .map(node => (
                                            <div
                                                key={node.key}
                                                className={`rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/30 ${
                                                    level > 0 ? 'mt-2' : ''
                                                }`}
                                                style={{ marginLeft: `${level * 16}px` }}
                                            >
                                                <div className="px-4 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            {levelLabels[level] || 'Group'}
                                                        </span>
                                                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wide">
                                                            {node.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                                                        {node.count} Req
                                                    </span>
                                                </div>
                                                {node.children.length > 0 && (
                                                    <div className="px-2 pb-2">
                                                        {renderNodes(node.children, level + 1)}
                                                    </div>
                                                )}
                                            </div>
                                        ));
                                return renderNodes(groupedNodes);
                            })()
                        )}
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
                                        SKU
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Unit
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Source
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Supplier
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Raised
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Priority
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Status
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
                                        {(() => {
                                            const fallbackSkuLabel = req.sku_id
                                                ? `SKU ${req.sku_id.slice(0, 8).toUpperCase()}`
                                                : 'SKU NA';
                                            const skuCard = req.sku_id ? skuMap[req.sku_id] : undefined;
                                            const skuLabel = skuCard?.fullLabel || fallbackSkuLabel;
                                            const skuImage = skuCard?.image || null;
                                            const skuHex = skuCard?.colorHex || null;
                                            const brand = skuCard?.brand || 'NA';
                                            const modelAndVariant =
                                                [skuCard?.model, skuCard?.variant].filter(Boolean).join(' - ') || 'NA';
                                            const colour = skuCard?.colour || 'NA';
                                            return (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                            {formatTripletId(req.display_id || req.id)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div
                                                            className={`flex items-center gap-2 ${skuImage ? 'cursor-zoom-in' : ''}`}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                if (skuImage)
                                                                    setPreviewSku({ label: skuLabel, image: skuImage });
                                                            }}
                                                        >
                                                            <div
                                                                className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0B1220] flex items-center justify-center p-1.5 shrink-0"
                                                                style={
                                                                    skuHex
                                                                        ? { backgroundColor: `${skuHex}4D` }
                                                                        : undefined
                                                                }
                                                            >
                                                                {skuImage ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={skuImage}
                                                                        alt={skuLabel}
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                ) : (
                                                                    <Package size={14} className="text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col leading-tight">
                                                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 tracking-wide">
                                                                    {brand}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200 tracking-wide">
                                                                    {modelAndVariant}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                                                                    {colour}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {(() => {
                                                            const unit = req.sku_id
                                                                ? skuUnitMap[req.sku_id] || {
                                                                      available: 0,
                                                                      transit: 0,
                                                                      order: 0,
                                                                      requisition: 0,
                                                                  }
                                                                : {
                                                                      available: 0,
                                                                      transit: 0,
                                                                      order: 0,
                                                                      requisition: 0,
                                                                  };
                                                            return (
                                                                <div className="flex flex-col gap-1 leading-tight min-w-[98px]">
                                                                    <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                                                        Available-{unit.available}
                                                                    </span>
                                                                    <span className="text-[9px] font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                                                                        Transit-{unit.transit}
                                                                    </span>
                                                                    <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                                                        Order-{unit.order}
                                                                    </span>
                                                                    <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                                                        Requisition-{unit.requisition}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span
                                                                className={`inline-flex w-fit items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${
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
                                                            {req.source_type === 'BOOKING' && (
                                                                <>
                                                                    <span className="text-[10px] font-black text-slate-900 dark:text-white tracking-wider">
                                                                        {req.bookingLabel}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                                        Qty {req.booking?.qty || 1}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {(() => {
                                                            const supplierName = getSupplierName(req);
                                                            return supplierName !== 'Pending' ? (
                                                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                                                    {supplierName}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10">
                                                                    Pending
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="inline-flex items-center gap-2">
                                                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400">
                                                                <User2 size={12} />
                                                            </span>
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                                                    {req.createdByName}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                                    {format(new Date(req.created_at), 'dd MMM yyyy')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {req.source_type === 'BOOKING' && req.scheduleDate ? (
                                                            <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                                                                <CalendarClock size={12} />
                                                                <span className="text-[10px] font-black uppercase tracking-wider">
                                                                    {formatDateValue(req.scheduleDate)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${
                                                                    PRIORITY_BADGES[req.priority]
                                                                }`}
                                                            >
                                                                <Flag size={10} />
                                                                {req.priority}
                                                            </span>
                                                        )}
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
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </td>
                                                </>
                                            );
                                        })()}
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

            {previewSku && (
                <div
                    className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewSku(null)}
                >
                    <div
                        className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
                            <p className="text-xs font-black text-slate-900 dark:text-white tracking-wide">
                                {previewSku.label}
                            </p>
                            <button
                                onClick={() => setPreviewSku(null)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewSku.image}
                                alt={previewSku.label}
                                className="max-h-[70vh] w-auto rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
