'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    BarChart3,
    Calendar,
    FileBox,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Loader2,
    Package,
    Truck,
    User2,
    Flag,
    Building2,
    Receipt,
    TrendingUp,
    Bookmark,
    FileText,
    MessageSquareQuote,
    ShoppingCart,
    PackageCheck,
    Wallet,
    Undo2,
    CheckCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant/tenantContext';
import { fetchSkuDisplayMap } from '@/lib/inventory/skuDisplay';
import QuotePanel from './components/QuotePanel';

type RequestStatus = 'QUOTING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

type RequestItem = {
    id: string;
    cost_type: string;
    expected_amount: number;
    description: string | null;
};

type QuoteTenantRef = {
    name: string | null;
    slug: string | null;
};

type DealerQuote = {
    id: string;
    dealer_tenant_id: string;
    bundled_item_ids?: string[] | null;
    bundled_amount: number;
    transport_amount: number;
    expected_total: number;
    variance_amount: number | null;
    status: 'SUBMITTED' | 'SELECTED' | 'REJECTED';
    freebie_description: string | null;
    inv_quote_line_items?: Array<{
        request_item_id: string;
        offered_amount: number;
        notes: string | null;
    }> | null;
    inv_quote_terms?: {
        payment_mode: 'ADVANCE' | 'PARTIAL' | 'CREDIT' | 'OTHER' | null;
        credit_days: number | null;
        advance_percent: number | null;
        expected_dispatch_days: number | null;
        notes: string | null;
    } | null;
    created_at?: string;
    id_tenants?: QuoteTenantRef | QuoteTenantRef[] | null;
};

type PurchaseOrder = {
    id: string;
    display_id: string | null;
    po_status: 'DRAFT' | 'SENT' | 'SHIPPED' | 'RECEIVED';
    payment_status: 'UNPAID' | 'PARTIAL_PAID' | 'FULLY_PAID';
    total_po_value: number;
    expected_delivery_date: string | null;
    created_at: string;
};

type RequisitionDetail = {
    id: string;
    tenant_id?: string;
    display_id: string | null;
    created_by?: string | null;
    status: RequestStatus;
    source_type: string;
    sku_id: string;
    booking_id: string | null;
    delivery_branch_id: string | null;
    created_at: string;
    updated_at: string;
    inv_request_items: RequestItem[];
    inv_dealer_quotes: DealerQuote[];
    inv_purchase_orders: PurchaseOrder[];
};
const EMPTY_REQUEST_ITEMS: RequestItem[] = [];

type ProgressStageKey =
    | 'BOOKING'
    | 'REQUISITION'
    | 'QUOTING'
    | 'PURCHASE_ORDER'
    | 'DISPATCH_ORDER'
    | 'PAYMENT'
    | 'RECEIVED'
    | 'TERMINAL';

const BASE_PROGRESS_STAGES: Array<{ key: ProgressStageKey; label: string }> = [
    { key: 'BOOKING', label: 'BOOKING' },
    { key: 'REQUISITION', label: 'REQUISITION' },
    { key: 'QUOTING', label: 'QUOTING' },
    { key: 'PURCHASE_ORDER', label: 'PURCHASE ORDER' },
    { key: 'DISPATCH_ORDER', label: 'DISPATCH ORDER' },
    { key: 'PAYMENT', label: 'PAYMENT' },
    { key: 'RECEIVED', label: 'RECEIVED' },
];

const STAGE_ICON_MAP: Record<ProgressStageKey, React.ComponentType<{ size?: number; className?: string }>> = {
    BOOKING: Bookmark,
    REQUISITION: FileText,
    QUOTING: MessageSquareQuote,
    PURCHASE_ORDER: ShoppingCart,
    DISPATCH_ORDER: PackageCheck,
    PAYMENT: Wallet,
    RECEIVED: CheckCheck,
    TERMINAL: Undo2,
};

const STAGE_TONE_MAP = {
    BOOKING: {
        base: 'bg-purple-50 border-purple-200 text-purple-600',
        active: 'bg-purple-100 border-purple-300 text-purple-700',
        done: 'bg-purple-600 border-purple-600 text-white',
    },
    REQUISITION: {
        base: 'bg-blue-50 border-blue-200 text-blue-600',
        active: 'bg-blue-100 border-blue-300 text-blue-700',
        done: 'bg-blue-600 border-blue-600 text-white',
    },
    QUOTING: {
        base: 'bg-amber-50 border-amber-200 text-amber-600',
        active: 'bg-amber-100 border-amber-300 text-amber-700',
        done: 'bg-amber-600 border-amber-600 text-white',
    },
    PURCHASE_ORDER: {
        base: 'bg-indigo-50 border-indigo-200 text-indigo-600',
        active: 'bg-indigo-100 border-indigo-300 text-indigo-700',
        done: 'bg-indigo-600 border-indigo-600 text-white',
    },
    DISPATCH_ORDER: {
        base: 'bg-cyan-50 border-cyan-200 text-cyan-600',
        active: 'bg-cyan-100 border-cyan-300 text-cyan-700',
        done: 'bg-cyan-600 border-cyan-600 text-white',
    },
    PAYMENT: {
        base: 'bg-teal-50 border-teal-200 text-teal-600',
        active: 'bg-teal-100 border-teal-300 text-teal-700',
        done: 'bg-teal-600 border-teal-600 text-white',
    },
    RECEIVED: {
        base: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        active: 'bg-emerald-100 border-emerald-300 text-emerald-700',
        done: 'bg-emerald-600 border-emerald-600 text-white',
    },
    ALLOTTED: {
        base: 'bg-slate-100 border-slate-300 text-slate-700',
        active: 'bg-slate-200 border-slate-400 text-slate-800',
        done: 'bg-slate-600 border-slate-600 text-white',
    },
    RETURN: {
        base: 'bg-rose-50 border-rose-200 text-rose-600',
        active: 'bg-rose-100 border-rose-300 text-rose-700',
        done: 'bg-rose-600 border-rose-600 text-white',
    },
    DELIVERED: {
        base: 'bg-green-50 border-green-200 text-green-600',
        active: 'bg-green-100 border-green-300 text-green-700',
        done: 'bg-green-600 border-green-600 text-white',
    },
} as const;

const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
    QUOTING:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    ORDERED:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    RECEIVED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    CANCELLED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
};

const QUOTE_STATUS_STYLES: Record<DealerQuote['status'], string> = {
    SUBMITTED:
        'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
    SELECTED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    REJECTED: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
};

const PO_STATUS_STYLES: Record<PurchaseOrder['po_status'], string> = {
    DRAFT: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
    SENT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    SHIPPED:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    RECEIVED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
};

const formatCurrency = (amount: number | null | undefined) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const getQuoteTotal = (quote: DealerQuote) => Number(quote.bundled_amount || 0) + Number(quote.transport_amount || 0);
const formatTripletId = (raw?: string | null) => {
    if (!raw) return 'NA';
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 9)}`;
};

const parseTenantRef = (value: DealerQuote['id_tenants']) => {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] || null;
    return value;
};

export default function RequisitionDetailPage() {
    const params = useParams<{ id?: string; slug?: string }>();
    const router = useRouter();
    const { tenantSlug, tenantId } = useTenant();
    const requestId = params?.id || '';
    const slugFromParams = typeof params?.slug === 'string' ? params.slug : undefined;
    const resolvedSlug = slugFromParams || tenantSlug;
    const requisitionsBasePath = resolvedSlug
        ? `/app/${resolvedSlug}/dashboard/inventory/requisitions`
        : '/dashboard/inventory/requisitions';
    const ordersBasePath = resolvedSlug
        ? `/app/${resolvedSlug}/dashboard/inventory/orders`
        : '/dashboard/inventory/orders';

    const [request, setRequest] = useState<RequisitionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectingQuoteId, setSelectingQuoteId] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showRequisitionSection, setShowRequisitionSection] = useState(true);
    const [showCostSection, setShowCostSection] = useState(true);
    const [showQuoteSection, setShowQuoteSection] = useState(true);
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const [showPurchaseOrders, setShowPurchaseOrders] = useState(true);
    const [selectedDealer, setSelectedDealer] = useState<string>('');
    const [quoteVisibleFields, setQuoteVisibleFields] = useState<
        Record<
            'exShowroom' | 'registration' | 'insurance' | 'insuranceAddons' | 'hypothecation' | 'transportation',
            boolean
        >
    >({
        exShowroom: true,
        registration: false,
        insurance: false,
        insuranceAddons: false,
        hypothecation: false,
        transportation: false,
    });
    const [quoteAddField, setQuoteAddField] = useState<
        '' | 'registration' | 'insurance' | 'insuranceAddons' | 'hypothecation' | 'transportation'
    >('');
    const [includedQuoteFields, setIncludedQuoteFields] = useState<
        Record<
            | 'exShowroom'
            | 'registration'
            | 'hypothecation'
            | 'insurance'
            | 'depreciationWaiver'
            | 'insuranceAddons'
            | 'transportation',
            boolean
        >
    >({
        exShowroom: true,
        registration: true,
        hypothecation: true,
        insurance: true,
        depreciationWaiver: true,
        insuranceAddons: true,
        transportation: true,
    });
    const [editableQuoteValues, setEditableQuoteValues] = useState<
        Record<
            | 'exShowroom'
            | 'registration'
            | 'hypothecation'
            | 'insurance'
            | 'depreciationWaiver'
            | 'insuranceAddons'
            | 'transportation'
            | 'grandTotal',
            number
        >
    >({
        exShowroom: 0,
        registration: 0,
        hypothecation: 0,
        insurance: 0,
        depreciationWaiver: 0,
        insuranceAddons: 0,
        transportation: 0,
        grandTotal: 0,
    });
    const [createdByName, setCreatedByName] = useState('System');
    const [linkedStockStatuses, setLinkedStockStatuses] = useState<string[]>([]);
    const [skuCard, setSkuCard] = useState<{
        image: string | null;
        brand: string;
        model: string;
        variant: string;
        colour: string;
        colorHex: string | null;
        fullLabel: string;
    }>({
        image: null,
        brand: 'NA',
        model: 'NA',
        variant: 'NA',
        colour: 'NA',
        colorHex: null,
        fullLabel: 'NA',
    });
    const [lastPurchaseStats, setLastPurchaseStats] = useState<{
        cost: number | null;
        supplier: string;
        date: string | null;
    }>({
        cost: null,
        supplier: 'NA',
        date: null,
    });

    const fetchRequestDetail = useCallback(async () => {
        if (!requestId) {
            setError('Invalid requisition ID');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { getRequestById } = await import('@/actions/inventory');
            const result = await getRequestById(requestId);

            if (!result.success || !result.data) {
                setRequest(null);
                setError(result.message || 'Failed to load requisition');
                return;
            }

            setRequest(result.data as RequisitionDetail);
            setError(null);
        } catch (err: unknown) {
            setRequest(null);
            setError(err instanceof Error ? err.message : 'Failed to load requisition');
        } finally {
            setLoading(false);
        }
    }, [requestId]);

    useEffect(() => {
        fetchRequestDetail();
    }, [fetchRequestDetail]);

    useEffect(() => {
        if (!request?.sku_id) return;

        const hydrateSkuCard = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const skuMap = await fetchSkuDisplayMap(supabase, [request.sku_id]);
                const resolved = skuMap[request.sku_id];
                if (!resolved) throw new Error('SKU metadata unavailable');
                setSkuCard({
                    image: resolved.image,
                    brand: resolved.brand,
                    model: resolved.model,
                    variant: resolved.variant,
                    colour: resolved.colour,
                    colorHex: resolved.colorHex,
                    fullLabel: resolved.fullLabel,
                });
            } catch {
                setSkuCard({
                    image: null,
                    brand: 'NA',
                    model: 'NA',
                    variant: 'NA',
                    colour: 'NA',
                    colorHex: null,
                    fullLabel: 'NA',
                });
            }
        };

        hydrateSkuCard();
    }, [request?.sku_id]);

    useEffect(() => {
        if (!request?.created_by) {
            setCreatedByName('System');
            return;
        }
        const hydrateCreator = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data } = await (supabase as any)
                    .from('id_members')
                    .select('full_name')
                    .eq('id', request.created_by)
                    .maybeSingle();
                setCreatedByName(data?.full_name || `User ${request.created_by.slice(0, 6).toUpperCase()}`);
            } catch {
                setCreatedByName(`User ${request.created_by.slice(0, 6).toUpperCase()}`);
            }
        };
        hydrateCreator();
    }, [request?.created_by]);

    useEffect(() => {
        if (!request?.inv_purchase_orders?.length) {
            setLinkedStockStatuses([]);
            return;
        }
        const poIds = request.inv_purchase_orders.map(po => po.id).filter(Boolean);
        if (!poIds.length) {
            setLinkedStockStatuses([]);
            return;
        }
        const hydrateStockStatus = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data } = await (supabase as any).from('inv_stock').select('status').in('po_id', poIds);
                const statuses = ((data || []) as Array<{ status: string | null }>)
                    .map(row => (row.status || '').toUpperCase())
                    .filter(Boolean);
                setLinkedStockStatuses(statuses);
            } catch {
                setLinkedStockStatuses([]);
            }
        };
        hydrateStockStatus();
    }, [request?.inv_purchase_orders]);

    useEffect(() => {
        if (!request?.sku_id) {
            setLastPurchaseStats({ cost: null, supplier: 'NA', date: null });
            return;
        }
        const hydrateLastPurchaseStats = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data: lastPo } = await (supabase as any)
                    .from('inv_purchase_orders')
                    .select('total_po_value, created_at, supplier_tenant_id')
                    .eq('sku_id', request.sku_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!lastPo) {
                    setLastPurchaseStats({ cost: null, supplier: 'NA', date: null });
                    return;
                }

                let supplierName = 'NA';
                if (lastPo.supplier_tenant_id) {
                    const { data: supplier } = await (supabase as any)
                        .from('id_tenants')
                        .select('name')
                        .eq('id', lastPo.supplier_tenant_id)
                        .maybeSingle();
                    supplierName = supplier?.name || 'NA';
                }

                setLastPurchaseStats({
                    cost: Number(lastPo.total_po_value || 0),
                    supplier: supplierName,
                    date: lastPo.created_at || null,
                });
            } catch {
                setLastPurchaseStats({ cost: null, supplier: 'NA', date: null });
            }
        };
        hydrateLastPurchaseStats();
    }, [request?.sku_id]);

    const requestItems = request?.inv_request_items ?? EMPTY_REQUEST_ITEMS;
    const isQuoteLocked = request?.status !== 'QUOTING';
    const quotes = useMemo(() => (request?.inv_dealer_quotes || []).slice(), [request?.inv_dealer_quotes]);
    const purchaseOrders = request?.inv_purchase_orders || [];

    const totalExpected = useMemo(
        () => requestItems.reduce((sum, item) => sum + Number(item.expected_amount || 0), 0),
        [requestItems]
    );
    const costSummary = useMemo(() => {
        const summary = {
            exShowroom: 0,
            registration: 0,
            hypothecation: 0,
            insurance: 0,
            depreciationWaiver: 0,
            transportation: 0,
            insuranceAddons: 0,
        };
        for (const item of requestItems) {
            const key = (item.cost_type || '').toUpperCase();
            const amount = Number(item.expected_amount || 0);
            if (key.includes('EX_SHOWROOM') || key === 'EXSHOWROOM') {
                summary.exShowroom += amount;
                continue;
            }
            if (key.includes('HYPOTH')) {
                summary.hypothecation += amount;
                continue;
            }
            if (key.includes('RTO') || key.includes('REGISTRATION')) {
                summary.registration += amount;
                continue;
            }
            if (key.includes('TRANSPORT')) {
                summary.transportation += amount;
                continue;
            }
            if (key.includes('INSURANCE')) {
                if (key.includes('ZD') || key.includes('ZERO_DEPR') || key.includes('DEPR')) {
                    summary.depreciationWaiver += amount;
                } else if (key.includes('ADDON') || key.includes('ADD_ON')) {
                    summary.insuranceAddons += amount;
                } else {
                    summary.insurance += amount;
                }
            }
        }
        return summary;
    }, [requestItems]);

    useEffect(() => {
        if (!request) return;
        setEditableQuoteValues({
            exShowroom: Number(costSummary.exShowroom || 0),
            registration: Number(costSummary.registration || 0),
            hypothecation: Number(costSummary.hypothecation || 0),
            insurance: Number(costSummary.insurance || 0),
            depreciationWaiver: Number(costSummary.depreciationWaiver || 0),
            insuranceAddons: Number(costSummary.insuranceAddons || 0),
            transportation: Number(costSummary.transportation || 0),
            grandTotal: Number(totalExpected || 0),
        });
        setIncludedQuoteFields({
            exShowroom: true,
            registration: true,
            hypothecation: true,
            insurance: true,
            depreciationWaiver: true,
            insuranceAddons: true,
            transportation: true,
        });
        setQuoteVisibleFields({
            exShowroom: true,
            registration: false,
            insurance: false,
            insuranceAddons: false,
            hypothecation: false,
            transportation: false,
        });
        setQuoteAddField('');
    }, [request, costSummary, totalExpected]);

    useEffect(() => {
        // Booking-dependent components should refresh from backend values whenever booking link/source changes.
        // Direct flow starts with all components included; user can exclude specific ones.
        if (!request) return;
        setEditableQuoteValues(prev => ({
            ...prev,
            hypothecation: Number(costSummary.hypothecation || 0),
            depreciationWaiver: Number(costSummary.depreciationWaiver || 0),
            insuranceAddons: Number(costSummary.insuranceAddons || 0),
        }));
    }, [
        request?.booking_id,
        request?.source_type,
        costSummary.hypothecation,
        costSummary.depreciationWaiver,
        costSummary.insuranceAddons,
    ]);

    const quoteComputedTotal = useMemo(() => {
        const keys: Array<keyof typeof includedQuoteFields> = [
            'exShowroom',
            'registration',
            'hypothecation',
            'insurance',
            'depreciationWaiver',
            'insuranceAddons',
            'transportation',
        ];
        return keys.reduce((sum, key) => {
            if (key === 'depreciationWaiver') return sum;
            if (!quoteVisibleFields[key as keyof typeof quoteVisibleFields]) return sum;
            return includedQuoteFields[key] ? sum + Number(editableQuoteValues[key] || 0) : sum;
        }, 0);
    }, [editableQuoteValues, includedQuoteFields, quoteVisibleFields]);

    const quoteFinalOffer = Number(editableQuoteValues.grandTotal || 0);

    const postOfferAdditions = useMemo(() => {
        const defs: Array<{ key: keyof typeof includedQuoteFields; label: string }> = [
            { key: 'hypothecation', label: 'Hypothecation' },
            { key: 'depreciationWaiver', label: 'Depreciation Waiver' },
            { key: 'insuranceAddons', label: 'Insurance Add-ons' },
        ];
        return defs
            .filter(
                def =>
                    includedQuoteFields[def.key] &&
                    Number(costSummary[def.key] || 0) === 0 &&
                    Number(editableQuoteValues[def.key] || 0) > 0
            )
            .map(def => ({ label: def.label, amount: Number(editableQuoteValues[def.key] || 0) }));
    }, [includedQuoteFields, costSummary, editableQuoteValues]);

    const selectedQuote = useMemo(() => quotes.find(q => q.status === 'SELECTED') || null, [quotes]);
    const submittedQuotes = useMemo(() => quotes.filter(q => q.status === 'SUBMITTED'), [quotes]);
    const activeQuotes = useMemo(() => quotes.filter(q => q.status !== 'REJECTED'), [quotes]);
    const defaultNextQuote = useMemo(
        () => submittedQuotes.slice().sort((a, b) => getQuoteTotal(a) - getQuoteTotal(b))[0] || null,
        [submittedQuotes]
    );
    const primaryPo = useMemo(() => purchaseOrders[0] || null, [purchaseOrders]);
    const bestQuote = useMemo(() => {
        if (!activeQuotes.length) return null;
        return activeQuotes.slice().sort((a, b) => getQuoteTotal(a) - getQuoteTotal(b))[0];
    }, [activeQuotes]);
    const quoteSpread = useMemo(() => {
        if (activeQuotes.length < 2) return 0;
        const totals = activeQuotes.map(getQuoteTotal);
        return Math.max(...totals) - Math.min(...totals);
    }, [activeQuotes]);
    const headerSupplier =
        parseTenantRef(selectedQuote?.id_tenants)?.name || parseTenantRef(quotes[0]?.id_tenants)?.name || 'Pending';
    const headerPriority =
        request?.status === 'RECEIVED'
            ? 'Closed'
            : request?.status === 'CANCELLED'
              ? 'Cancelled'
              : request?.source_type === 'BOOKING'
                ? 'High'
                : 'Medium';
    const headerRaised = request ? format(new Date(request.created_at), 'dd MMM yyyy, hh:mm a') : 'NA';
    const referenceQuote = selectedQuote || bestQuote || null;
    const referenceBundledAmount = Number(referenceQuote?.bundled_amount || 0);
    const referenceTransportAmount = Number(referenceQuote?.transport_amount || 0);
    const referenceTotalAmount = Math.round((referenceBundledAmount + referenceTransportAmount) * 100) / 100;
    const referenceVarianceAmount = Math.round((referenceBundledAmount - totalExpected) * 100) / 100;
    const referenceVariancePercent =
        totalExpected > 0 ? Math.round((referenceVarianceAmount / totalExpected) * 10000) / 100 : 0;
    const referenceDealerLabel = parseTenantRef(referenceQuote?.id_tenants)?.name || 'Dealer';
    const quoteHeaderDealer =
        parseTenantRef(selectedQuote?.id_tenants)?.name ||
        parseTenantRef(bestQuote?.id_tenants)?.name ||
        parseTenantRef(quotes[0]?.id_tenants)?.name ||
        'Dealership';
    const quoteDealerOptions = useMemo(() => {
        const names = quotes.map(q => parseTenantRef(q.id_tenants)?.name).filter((name): name is string => !!name);
        return Array.from(new Set(names));
    }, [quotes]);

    const terminalStageLabel = useMemo(() => {
        const hasDelivered = linkedStockStatuses.some(status => status.includes('DELIVER'));
        const hasAllotted = linkedStockStatuses.some(status => status.includes('ALLOT') || status.includes('ALLOCAT'));
        const hasReturned = linkedStockStatuses.some(status => status.includes('RETURN'));

        if (hasDelivered) return 'DELIVERED';
        if (hasReturned) return 'RETURN';
        if (hasAllotted) return 'ALLOTTED';
        return 'ALLOTTED';
    }, [linkedStockStatuses, request?.status]);

    const progressStages = useMemo(
        () => [...BASE_PROGRESS_STAGES, { key: 'TERMINAL' as ProgressStageKey, label: terminalStageLabel }],
        [terminalStageLabel]
    );

    const resolveStageTone = useCallback((stage: { key: ProgressStageKey; label: string }) => {
        if (stage.key !== 'TERMINAL') return STAGE_TONE_MAP[stage.key];
        if (stage.label === 'RETURN') return STAGE_TONE_MAP.RETURN;
        if (stage.label === 'DELIVERED') return STAGE_TONE_MAP.DELIVERED;
        return STAGE_TONE_MAP.ALLOTTED;
    }, []);

    const progressIndex = useMemo(() => {
        if (!request) return 0;
        let idx = 1; // Requisition creation
        if (request.source_type === 'BOOKING') idx = 2; // Booking + requisition
        if (request.status === 'QUOTING') idx = Math.max(idx, 2);
        if (request.status === 'ORDERED' || request.status === 'RECEIVED') idx = Math.max(idx, 3);
        if (primaryPo?.po_status === 'SHIPPED') idx = Math.max(idx, 4);
        if (primaryPo?.payment_status === 'FULLY_PAID') idx = Math.max(idx, 5);
        if (request.status === 'RECEIVED') idx = Math.max(idx, 6);
        if (request.status === 'RECEIVED' && terminalStageLabel !== 'RETURN / ALLOTTED') idx = Math.max(idx, 7);
        return idx;
    }, [primaryPo?.payment_status, primaryPo?.po_status, request?.source_type, request?.status, terminalStageLabel]);

    const canAdvanceToOrdered = !!request && request.status === 'QUOTING' && !!(selectedQuote || defaultNextQuote);
    const nextActionLabel = useMemo(() => {
        if (!request) return 'Next Stage';
        if (request.status === 'QUOTING')
            return canAdvanceToOrdered ? 'Next Stage: Move To Ordered' : 'Next Stage Locked';
        if (request.status === 'ORDERED') return primaryPo ? 'Open Purchase Order' : 'Open Orders';
        if (request.status === 'RECEIVED') return 'Stage Complete';
        return 'No Further Action';
    }, [request, canAdvanceToOrdered, primaryPo]);

    const handleSelectQuote = useCallback(
        async (quoteId: string) => {
            setSelectingQuoteId(quoteId);
            try {
                const { selectQuote } = await import('@/actions/inventory');
                const result = await selectQuote(quoteId);
                if (!result.success) {
                    toast.error(result.message || 'Failed to advance requisition');
                    return;
                }
                toast.success(result.message || 'Requisition moved to ORDERED');
                await fetchRequestDetail();
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Failed to advance requisition');
            } finally {
                setSelectingQuoteId(null);
            }
        },
        [fetchRequestDetail]
    );

    const handleCancelRequest = useCallback(async () => {
        if (!request) return;
        if (!confirm('Are you sure you want to cancel this requisition? This action cannot be undone.')) return;

        setIsCancelling(true);
        try {
            const { cancelRequest } = await import('@/actions/inventory');
            const result = await cancelRequest(request.id);
            if (!result.success) {
                toast.error(result.message || 'Failed to cancel requisition');
                return;
            }
            toast.success(result.message || 'Requisition cancelled');
            await fetchRequestDetail();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to cancel requisition');
        } finally {
            setIsCancelling(false);
        }
    }, [request, fetchRequestDetail]);

    const handleNextStage = useCallback(async () => {
        if (!request) return;

        if (request.status === 'QUOTING') {
            const quoteToUse = selectedQuote || defaultNextQuote;
            if (!quoteToUse) {
                toast.error('No submitted dealer quote available. Add/select a quote first.');
                return;
            }
            await handleSelectQuote(quoteToUse.id);
            return;
        }

        if (request.status === 'ORDERED') {
            if (primaryPo) {
                const poPath =
                    primaryPo.po_status === 'SHIPPED'
                        ? `${ordersBasePath}/${primaryPo.id}/grn`
                        : `${ordersBasePath}/${primaryPo.id}`;
                router.push(poPath);
                return;
            }
            router.push(ordersBasePath);
            return;
        }

        if (request.status === 'RECEIVED') {
            toast.message('This requisition is already in final stage.');
            return;
        }

        toast.error('Cannot advance cancelled requisition.');
    }, [defaultNextQuote, handleSelectQuote, ordersBasePath, primaryPo, request, router, selectedQuote]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                <Package size={44} className="text-amber-500" />
                <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {error || 'Requisition Not Found'}
                </p>
                <button
                    onClick={() => router.push(requisitionsBasePath)}
                    className="text-sm font-bold text-indigo-500 hover:underline"
                >
                    Back to Requisitions
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    <div className="flex-1 min-h-24 flex flex-col justify-between">
                        <div className="inline-block text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-slate-300 dark:decoration-slate-600">
                            {formatTripletId(request.display_id || request.id)}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <FileBox size={12} className="inline mr-1.5 align-text-bottom text-slate-400" />
                            SKU: {skuCard.fullLabel}
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <User2 size={12} className="inline mr-1.5 align-text-bottom text-slate-400" />
                            Created By: {createdByName}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Calendar size={12} className="inline mr-1.5 align-text-bottom text-slate-400" />
                            Created On: {format(new Date(request.created_at), 'dd MMM yyyy, hh:mm a')}
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Flag size={12} className="inline mr-1.5 align-text-bottom text-slate-400" />
                            Priority: {headerPriority}
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Truck size={12} className="inline mr-1.5 align-text-bottom text-slate-400" />
                            Supplier: {headerSupplier}
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Building2 size={12} className="inline mr-1.5 align-text-bottom text-slate-400" />
                            Source: {request.source_type}
                        </p>
                    </div>
                    <div
                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-3 min-w-[140px]"
                        style={skuCard.colorHex ? { backgroundColor: `${skuCard.colorHex}4D` } : undefined}
                    >
                        <div className="w-24 h-24 flex items-center justify-center shrink-0">
                            {skuCard.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={skuCard.image}
                                    alt={skuCard.variant}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Package size={28} className="text-slate-400" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-0">
                <div className="w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 w-full">
                        {progressStages.map((stage, idx) => {
                            const completed = idx < progressIndex;
                            const active = idx === progressIndex;
                            const tone = resolveStageTone(stage);
                            return (
                                <React.Fragment key={stage.key}>
                                    <div
                                        className={`w-full max-w-[135px] mx-auto rounded-xl border p-2 flex flex-col items-center justify-center text-center ${
                                            completed ? tone.done : active ? tone.active : tone.base
                                        }`}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-black transition-all ${
                                                completed
                                                    ? 'bg-white/20 border-white/30 text-white'
                                                    : active
                                                      ? 'bg-white/70 border-white/70 text-current'
                                                      : 'bg-white/80 border-white/70 text-current'
                                            }`}
                                        >
                                            {(() => {
                                                const Icon = STAGE_ICON_MAP[stage.key] || CheckCircle2;
                                                return <Icon size={12} />;
                                            })()}
                                        </div>
                                        <p
                                            className={`mt-1.5 text-[9px] font-black uppercase tracking-wider leading-tight ${
                                                completed || active
                                                    ? completed
                                                        ? 'text-white'
                                                        : 'text-current'
                                                    : 'text-current'
                                            } ${active ? 'underline decoration-2 underline-offset-2 decoration-[#4f46e5]' : ''}`}
                                        >
                                            {stage.label}
                                        </p>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        On-Road Price
                    </h2>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Last Purchase</p>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wide">
                            {formatCurrency(lastPurchaseStats.cost)} • {lastPurchaseStats.supplier}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {lastPurchaseStats.date ? format(new Date(lastPurchaseStats.date), 'dd MMM yyyy') : 'NA'}
                        </p>
                    </div>
                </div>
                <div>
                    {requestItems.length === 0 ? (
                        <div className="p-8 text-center text-[11px] font-bold text-slate-400 uppercase">
                            No cost lines attached to this requisition.
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10">
                                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 min-h-[108px] flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-h-[30px]">
                                            Ex Showroom
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-auto">
                                            {formatCurrency(costSummary.exShowroom)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 min-h-[108px] flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-h-[30px]">
                                            Registration
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-auto">
                                            {formatCurrency(costSummary.registration)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 min-h-[108px] flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-h-[30px]">
                                            Hypothecation
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-auto">
                                            {formatCurrency(costSummary.hypothecation)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 min-h-[108px] flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-h-[30px]">
                                            Insurance
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-auto">
                                            {formatCurrency(costSummary.insurance)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 min-h-[108px] flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-h-[30px]">
                                            Depreciation Waiver
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-auto">
                                            {formatCurrency(costSummary.depreciationWaiver)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 min-h-[108px] flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-h-[30px]">
                                            Insurance Add-ons
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-auto">
                                            {formatCurrency(costSummary.insuranceAddons)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 min-h-[108px] flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-h-[30px]">
                                            Transportation
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-auto">
                                            {formatCurrency(costSummary.transportation)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 min-h-[108px] flex flex-col">
                                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest min-h-[30px]">
                                            Grand Total
                                        </p>
                                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-200 mt-auto">
                                            {formatCurrency(totalExpected)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Quote
                    </h2>
                </div>
                <div>
                    {requestItems.length === 0 ? (
                        <div className="p-8 text-center text-[11px] font-bold text-slate-400 uppercase">
                            No cost lines attached to this requisition.
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10">
                                <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider self-center">
                                            Dealership
                                        </p>
                                        <select
                                            value={selectedDealer}
                                            onChange={e => setSelectedDealer(e.target.value)}
                                            disabled={isQuoteLocked}
                                            className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                                        >
                                            <option value="">Select dealer</option>
                                            {quoteDealerOptions.map(name => (
                                                <option key={name} value={name}>
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_180px] gap-3 p-4 border-b border-slate-100 dark:border-white/10 items-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            Add Item
                                        </p>
                                        <select
                                            value={quoteAddField}
                                            onChange={e =>
                                                setQuoteAddField(
                                                    e.target.value as
                                                        | ''
                                                        | 'registration'
                                                        | 'insurance'
                                                        | 'insuranceAddons'
                                                        | 'hypothecation'
                                                        | 'transportation'
                                                )
                                            }
                                            disabled={isQuoteLocked}
                                            className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                                        >
                                            <option value="">Select item to add</option>
                                            {!quoteVisibleFields.registration && (
                                                <option value="registration">Registration</option>
                                            )}
                                            {!quoteVisibleFields.insurance && (
                                                <option value="insurance">Insurance</option>
                                            )}
                                            {!quoteVisibleFields.insuranceAddons && (
                                                <option value="insuranceAddons">Insurance Add-ons</option>
                                            )}
                                            {!quoteVisibleFields.hypothecation && (
                                                <option value="hypothecation">Hypothecation</option>
                                            )}
                                            {!quoteVisibleFields.transportation && (
                                                <option value="transportation">Transportation</option>
                                            )}
                                        </select>
                                        <button
                                            type="button"
                                            disabled={isQuoteLocked || !quoteAddField}
                                            onClick={() => {
                                                if (!quoteAddField) return;
                                                setQuoteVisibleFields(prev => ({ ...prev, [quoteAddField]: true }));
                                                setQuoteAddField('');
                                            }}
                                            className="h-10 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_1fr_180px] gap-3 p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            Label
                                        </p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            Rate
                                        </p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            Offer Amount
                                        </p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">
                                            Surge/Discount
                                        </p>
                                    </div>
                                    {(
                                        [
                                            { key: 'exShowroom', label: 'Ex Showroom' },
                                            { key: 'registration', label: 'Registration' },
                                            { key: 'insurance', label: 'Insurance' },
                                            { key: 'insuranceAddons', label: 'Insurance Add-ons' },
                                            { key: 'hypothecation', label: 'Hypothecation' },
                                            { key: 'transportation', label: 'Transportation' },
                                        ] as const
                                    )
                                        .filter(row => quoteVisibleFields[row.key])
                                        .map(row => {
                                            const included =
                                                includedQuoteFields[row.key as keyof typeof includedQuoteFields];
                                            const isMandatory = row.key === 'exShowroom';
                                            const rateMap = {
                                                exShowroom: costSummary.exShowroom,
                                                registration: costSummary.registration,
                                                insurance: costSummary.insurance,
                                                insuranceAddons: costSummary.insuranceAddons,
                                                hypothecation: costSummary.hypothecation,
                                                transportation: costSummary.transportation,
                                            } as const;
                                            const rateValue = Number(rateMap[row.key] || 0);
                                            const offerValue = included ? Number(editableQuoteValues[row.key] || 0) : 0;
                                            const variance = offerValue - rateValue;
                                            return (
                                                <div
                                                    key={row.key}
                                                    className="grid grid-cols-1 md:grid-cols-[220px_1fr_1fr_180px] gap-3 p-4 border-b border-slate-100 dark:border-white/10 items-center"
                                                >
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                        {row.label}
                                                    </p>
                                                    <p className="text-base font-black text-slate-900 dark:text-white">
                                                        {formatCurrency(rateValue)}
                                                    </p>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={editableQuoteValues[row.key]}
                                                            onChange={e =>
                                                                setEditableQuoteValues(prev => ({
                                                                    ...prev,
                                                                    [row.key]: Math.max(0, Number(e.target.value || 0)),
                                                                }))
                                                            }
                                                            disabled={isQuoteLocked}
                                                            className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                                                        />
                                                        <div className="mt-2 flex items-center justify-end">
                                                            <input
                                                                type="checkbox"
                                                                checked={isMandatory ? false : !included}
                                                                disabled={isQuoteLocked || isMandatory}
                                                                onChange={e => {
                                                                    const excluded = e.target.checked;
                                                                    setIncludedQuoteFields(prev => ({
                                                                        ...prev,
                                                                        [row.key]: !excluded,
                                                                    }));
                                                                }}
                                                                className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p
                                                        className={`text-sm font-black text-right ${
                                                            variance < 0
                                                                ? 'text-emerald-600 dark:text-emerald-300'
                                                                : variance > 0
                                                                  ? 'text-amber-600 dark:text-amber-300'
                                                                  : 'text-slate-500 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {variance < 0
                                                            ? `Discount ${formatCurrency(Math.abs(variance))}`
                                                            : variance > 0
                                                              ? `Surge ${formatCurrency(variance)}`
                                                              : '—'}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_180px] gap-3 p-4 items-center bg-emerald-50 dark:bg-emerald-500/10">
                                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                            Final Offer
                                        </p>
                                        {editableQuoteFields.grandTotal && !isQuoteLocked ? (
                                            <input
                                                type="number"
                                                min={0}
                                                value={editableQuoteValues.grandTotal}
                                                onChange={e =>
                                                    setEditableQuoteValues(prev => ({
                                                        ...prev,
                                                        grandTotal: Math.max(0, Number(e.target.value || 0)),
                                                    }))
                                                }
                                                disabled={isQuoteLocked}
                                                className="h-10 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-900/50 px-3 text-sm font-black text-emerald-700 dark:text-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-60"
                                            />
                                        ) : null}
                                        <div className="flex justify-end" />
                                    </div>
                                </div>
                                {postOfferAdditions.length > 0 && (
                                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                                            Added Later (Not In Original Offer)
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {postOfferAdditions.map(item => (
                                                <span
                                                    key={item.label}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700 border border-amber-200"
                                                >
                                                    {item.label}: {formatCurrency(item.amount)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {request.status === 'ORDERED' && primaryPo?.po_status !== 'RECEIVED' && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-2">
                    <Clock size={14} />
                    To move requisition to RECEIVED, complete stock receipt (GRN) from the linked purchase order.
                </div>
            )}

            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={() => router.push(requisitionsBasePath)}
                    className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-black uppercase tracking-wider transition-all"
                >
                    Back to Requisitions
                </button>
                <div className="flex items-center gap-3">
                    {request.status !== 'RECEIVED' && request.status !== 'CANCELLED' && (
                        <button
                            onClick={handleCancelRequest}
                            disabled={isCancelling || selectingQuoteId !== null}
                            className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/30 disabled:opacity-50 text-xs font-black uppercase tracking-wider transition-all"
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel Requisition'}
                        </button>
                    )}
                    <button
                        onClick={handleNextStage}
                        disabled={
                            selectingQuoteId !== null ||
                            request.status === 'RECEIVED' ||
                            request.status === 'CANCELLED' ||
                            (request.status === 'QUOTING' && !canAdvanceToOrdered)
                        }
                        className="px-5 py-3 rounded-2xl bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed"
                    >
                        {selectingQuoteId ? 'Processing...' : nextActionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
