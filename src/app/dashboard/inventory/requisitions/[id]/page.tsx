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
    Trash2,
    Pencil,
    Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant/tenantContext';
import { fetchSkuDisplayMap } from '@/lib/inventory/skuDisplay';
import QuotePanel from './components/QuotePanel';
import GrnMediaGallery, { type GrnMediaItem } from '@/components/inventory/GrnMediaGallery';

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
    display_id?: string | null;
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
    transporter_name?: string | null;
    docket_number?: string | null;
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
type DealerOption = { id: string; name: string };
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
const classifyCostBucket = (costType: string) => {
    const key = (costType || '').toUpperCase();
    if (key.includes('EX_SHOWROOM') || key === 'EXSHOWROOM') return 'exShowroom';
    if (key.includes('HYPOTH')) return 'hypothecation';
    if (key.includes('RTO') || key.includes('REGISTRATION')) return 'registration';
    if (key.includes('TRANSPORT')) return 'transportation';
    if (key.includes('INSURANCE')) {
        if (key.includes('ZD') || key.includes('ZERO_DEPR') || key.includes('DEPR')) return 'depreciationWaiver';
        if (key.includes('ADDON') || key.includes('ADD_ON')) return 'insuranceAddons';
        return 'insurance';
    }
    return 'other';
};
const formatTripletId = (raw?: string | null) => {
    if (!raw) return 'NA';
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 9)}`;
};

// ── VIN Manufacturing Date Decoder ─────────────────────────────────────────
// Year  → position 10 (index 9)  — ISO 3779 standard, all brands
// Month → position 9  (index 8)  Honda (ME4) only — encodes month before year
//         position 11 (index 10) Yamaha (ME1), Hero (MBL), TVS (MD6), Bajaj (MD2), RE (ME3)
//         Note: Yamaha uses pos-11 as plant code, not month — will fall back to Jan
const VIN_YEAR_MAP: Record<string, number> = {
    A: 1980,
    B: 1981,
    C: 1982,
    D: 1983,
    E: 1984,
    F: 1985,
    G: 1986,
    H: 1987,
    J: 1988,
    K: 1989,
    L: 1990,
    M: 1991,
    N: 1992,
    P: 1993,
    R: 1994,
    S: 1995,
    T: 1996,
    V: 1997,
    W: 1998,
    X: 1999,
    Y: 2000,
    '1': 2001,
    '2': 2002,
    '3': 2003,
    '4': 2004,
    '5': 2005,
    '6': 2006,
    '7': 2007,
    '8': 2008,
    '9': 2009,
    // post-2009 same letters repeat
    a: 2010,
    b: 2011,
    c: 2012,
    d: 2013,
    e: 2014,
    f: 2015,
    g: 2016,
    h: 2017,
    j: 2018,
    k: 2019,
    l: 2020,
    m: 2021,
    n: 2022,
    p: 2023,
    r: 2024,
    s: 2025,
    t: 2026,
    v: 2027,
};
const VIN_MONTH_MAP: Record<string, string> = {
    A: '01',
    B: '02',
    C: '03',
    D: '04',
    E: '05',
    F: '06',
    G: '07',
    H: '08',
    J: '09',
    K: '10',
    N: '11',
    P: '12',
};
function decodeVinMfgDate(vin: string): string | null {
    const v = vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length !== 17) return null;
    const wmi = v.slice(0, 3);
    const yearChar = v[9];
    let year = VIN_YEAR_MAP[yearChar];
    if (!year) return null;
    // VIN year letters cycle every 30 years (A=1980/2010, T=1996/2026).
    // Since this system handles current inventory (2010+), prefer 2nd cycle
    // for letter-based codes that would otherwise fall before 2004.
    const isLetter = /[A-Z]/.test(yearChar);
    if (isLetter && year < 2004) year += 30;
    // Month position varies by brand:
    //  Honda (ME4) : position 9 (index 8) — Honda encodes month before year
    //  Others       : position 11 (index 10) — Yamaha (ME1), Hero (MBL), TVS (MD6), Bajaj (MD2), RE (ME3)
    //  Note: if pos-11 is not a valid month code (e.g. Yamaha plant code), falls back to Jan
    const monthChar = wmi === 'ME4' ? v[8] : v[10];
    const month = VIN_MONTH_MAP[monthChar] ?? '01';
    return `${year}-${month}-01`; // day defaults to 01; user can refine
}

const formatAddonLabelFromKey = (rawKey: string) =>
    rawKey
        .replace(/^addon_/, '')
        .replace(/_total_amount$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
const formatCostTypeLabel = (value?: string | null) =>
    String(value || 'Item')
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

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
    const [isCreatingNewQuote, setIsCreatingNewQuote] = useState(false);
    const [showQuoteEditor, setShowQuoteEditor] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState<string>('');
    const [dealerOptions, setDealerOptions] = useState<DealerOption[]>([]);
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
    const [quoteAddField, setQuoteAddField] = useState<string>('');
    const [showAddItemSelector, setShowAddItemSelector] = useState(false);
    const [customInsuranceAddons, setCustomInsuranceAddons] = useState<
        Array<{ id: string; label: string; offer: number }>
    >([]);
    const [insuranceAddonCatalogOptions, setInsuranceAddonCatalogOptions] = useState<
        Array<{ key: string; label: string; total: number }>
    >([]);
    const [registrationCatalogOptions, setRegistrationCatalogOptions] = useState<
        Array<{ key: 'state' | 'bharat' | 'company'; label: string; total: number }>
    >([]);
    const [selectedRegistrationOption, setSelectedRegistrationOption] = useState<{
        key: 'state' | 'bharat' | 'company';
        label: string;
        total: number;
    } | null>(null);
    const [quoteRowEditMode, setQuoteRowEditMode] = useState<
        Record<
            'exShowroom' | 'registration' | 'insurance' | 'insuranceAddons' | 'hypothecation' | 'transportation',
            boolean
        >
    >({
        exShowroom: false,
        registration: false,
        insurance: false,
        insuranceAddons: false,
        hypothecation: false,
        transportation: false,
    });
    const [quoteRowSelected, setQuoteRowSelected] = useState<
        Record<
            'exShowroom' | 'registration' | 'insurance' | 'insuranceAddons' | 'hypothecation' | 'transportation',
            boolean
        >
    >({
        exShowroom: true,
        registration: true,
        insurance: true,
        insuranceAddons: true,
        hypothecation: true,
        transportation: true,
    });
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
    const [dispatchDetails, setDispatchDetails] = useState<{
        dispatchId: string;
        supplier: string;
        supplierId: string;
        warehouse: string;
        warehouseId: string;
        transporterName: string;
        transporterContact: string;
        chassisNumber: string;
        engineNumber: string;
        deliveryNote: string;
        warehouseInchargeName: string;
        warehouseInchargeContact: string;
        dispatchDate: string;
        dispatchDocUrl: string;
        supplierWarehouseId: string;
        supplierWarehouseName: string;
    }>({
        dispatchId: 'NA',
        supplier: 'NA',
        supplierId: '',
        warehouse: 'NA',
        warehouseId: '',
        transporterName: 'NA',
        transporterContact: 'NA',
        chassisNumber: 'NA',
        engineNumber: 'NA',
        deliveryNote: 'NA',
        warehouseInchargeName: 'NA',
        warehouseInchargeContact: 'NA',
        dispatchDate: '',
        dispatchDocUrl: '',
        supplierWarehouseId: '',
        supplierWarehouseName: '',
    });
    const [dispatchEditMode, setDispatchEditMode] = useState(false);
    const [isSavingDispatch, setIsSavingDispatch] = useState(false);
    const [isMovingDispatch, setIsMovingDispatch] = useState(false);
    const [warehouseOptions, setWarehouseOptions] = useState<Array<{ id: string; name: string }>>([]);
    const [supplierWarehouseOptions, setSupplierWarehouseOptions] = useState<
        Array<{
            id: string;
            name: string;
            managerName: string;
            managerPhone: string;
            contactPhone: string;
        }>
    >([]);

    // GRN (Receiving) inline form state
    const [grnBranchId, setGrnBranchId] = useState('');
    const [grnChassisNumber, setGrnChassisNumber] = useState('');
    const [grnEngineNumber, setGrnEngineNumber] = useState('');
    const [grnBatteryMake, setGrnBatteryMake] = useState('');
    const [grnBatteryType, setGrnBatteryType] = useState('');
    const [grnKeyNumber, setGrnKeyNumber] = useState('');
    const [grnBatteryNumber, setGrnBatteryNumber] = useState('');
    const [grnMfgDate, setGrnMfgDate] = useState('');
    const [grnQcNotes, setGrnQcNotes] = useState('');
    const [grnMediaItems, setGrnMediaItems] = useState<GrnMediaItem[]>([]);
    const [skuBatteryType, setSkuBatteryType] = useState<string | null>(null);
    const [isSubmittingGrn, setIsSubmittingGrn] = useState(false);
    // Received stock snapshot (shown after GRN is saved)
    const [receivedStock, setReceivedStock] = useState<Record<string, unknown> | null>(null);

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
                    .eq('id', request.created_by!)
                    .maybeSingle();
                setCreatedByName(data?.full_name || `User ${(request.created_by || '').slice(0, 6).toUpperCase()}`);
            } catch {
                setCreatedByName(`User ${(request.created_by || '').slice(0, 6).toUpperCase()}`);
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
        const currentPo = request?.inv_purchase_orders?.[0] || null;
        if (!currentPo?.id) {
            setDispatchDetails({
                dispatchId: 'NA',
                supplier: 'NA',
                supplierId: '',
                warehouse: 'NA',
                warehouseId: '',
                transporterName: 'NA',
                transporterContact: 'NA',
                chassisNumber: 'NA',
                engineNumber: 'NA',
                deliveryNote: 'NA',
                warehouseInchargeName: 'NA',
                warehouseInchargeContact: 'NA',
                dispatchDate: '',
                dispatchDocUrl: '',
                supplierWarehouseId: '',
                supplierWarehouseName: '',
            });
            return;
        }
        const hydrateDispatchDetails = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const transporterName = currentPo.transporter_name || 'NA';
                const deliveryNote = currentPo.docket_number || 'NA';
                let dispatchId = formatTripletId(currentPo.display_id || currentPo.id);
                const selectedFromRequest =
                    (request?.inv_dealer_quotes || []).find((q: any) => q.status === 'SELECTED') || null;
                const supplierId = selectedFromRequest?.dealer_tenant_id || (currentPo as any).supplier_tenant_id || '';
                const supplier = parseTenantRef(selectedFromRequest?.id_tenants)?.name || 'NA';
                let warehouseInchargeName = 'NA';
                let warehouseInchargeContact = 'NA';

                if (supplierId) {
                    const { data: supplierTenant } = await (supabase as any)
                        .from('id_tenants')
                        .select('name, phone')
                        .eq('id', supplierId)
                        .maybeSingle();
                    warehouseInchargeName = supplierTenant?.name || 'NA';
                    warehouseInchargeContact = supplierTenant?.phone || 'NA';
                }

                // Primary: fetch all dispatch fields from inv_purchase_orders
                // (chassis/engine saved here at dispatch stage before stock receipt)
                const { data: poExtra } = await (supabase as any)
                    .from('inv_purchase_orders')
                    .select(
                        'transporter_contact, dispatch_date, dispatch_doc_url, supplier_warehouse, supplier_warehouse_id, chassis_number, engine_number, receiving_branch_id'
                    )
                    .eq('id', currentPo.id)
                    .maybeSingle();

                let chassisNumber = poExtra?.chassis_number || 'NA';
                let engineNumber = poExtra?.engine_number || 'NA';
                let warehouse = 'NA';
                let warehouseId = poExtra?.receiving_branch_id || '';

                // Load receiving warehouse name from PO's receiving_branch_id
                if (warehouseId) {
                    const { data: recLoc } = await (supabase as any)
                        .from('id_locations')
                        .select('name')
                        .eq('id', warehouseId)
                        .maybeSingle();
                    warehouse = recLoc?.name || 'NA';
                }

                // Secondary: if inv_stock exists (post-GRN), override with confirmed values
                const { data: stockRow } = await (supabase as any)
                    .from('inv_stock')
                    .select(
                        'id, chassis_number, engine_number, key_number, battery_make, battery_type, battery_number, manufacturing_date, qc_notes, media_chassis_url, media_engine_url, media_sticker_url, media_vehicle_url, media_qc_video_url, media_gallery, branch_id, created_at'
                    )
                    .eq('po_id', currentPo.id)
                    .limit(1)
                    .maybeSingle();

                if (stockRow) {
                    setReceivedStock(stockRow); // store full row for display
                    dispatchId = formatTripletId(stockRow.id);
                    chassisNumber = stockRow.chassis_number || chassisNumber;
                    engineNumber = stockRow.engine_number || engineNumber;
                    if (stockRow.branch_id) {
                        const { data: location } = await (supabase as any)
                            .from('id_locations')
                            .select('name, contact_phone, manager_id')
                            .eq('id', stockRow.branch_id)
                            .maybeSingle();
                        warehouse = location?.name || warehouse;
                        warehouseId = stockRow.branch_id || warehouseId;
                    }
                }

                // Resolve supplier warehouse name if we have an ID
                let supplierWarehouseId = poExtra?.supplier_warehouse_id || '';
                let supplierWarehouseName = poExtra?.supplier_warehouse || '';
                if (supplierWarehouseId && !supplierWarehouseName) {
                    const { data: swLoc } = await (supabase as any)
                        .from('id_locations')
                        .select('name')
                        .eq('id', supplierWarehouseId)
                        .maybeSingle();
                    supplierWarehouseName = swLoc?.name || '';
                }

                setDispatchDetails({
                    dispatchId,
                    supplier,
                    supplierId,
                    warehouse,
                    warehouseId,
                    transporterName,
                    transporterContact: poExtra?.transporter_contact || 'NA',
                    chassisNumber,
                    engineNumber,
                    deliveryNote,
                    warehouseInchargeName,
                    warehouseInchargeContact,
                    dispatchDate: poExtra?.dispatch_date ? poExtra.dispatch_date.slice(0, 16) : '',
                    dispatchDocUrl: poExtra?.dispatch_doc_url || '',
                    supplierWarehouseId,
                    supplierWarehouseName,
                });
            } catch {
                setDispatchDetails({
                    dispatchId: formatTripletId(currentPo.display_id || currentPo.id),
                    supplier:
                        parseTenantRef(
                            (request?.inv_dealer_quotes || []).find((q: any) => q.status === 'SELECTED')?.id_tenants
                        )?.name || 'NA',
                    supplierId:
                        (request?.inv_dealer_quotes || []).find((q: any) => q.status === 'SELECTED')
                            ?.dealer_tenant_id || '',
                    warehouse: 'NA',
                    warehouseId: '',
                    transporterName: currentPo.transporter_name || 'NA',
                    transporterContact: 'NA',
                    chassisNumber: 'NA',
                    engineNumber: 'NA',
                    deliveryNote: currentPo.docket_number || 'NA',
                    warehouseInchargeName: 'NA',
                    warehouseInchargeContact: 'NA',
                    dispatchDate: '',
                    dispatchDocUrl: '',
                    supplierWarehouseId: '',
                    supplierWarehouseName: '',
                });
            }
        };
        hydrateDispatchDetails();
    }, [request?.inv_purchase_orders, request?.inv_dealer_quotes]);

    useEffect(() => {
        if (!request?.tenant_id) {
            setWarehouseOptions([]);
            return;
        }
        const hydrateWarehouses = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data } = await (supabase as any)
                    .from('id_locations')
                    .select('id, name')
                    .eq('tenant_id', request.tenant_id)
                    .eq('is_active', true)
                    .order('name');
                const options = ((data || []) as Array<{ id: string; name: string }>).filter(Boolean);
                setWarehouseOptions(options);
            } catch {
                setWarehouseOptions([]);
            }
        };
        hydrateWarehouses();
    }, [request?.tenant_id]);

    // Fetch SKU battery spec for GRN auto-populate
    useEffect(() => {
        if (!request?.sku_id) return;
        (async () => {
            try {
                const { getSkuBatterySpec } = await import('@/actions/inventory');
                const result = await getSkuBatterySpec(request.sku_id!);
                const spec = result.data as { battery_type?: string | null } | null;
                if (result.success && spec?.battery_type) {
                    setSkuBatteryType(spec.battery_type);
                    setGrnBatteryType(spec.battery_type);
                }
            } catch {
                /* silent */
            }
        })();
    }, [request?.sku_id]);

    // Fetch supplier's warehouses from their id_locations
    useEffect(() => {
        const supplierId =
            (request?.inv_dealer_quotes || []).find((q: any) => q.status === 'SELECTED')?.dealer_tenant_id || '';
        if (!supplierId) {
            setSupplierWarehouseOptions([]);
            return;
        }
        const hydrateSupplierWarehouses = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data: locs } = await (supabase as any)
                    .from('id_locations')
                    .select('id, name, type, contact_phone, manager_id')
                    .eq('tenant_id', supplierId)
                    .eq('type', 'WAREHOUSE')
                    .eq('is_active', true)
                    .order('name');

                const locsArr = (locs || []) as Array<{
                    id: string;
                    name: string;
                    contact_phone: string | null;
                    manager_id: string | null;
                }>;

                // Fetch manager names in parallel
                const managerIds = locsArr.map(l => l.manager_id).filter(Boolean) as string[];
                let managerMap: Record<string, { full_name: string; phone: string }> = {};
                if (managerIds.length > 0) {
                    const { data: managers } = await (supabase as any)
                        .from('id_members')
                        .select('id, full_name, phone')
                        .in('id', managerIds);
                    for (const m of managers || []) {
                        managerMap[m.id] = { full_name: m.full_name, phone: m.phone };
                    }
                }

                setSupplierWarehouseOptions(
                    locsArr.map(l => ({
                        id: l.id,
                        name: l.name,
                        managerName: l.manager_id ? managerMap[l.manager_id]?.full_name || '' : '',
                        managerPhone: l.manager_id ? managerMap[l.manager_id]?.phone || '' : '',
                        contactPhone: l.contact_phone || '',
                    }))
                );
            } catch {
                setSupplierWarehouseOptions([]);
            }
        };
        hydrateSupplierWarehouses();
    }, [request?.inv_dealer_quotes]);

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

    useEffect(() => {
        if (!request?.sku_id) {
            setInsuranceAddonCatalogOptions([]);
            setRegistrationCatalogOptions([]);
            setSelectedRegistrationOption(null);
            return;
        }
        const hydrateInsuranceAddonOptions = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data } = await (supabase as any)
                    .from('cat_price_state_mh')
                    .select('*')
                    .eq('sku_id', request.sku_id)
                    .eq('state_code', 'MH')
                    .eq('publish_stage', 'PUBLISHED')
                    .limit(1)
                    .maybeSingle();
                if (!data) {
                    setInsuranceAddonCatalogOptions([]);
                    setRegistrationCatalogOptions([]);
                    setSelectedRegistrationOption(null);
                    return;
                }
                const registrationOptions: Array<{
                    key: 'state' | 'bharat' | 'company';
                    label: string;
                    total: number;
                }> = [
                    { key: 'state', label: 'Registration (State)', total: Number(data.rto_total_state || 0) },
                    { key: 'bharat', label: 'Registration (Bharat)', total: Number(data.rto_total_bh || 0) },
                    { key: 'company', label: 'Registration (Company)', total: Number(data.rto_total_company || 0) },
                ];
                setRegistrationCatalogOptions(registrationOptions.filter(item => item.total >= 0));
                setSelectedRegistrationOption(
                    registrationOptions.find(item => item.total > 0) || registrationOptions[0] || null
                );
                const options = Object.keys(data)
                    .filter(key => key.startsWith('addon_') && key.endsWith('_total_amount'))
                    .map(key => ({
                        key,
                        label: formatAddonLabelFromKey(key),
                        total: Number(data[key] || 0),
                    }))
                    .filter(item => item.label.length > 0);
                setInsuranceAddonCatalogOptions(options);
            } catch {
                setInsuranceAddonCatalogOptions([]);
                setRegistrationCatalogOptions([]);
                setSelectedRegistrationOption(null);
            }
        };
        hydrateInsuranceAddonOptions();
    }, [request?.sku_id]);

    useEffect(() => {
        const hydrateDealers = async () => {
            try {
                const { getSupplierTenants } = await import('@/actions/inventory');
                const result = await getSupplierTenants();
                const list = (result.success && Array.isArray(result.data) ? result.data : []) as Array<{
                    id: string;
                    name: string | null;
                    type?: string | null;
                }>;
                const mapped = list
                    .filter(item => {
                        const tenantType = String(item.type || '').toUpperCase();
                        return tenantType === 'DEALER' || tenantType === 'DEALERSHIP';
                    })
                    .filter(item => item.id !== tenantId)
                    .map(item => ({ id: item.id, name: item.name || `Dealer ${item.id.slice(0, 8)}` }));
                setDealerOptions(mapped);
            } catch {
                setDealerOptions([]);
            }
        };
        hydrateDealers();
    }, [tenantId]);

    const requestItems = request?.inv_request_items ?? EMPTY_REQUEST_ITEMS;
    const quotes = useMemo(() => (request?.inv_dealer_quotes || []).slice(), [request?.inv_dealer_quotes]);
    const purchaseOrders = request?.inv_purchase_orders || [];
    const selectedDealerQuoteStatus = quotes.find(q => q.dealer_tenant_id === selectedDealer)?.status;
    const canEditIssuedQuote =
        request?.status === 'ORDERED' && selectedDealerQuoteStatus === 'SELECTED' && linkedStockStatuses.length === 0;
    const isQuoteLocked = !(request?.status === 'QUOTING' || canEditIssuedQuote);

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
            const key = classifyCostBucket(item.cost_type);
            const amount = Number(item.expected_amount || 0);
            if (key === 'exShowroom') {
                summary.exShowroom += amount;
                continue;
            }
            if (key === 'hypothecation') {
                summary.hypothecation += amount;
                continue;
            }
            if (key === 'registration') {
                summary.registration += amount;
                continue;
            }
            if (key === 'transportation') {
                summary.transportation += amount;
                continue;
            }
            if (key === 'depreciationWaiver') {
                summary.depreciationWaiver += amount;
                continue;
            }
            if (key === 'insuranceAddons') {
                summary.insuranceAddons += amount;
                continue;
            }
            if (key === 'insurance') {
                summary.insurance += amount;
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
        setQuoteRowEditMode({
            exShowroom: false,
            registration: false,
            insurance: false,
            insuranceAddons: false,
            hypothecation: false,
            transportation: false,
        });
        setQuoteRowSelected({
            exShowroom: true,
            registration: true,
            insurance: true,
            insuranceAddons: true,
            hypothecation: true,
            transportation: true,
        });
        setQuoteAddField('');
        setShowAddItemSelector(false);
        setCustomInsuranceAddons([]);
    }, [request?.id]);

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
        const baseTotal = keys.reduce((sum, key) => {
            if (key === 'depreciationWaiver') return sum;
            if (!quoteVisibleFields[key as keyof typeof quoteVisibleFields]) return sum;
            if (!quoteRowSelected[key as keyof typeof quoteRowSelected]) return sum;
            return includedQuoteFields[key] ? sum + Number(editableQuoteValues[key] || 0) : sum;
        }, 0);
        const addonsTotal = customInsuranceAddons.reduce((sum, addon) => sum + Number(addon.offer || 0), 0);
        return baseTotal + addonsTotal;
    }, [editableQuoteValues, includedQuoteFields, quoteVisibleFields, customInsuranceAddons, quoteRowSelected]);

    const quoteFinalOffer = Number(editableQuoteValues.grandTotal || 0);
    const [isSavingQuote, setIsSavingQuote] = useState(false);
    const [isIssuingPo, setIsIssuingPo] = useState(false);
    const [quoteWorkflowStage, setQuoteWorkflowStage] = useState<
        Record<string, 'saved' | 'reviewed' | 'approved' | 'issued'>
    >({});
    const [poReviewState, setPoReviewState] = useState<Record<string, boolean>>({});
    const [isOfferPriceEditing, setIsOfferPriceEditing] = useState(false);
    const [isSupplierEditing, setIsSupplierEditing] = useState(false);
    const isExOnlySelected =
        quoteVisibleFields.exShowroom &&
        quoteRowSelected.exShowroom &&
        !quoteRowSelected.registration &&
        !quoteRowSelected.insurance &&
        !quoteRowSelected.insuranceAddons &&
        !quoteRowSelected.hypothecation &&
        !quoteRowSelected.transportation;
    const isExRegInsSelected =
        quoteVisibleFields.exShowroom &&
        quoteVisibleFields.registration &&
        quoteVisibleFields.insurance &&
        quoteRowSelected.exShowroom &&
        quoteRowSelected.registration &&
        quoteRowSelected.insurance;

    const requestItemsByBucket = useMemo(() => {
        const buckets: Record<string, RequestItem[]> = {
            exShowroom: [],
            registration: [],
            insurance: [],
            insuranceAddons: [],
            hypothecation: [],
            transportation: [],
            depreciationWaiver: [],
            other: [],
        };
        for (const item of requestItems) {
            const bucket = classifyCostBucket(item.cost_type);
            buckets[bucket] = [...(buckets[bucket] || []), item];
        }
        return buckets;
    }, [requestItems]);

    useEffect(() => {
        if (!request) return;
        if (!selectedDealer) return;
        const dealerQuote = quotes.find(q => q.dealer_tenant_id === selectedDealer);
        if (!dealerQuote) return;

        const idToBucket = new Map<string, string>();
        for (const item of requestItems) {
            idToBucket.set(item.id, classifyCostBucket(item.cost_type));
        }

        const bucketTotals: Record<string, number> = {
            exShowroom: 0,
            registration: 0,
            insurance: 0,
            insuranceAddons: 0,
            hypothecation: 0,
            transportation: Number(dealerQuote.transport_amount || 0),
        };

        const lineItems = dealerQuote.inv_quote_line_items || [];
        for (const line of lineItems) {
            const bucket = idToBucket.get(line.request_item_id);
            if (!bucket || !(bucket in bucketTotals)) continue;
            bucketTotals[bucket] += Number(line.offered_amount || 0);
        }

        setEditableQuoteValues(prev => ({
            ...prev,
            exShowroom: bucketTotals.exShowroom || prev.exShowroom,
            registration: bucketTotals.registration || prev.registration,
            insurance: bucketTotals.insurance || prev.insurance,
            insuranceAddons: bucketTotals.insuranceAddons || prev.insuranceAddons,
            hypothecation: bucketTotals.hypothecation || prev.hypothecation,
            transportation: bucketTotals.transportation || prev.transportation,
            grandTotal: Number(getQuoteTotal(dealerQuote) || prev.grandTotal),
        }));

        setQuoteVisibleFields(prev => ({
            ...prev,
            exShowroom: true,
            registration: bucketTotals.registration > 0 || prev.registration,
            insurance: bucketTotals.insurance > 0 || prev.insurance,
            insuranceAddons: bucketTotals.insuranceAddons > 0 || prev.insuranceAddons,
            hypothecation: bucketTotals.hypothecation > 0 || prev.hypothecation,
            transportation: bucketTotals.transportation > 0 || prev.transportation,
        }));
    }, [quotes, request, requestItems, selectedDealer]);

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
        if (dealerOptions.length > 0) return dealerOptions;
        const fallbackMap = new Map<string, DealerOption>();
        for (const q of quotes) {
            if (!q.dealer_tenant_id) continue;
            const fallbackName = parseTenantRef(q.id_tenants)?.name || `Dealer ${q.dealer_tenant_id.slice(0, 8)}`;
            fallbackMap.set(q.dealer_tenant_id, { id: q.dealer_tenant_id, name: fallbackName });
        }
        return Array.from(fallbackMap.values());
    }, [dealerOptions, quotes]);
    const activeQuoteDealerIdSet = useMemo(
        () => new Set(quotes.filter(q => q.status !== 'REJECTED').map(q => q.dealer_tenant_id)),
        [quotes]
    );
    const availableDealerOptionsForNewQuote = useMemo(
        () => quoteDealerOptions.filter(option => !activeQuoteDealerIdSet.has(option.id)),
        [activeQuoteDealerIdSet, quoteDealerOptions]
    );
    const existingQuoteSummaries = useMemo(
        () =>
            quotes.map(q => {
                const dealerName =
                    parseTenantRef(q.id_tenants)?.name ||
                    quoteDealerOptions.find(option => option.id === q.dealer_tenant_id)?.name ||
                    `Dealer ${q.dealer_tenant_id.slice(0, 8)}`;
                const items = (q.inv_quote_line_items || [])
                    .map(line => requestItems.find(item => item.id === line.request_item_id)?.cost_type || '')
                    .filter(Boolean);
                return {
                    id: q.id,
                    displayId: q.display_id || null,
                    dealerTenantId: q.dealer_tenant_id,
                    dealerName,
                    total: getQuoteTotal(q),
                    items: Array.from(new Set(items)).slice(0, 4),
                    status: q.status,
                };
            }),
        [quotes, quoteDealerOptions, requestItems]
    );
    const bestOfferQuoteId = useMemo(() => {
        if (!existingQuoteSummaries.length) return '';
        return existingQuoteSummaries.slice().sort((a, b) => a.total - b.total)[0]?.id || '';
    }, [existingQuoteSummaries]);

    const addItemOptions = useMemo(() => {
        const options: Array<{ key: string; label: string }> = [];
        if (!quoteVisibleFields.registration) {
            for (const option of registrationCatalogOptions) {
                options.push({ key: `registration:${option.key}`, label: option.label });
            }
        }
        if (!quoteVisibleFields.insurance) {
            options.push({ key: 'insurance', label: 'Insurance (Comprehensive + Liability)' });
        }
        for (const option of insuranceAddonCatalogOptions) {
            options.push({ key: `insuranceAddon:${option.key}`, label: option.label });
        }
        if (!quoteVisibleFields.hypothecation) {
            options.push({ key: 'hypothecation', label: 'Hypothecation' });
        }
        if (!quoteVisibleFields.transportation) {
            options.push({ key: 'transportation', label: 'Transportation' });
        }
        return options;
    }, [insuranceAddonCatalogOptions, quoteVisibleFields, registrationCatalogOptions]);

    const selectedAddItem = useMemo(() => {
        const q = quoteAddField.trim().toLowerCase();
        if (!q) return null;
        return (
            addItemOptions.find(option => option.label.toLowerCase() === q) ||
            addItemOptions.find(option => option.key.toLowerCase() === q) ||
            null
        );
    }, [addItemOptions, quoteAddField]);
    const selectedSupplierName = quoteDealerOptions.find(option => option.id === selectedDealer)?.name || 'NA';
    const selectedDealerQuote = useMemo(
        () => quotes.find(q => q.dealer_tenant_id === selectedDealer && q.status !== 'REJECTED') || null,
        [quotes, selectedDealer]
    );
    const currentWorkflowStage: 'saved' | 'reviewed' | 'approved' | 'issued' = useMemo(() => {
        if (!selectedDealer) return 'saved';
        return quoteWorkflowStage[selectedDealer] || (selectedDealerQuote?.status === 'SELECTED' ? 'issued' : 'saved');
    }, [quoteWorkflowStage, selectedDealer, selectedDealerQuote?.status]);
    const poStatusLabel = useMemo(() => {
        if (!primaryPo) return 'Draft';
        if (primaryPo.po_status === 'DRAFT') return poReviewState[primaryPo.id] ? 'In Review' : 'Draft';
        return 'Issued';
    }, [poReviewState, primaryPo]);
    const isPoIssued = !!primaryPo && primaryPo.po_status !== 'DRAFT';
    const collapsedItemList = useMemo(() => {
        const items: string[] = [];
        if (quoteVisibleFields.exShowroom && quoteRowSelected.exShowroom) items.push('Ex Showroom');
        if (quoteVisibleFields.registration && quoteRowSelected.registration) {
            items.push(selectedRegistrationOption?.label || 'Registration');
        }
        if (quoteVisibleFields.insurance && quoteRowSelected.insurance) {
            items.push('Insurance');
        }
        if (quoteVisibleFields.insuranceAddons && quoteRowSelected.insuranceAddons) {
            items.push('Insurance Add-ons');
        }
        if (quoteVisibleFields.hypothecation && quoteRowSelected.hypothecation) {
            items.push('Hypothecation');
        }
        if (quoteVisibleFields.transportation && quoteRowSelected.transportation) {
            items.push('Transportation');
        }
        items.push(...customInsuranceAddons.map(addon => addon.label));
        return items;
    }, [customInsuranceAddons, quoteRowSelected, quoteVisibleFields, selectedRegistrationOption]);
    const coreCollapsedItems = useMemo(() => {
        const items: string[] = [];
        if (quoteVisibleFields.exShowroom && quoteRowSelected.exShowroom) items.push('Ex Showroom');
        if (quoteVisibleFields.registration && quoteRowSelected.registration) {
            items.push(selectedRegistrationOption?.label || 'Registration');
        }
        if (quoteVisibleFields.insurance && quoteRowSelected.insurance) items.push('Insurance');
        return items;
    }, [quoteRowSelected, quoteVisibleFields, selectedRegistrationOption]);
    const quoteVarianceAmount = Number(editableQuoteValues.grandTotal || 0) - Number(quoteComputedTotal || 0);

    useEffect(() => {
        if (!showQuoteEditor && !isCreatingNewQuote) {
            setSelectedDealer('');
            setIsSupplierEditing(false);
        }
    }, [showQuoteEditor, isCreatingNewQuote]);

    useEffect(() => {
        if (selectedDealerQuote?.status === 'SELECTED') {
            setShowQuoteEditor(false);
        }
    }, [selectedDealerQuote?.status]);

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
        if (request.status === 'RECEIVED' && terminalStageLabel !== 'RETURN') idx = Math.max(idx, 7);
        return idx;
    }, [primaryPo?.payment_status, primaryPo?.po_status, request?.source_type, request?.status, terminalStageLabel]);

    const canAdvanceToOrdered = !!request && request.status === 'QUOTING' && !!(selectedQuote || defaultNextQuote);

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
            setIsCreatingNewQuote(false);
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

    const handleSaveQuote = useCallback(async (): Promise<boolean> => {
        if (!request) return false;
        const localCanEditIssuedQuote =
            request.status === 'ORDERED' &&
            selectedDealerQuote?.status === 'SELECTED' &&
            linkedStockStatuses.length === 0;
        if (!(request.status === 'QUOTING' || localCanEditIssuedQuote)) {
            toast.error('Quote cannot be edited in current stage.');
            return false;
        }
        if (!selectedDealer) {
            toast.error('Select dealership first.');
            return false;
        }
        if (isCreatingNewQuote && activeQuoteDealerIdSet.has(selectedDealer)) {
            toast.error('This supplier already has a quote on this requisition. Choose another supplier.');
            return false;
        }

        const saveKeys: Array<
            'exShowroom' | 'registration' | 'insurance' | 'insuranceAddons' | 'hypothecation' | 'transportation'
        > = ['exShowroom', 'registration', 'insurance', 'insuranceAddons', 'hypothecation', 'transportation'];

        const lineItems: Array<{ request_item_id: string; offered_amount: number; notes?: string | null }> = [];
        for (const key of saveKeys) {
            if (!quoteVisibleFields[key]) continue;
            if (key === 'transportation') continue;
            const bucketItems = requestItemsByBucket[key] || [];
            if (!bucketItems.length) continue;
            const totalForBucket =
                key === 'insuranceAddons'
                    ? Math.max(0, Number(editableQuoteValues[key] || 0)) +
                      customInsuranceAddons.reduce((sum, addon) => sum + Number(addon.offer || 0), 0)
                    : Math.max(0, Number(editableQuoteValues[key] || 0));
            const perItem = bucketItems.length > 0 ? totalForBucket / bucketItems.length : 0;
            for (const item of bucketItems) {
                lineItems.push({
                    request_item_id: item.id,
                    offered_amount: Number(perItem.toFixed(2)),
                    notes: null,
                });
            }
        }

        const bundledItemIds = Array.from(new Set(lineItems.map(item => item.request_item_id)));
        const bundledAmount = Number(
            lineItems.reduce((sum, item) => sum + Number(item.offered_amount || 0), 0).toFixed(2)
        );
        const transportAmount = quoteVisibleFields.transportation
            ? Math.max(0, Number(editableQuoteValues.transportation || 0))
            : 0;

        setIsSavingQuote(true);
        try {
            const existing = quotes.find(q => q.dealer_tenant_id === selectedDealer && q.status === 'SUBMITTED');
            if (existing) {
                const { updateDealerQuote } = await import('@/actions/inventory');
                const result = await updateDealerQuote({
                    quote_id: existing.id,
                    bundled_item_ids: bundledItemIds,
                    bundled_amount: bundledAmount,
                    transport_amount: transportAmount,
                    line_items: lineItems,
                });
                if (!result.success) {
                    toast.error(result.message || 'Failed to update quote');
                    return false;
                }
                toast.success('Quote updated');
            } else {
                const { addDealerQuote } = await import('@/actions/inventory');
                const result = await addDealerQuote({
                    request_id: request.id,
                    dealer_tenant_id: selectedDealer,
                    bundled_item_ids: bundledItemIds,
                    bundled_amount: bundledAmount,
                    transport_amount: transportAmount,
                    line_items: lineItems,
                });
                if (!result.success) {
                    toast.error(result.message || 'Failed to save quote');
                    return false;
                }
                toast.success('Quote saved');
            }
            setQuoteWorkflowStage(prev => ({ ...prev, [selectedDealer]: 'saved' }));
            await fetchRequestDetail();
            return true;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to save quote');
            return false;
        } finally {
            setIsSavingQuote(false);
        }
    }, [
        editableQuoteValues,
        fetchRequestDetail,
        quoteVisibleFields,
        quotes,
        request,
        requestItemsByBucket,
        customInsuranceAddons,
        selectedDealer,
        isCreatingNewQuote,
        activeQuoteDealerIdSet,
        selectedDealerQuote?.status,
        linkedStockStatuses,
    ]);

    const handleDeleteQuote = useCallback(async () => {
        if (!request || !selectedDealer) {
            toast.error('Select quote supplier first.');
            return;
        }
        const targetQuote = quotes.find(q => q.dealer_tenant_id === selectedDealer && q.status === 'SUBMITTED');
        if (!targetQuote) {
            toast.error('No submitted quote found for selected supplier.');
            return;
        }
        try {
            const { deleteDealerQuote } = await import('@/actions/inventory');
            const result = await deleteDealerQuote(targetQuote.id);
            if (!result.success) {
                toast.error(result.message || 'Failed to delete quote');
                return;
            }
            toast.success(result.message || 'Quote deleted');
            setShowQuoteEditor(false);
            setIsCreatingNewQuote(false);
            setSelectedDealer('');
            await fetchRequestDetail();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete quote');
        }
    }, [fetchRequestDetail, quotes, request, selectedDealer]);

    const handleApproveQuote = useCallback(async () => {
        if (!selectedDealer) {
            toast.error('Select supplier first.');
            return;
        }
        const targetQuote = quotes.find(q => q.dealer_tenant_id === selectedDealer && q.status === 'SUBMITTED');
        if (!targetQuote) {
            toast.error('No submitted quote found for selected supplier.');
            return;
        }
        const saved = await handleSaveQuote();
        if (!saved) return;
        setQuoteWorkflowStage(prev => ({ ...prev, [selectedDealer]: 'approved' }));
        try {
            await handleSelectQuote(targetQuote.id);
            toast.success('Quote approved and PO generated');
        } catch {
            toast.error('Approval failed while generating PO');
        }
    }, [handleSaveQuote, handleSelectQuote, quotes, selectedDealer]);

    const handleReviewPo = useCallback(() => {
        if (!primaryPo?.id) {
            toast.error('No purchase order found.');
            return;
        }
        setPoReviewState(prev => ({ ...prev, [primaryPo.id]: true }));
        toast.success('PO reviewed');
    }, [primaryPo?.id]);

    const handleIssuePo = useCallback(async () => {
        if (!primaryPo?.id) {
            toast.error('No purchase order found.');
            return;
        }
        if (!poReviewState[primaryPo.id]) {
            toast.error('Review PO before issuing.');
            return;
        }
        if (primaryPo.po_status !== 'DRAFT') {
            toast.message(`PO already ${primaryPo.po_status}`);
            return;
        }
        setIsIssuingPo(true);
        try {
            const { updatePurchaseOrder } = await import('@/actions/inventory');
            const result = await updatePurchaseOrder({ po_id: primaryPo.id, po_status: 'SENT' });
            if (!result.success) {
                toast.error(result.message || 'Failed to issue PO');
                return;
            }
            toast.success('PO issued');
            await fetchRequestDetail();
        } finally {
            setIsIssuingPo(false);
        }
    }, [fetchRequestDetail, poReviewState, primaryPo]);

    const handleSaveDispatch = useCallback(async () => {
        if (!primaryPo?.id) {
            toast.error('No purchase order found.');
            return false;
        }
        setIsSavingDispatch(true);
        try {
            const { updateDispatchDetails } = await import('@/actions/inventory');
            const result = await updateDispatchDetails({
                po_id: primaryPo.id,
                transporter_name: dispatchDetails.transporterName === 'NA' ? null : dispatchDetails.transporterName,
                docket_number: dispatchDetails.deliveryNote === 'NA' ? null : dispatchDetails.deliveryNote,
                branch_id: dispatchDetails.warehouseId || null,
                chassis_number: dispatchDetails.chassisNumber === 'NA' ? null : dispatchDetails.chassisNumber,
                engine_number: dispatchDetails.engineNumber === 'NA' ? null : dispatchDetails.engineNumber,
                transporter_contact:
                    dispatchDetails.transporterContact === 'NA' ? null : dispatchDetails.transporterContact,
                dispatch_date: dispatchDetails.dispatchDate || null,
                dispatch_doc_url: dispatchDetails.dispatchDocUrl || null,
                supplier_warehouse_id: dispatchDetails.supplierWarehouseId || null,
                supplier_warehouse: dispatchDetails.supplierWarehouseName || null,
            });
            if (!result.success) {
                toast.error(result.message || 'Failed to update dispatch details');
                return false;
            }
            toast.success(result.message || 'Dispatch details updated');
            setDispatchEditMode(false);
            await fetchRequestDetail();
            return true;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update dispatch details');
            return false;
        } finally {
            setIsSavingDispatch(false);
        }
    }, [dispatchDetails, fetchRequestDetail, primaryPo?.id]);

    const handleMoveDispatchNext = useCallback(async () => {
        if (!primaryPo?.id) {
            toast.error('No purchase order found.');
            return;
        }
        setIsMovingDispatch(true);
        try {
            const saved = await handleSaveDispatch();
            if (!saved) return;
            const { updatePurchaseOrder } = await import('@/actions/inventory');
            const nextStatus =
                primaryPo.po_status === 'DRAFT' ? 'SENT' : primaryPo.po_status === 'SENT' ? 'SHIPPED' : null;
            if (!nextStatus) {
                toast.message(`PO already at ${primaryPo.po_status}`);
                return;
            }
            const result = await updatePurchaseOrder({ po_id: primaryPo.id, po_status: nextStatus as any });
            if (!result.success) {
                toast.error(result.message || 'Failed to move to next stage');
                return;
            }
            toast.success(`Moved to ${nextStatus}`);
            await fetchRequestDetail();
        } finally {
            setIsMovingDispatch(false);
        }
    }, [fetchRequestDetail, handleSaveDispatch, primaryPo]);

    useEffect(() => {
        if (!quotes.length) return;
        setQuoteWorkflowStage(prev => {
            const next = { ...prev };
            for (const q of quotes) {
                if (!q.dealer_tenant_id) continue;
                if (q.status === 'SELECTED') next[q.dealer_tenant_id] = 'issued';
                else if (q.status === 'SUBMITTED' && !next[q.dealer_tenant_id]) next[q.dealer_tenant_id] = 'saved';
            }
            return next;
        });
    }, [quotes]);

    const handleOfferPriceChange = useCallback(
        (rawValue: string) => {
            if (isQuoteLocked) return;
            const offerPrice = Math.max(0, Number(rawValue || 0));
            setEditableQuoteValues(prev => {
                const next = { ...prev, grandTotal: offerPrice };
                if (isExRegInsSelected) {
                    const regOffer = Number(next.registration || 0);
                    const insOffer = Number(next.insurance || 0);
                    const others =
                        (quoteVisibleFields.insuranceAddons && quoteRowSelected.insuranceAddons
                            ? Number(next.insuranceAddons || 0)
                            : 0) +
                        (quoteVisibleFields.hypothecation && quoteRowSelected.hypothecation
                            ? Number(next.hypothecation || 0)
                            : 0) +
                        (quoteVisibleFields.transportation && quoteRowSelected.transportation
                            ? Number(next.transportation || 0)
                            : 0) +
                        customInsuranceAddons.reduce((sum, addon) => sum + Number(addon.offer || 0), 0);
                    next.exShowroom = Math.max(0, offerPrice - regOffer - insOffer - others);
                }
                return next;
            });
        },
        [customInsuranceAddons, isExRegInsSelected, isQuoteLocked, quoteRowSelected, quoteVisibleFields]
    );

    const handleUpdateOffer = useCallback(() => {
        if (isQuoteLocked) {
            toast.error('Quote is locked for editing.');
            return;
        }
        const registrationRate = Number(selectedRegistrationOption?.total || costSummary.registration || 0);
        const insuranceRate = Number(costSummary.insurance || 0);
        setEditableQuoteValues(prev => {
            const nextValues = { ...prev };

            if (quoteVisibleFields.registration && quoteRowSelected.registration)
                nextValues.registration = registrationRate;
            if (quoteVisibleFields.insurance && quoteRowSelected.insurance) nextValues.insurance = insuranceRate;

            const otherRowsTotal =
                (quoteVisibleFields.registration && quoteRowSelected.registration ? nextValues.registration : 0) +
                (quoteVisibleFields.insurance && quoteRowSelected.insurance ? nextValues.insurance : 0) +
                (quoteVisibleFields.insuranceAddons && quoteRowSelected.insuranceAddons
                    ? Number(nextValues.insuranceAddons || 0)
                    : 0) +
                (quoteVisibleFields.hypothecation && quoteRowSelected.hypothecation
                    ? Number(nextValues.hypothecation || 0)
                    : 0) +
                (quoteVisibleFields.transportation && quoteRowSelected.transportation
                    ? Number(nextValues.transportation || 0)
                    : 0) +
                customInsuranceAddons.reduce((sum, addon) => sum + Number(addon.offer || 0), 0);

            const netTarget = Math.max(0, Number(nextValues.grandTotal || 0));
            nextValues.exShowroom = Math.max(0, netTarget - otherRowsTotal);
            return nextValues;
        });
        toast.success('Offer updated');
    }, [
        costSummary.registration,
        costSummary.insurance,
        customInsuranceAddons,
        isQuoteLocked,
        quoteRowSelected,
        quoteVisibleFields,
        selectedRegistrationOption?.total,
    ]);

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
            <p className="px-1 text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-slate-300 dark:decoration-slate-600">
                {formatTripletId(request.display_id || request.id)}
            </p>
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    <div className="flex-1 min-h-24 flex flex-col justify-between">
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

            <p className="px-1 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                On-Road Price
            </p>
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-end gap-4">
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
            <p className="px-1 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Qoutes</p>
            {existingQuoteSummaries.length > 0 && (
                <div className="space-y-2">
                    {existingQuoteSummaries.map(summary => (
                        <div
                            key={summary.id}
                            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden"
                        >
                            {/* Header row: Quote Ref left, status badge right */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Quote Ref
                                    </p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {formatTripletId(summary.displayId || summary.id)}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                        summary.status === 'SELECTED'
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            : summary.status === 'REJECTED'
                                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                >
                                    {summary.status === 'SELECTED'
                                        ? 'PO Issued'
                                        : summary.status === 'REJECTED'
                                          ? 'Superseded'
                                          : 'Submitted'}
                                </span>
                            </div>
                            {/* Body */}
                            <div className="px-4 py-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        Supplier
                                    </p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {summary.dealerName}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-1">
                                        {summary.items.length ? summary.items.join(', ') : 'Items mapped'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                        Offer Price
                                    </p>
                                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-200">
                                        {formatCurrency(summary.total)}
                                    </p>
                                    {summary.id === bestOfferQuoteId && (
                                        <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                                            Best Offer
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedDealer(summary.dealerTenantId);
                                            setIsCreatingNewQuote(false);
                                            if (summary.status === 'SELECTED') {
                                                setShowQuoteEditor(false);
                                                setShowPurchaseOrders(true);
                                            } else {
                                                setShowQuoteSection(true);
                                                setShowQuoteEditor(true);
                                            }
                                        }}
                                        className="mt-1 inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                                        title="Expand quote"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {(request.status === 'QUOTING' || canEditIssuedQuote) &&
                (showQuoteEditor || isCreatingNewQuote) &&
                selectedDealerQuote?.status !== 'SELECTED' && (
                    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
                            <div className="text-left min-w-[260px]">
                                <button
                                    type="button"
                                    onClick={() => setIsSupplierEditing(prev => !prev)}
                                    disabled={isQuoteLocked}
                                    className="inline-flex items-center gap-1 text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider disabled:opacity-50"
                                >
                                    Supplier
                                </button>
                                {isSupplierEditing && !isQuoteLocked ? (
                                    <select
                                        value={selectedDealer}
                                        onChange={e => {
                                            setSelectedDealer(e.target.value);
                                            setIsCreatingNewQuote(false);
                                        }}
                                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">Select dealer</option>
                                        {(isCreatingNewQuote
                                            ? availableDealerOptionsForNewQuote
                                            : quoteDealerOptions
                                        ).map(option => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {quoteDealerOptions.find(option => option.id === selectedDealer)?.name || 'NA'}
                                    </p>
                                )}
                                <p className="mt-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                    {coreCollapsedItems.length ? coreCollapsedItems.join(', ') : 'No items'}
                                </p>
                            </div>
                            <div className="text-right min-w-[260px]">
                                <button
                                    type="button"
                                    onClick={() => setIsOfferPriceEditing(prev => !prev)}
                                    disabled={isQuoteLocked}
                                    className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-wider disabled:opacity-50"
                                >
                                    Offer Price
                                </button>
                                {isOfferPriceEditing && !isQuoteLocked ? (
                                    <input
                                        type="number"
                                        min={0}
                                        value={editableQuoteValues.grandTotal}
                                        onChange={e => handleOfferPriceChange(e.target.value)}
                                        className="mt-1 h-9 w-full rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-900/50 px-3 text-sm font-black text-emerald-700 dark:text-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                                    />
                                ) : (
                                    <p className="mt-1 text-xl font-black text-emerald-700 dark:text-emerald-200">
                                        {formatCurrency(editableQuoteValues.grandTotal)}
                                    </p>
                                )}
                                <div className="mt-2 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuoteSection(prev => !prev)}
                                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 inline-flex items-center justify-center text-slate-600 dark:text-slate-300"
                                        title={showQuoteSection ? 'Collapse' : 'Expand'}
                                    >
                                        {showQuoteSection ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {!showQuoteSection ? null : (
                            <div>
                                {requestItems.length === 0 ? (
                                    <div className="p-8 text-center text-[11px] font-bold text-slate-400 uppercase">
                                        No cost lines attached to this requisition.
                                    </div>
                                ) : (
                                    <>
                                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10">
                                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                                                <div className="grid grid-cols-1 md:grid-cols-[170px_1fr_1fr_160px_190px_190px_90px] gap-3 p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                        Item
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
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                        Added By
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                        Edited By
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">
                                                        Action
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
                                                        const isMandatory = row.key === 'exShowroom';
                                                        const rowEditing = quoteRowEditMode[row.key];
                                                        const rateMap = {
                                                            exShowroom: costSummary.exShowroom,
                                                            registration:
                                                                Number(selectedRegistrationOption?.total || 0) ||
                                                                costSummary.registration,
                                                            insurance: costSummary.insurance,
                                                            insuranceAddons: costSummary.insuranceAddons,
                                                            hypothecation: costSummary.hypothecation,
                                                            transportation: costSummary.transportation,
                                                        } as const;
                                                        const rateValue = Number(rateMap[row.key] || 0);
                                                        const offerValue = Number(editableQuoteValues[row.key] || 0);
                                                        const variance = offerValue - rateValue;
                                                        return (
                                                            <React.Fragment key={row.key}>
                                                                <div className="grid grid-cols-1 md:grid-cols-[170px_1fr_1fr_160px_190px_190px_90px] gap-3 p-4 border-b border-slate-100 dark:border-white/10 items-center">
                                                                    <label className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={quoteRowSelected[row.key]}
                                                                            disabled={
                                                                                isQuoteLocked ||
                                                                                row.key === 'exShowroom'
                                                                            }
                                                                            onChange={e =>
                                                                                setQuoteRowSelected(prev => ({
                                                                                    ...prev,
                                                                                    [row.key]: e.target.checked,
                                                                                }))
                                                                            }
                                                                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 disabled:opacity-50"
                                                                        />
                                                                        {row.key === 'registration' &&
                                                                        selectedRegistrationOption
                                                                            ? selectedRegistrationOption.label
                                                                            : row.label}
                                                                    </label>
                                                                    <p className="text-base font-black text-slate-900 dark:text-white">
                                                                        {formatCurrency(rateValue)}
                                                                    </p>
                                                                    <div>
                                                                        {(rowEditing && !isQuoteLocked) ||
                                                                        (row.key === 'exShowroom' &&
                                                                            isExOnlySelected &&
                                                                            !isQuoteLocked) ? (
                                                                            <input
                                                                                type="number"
                                                                                min={0}
                                                                                value={editableQuoteValues[row.key]}
                                                                                onChange={e =>
                                                                                    setEditableQuoteValues(prev => ({
                                                                                        ...prev,
                                                                                        [row.key]: Math.max(
                                                                                            0,
                                                                                            Number(e.target.value || 0)
                                                                                        ),
                                                                                        ...(row.key === 'exShowroom' &&
                                                                                        isExOnlySelected
                                                                                            ? {
                                                                                                  grandTotal: Math.max(
                                                                                                      0,
                                                                                                      Number(
                                                                                                          e.target
                                                                                                              .value ||
                                                                                                              0
                                                                                                      )
                                                                                                  ),
                                                                                              }
                                                                                            : {}),
                                                                                    }))
                                                                                }
                                                                                className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200"
                                                                            />
                                                                        ) : (
                                                                            <p className="text-base font-black text-slate-900 dark:text-white">
                                                                                {formatCurrency(
                                                                                    editableQuoteValues[row.key]
                                                                                )}
                                                                            </p>
                                                                        )}
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
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">
                                                                            {createdByName}
                                                                        </p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                                            {format(
                                                                                new Date(request.created_at),
                                                                                'dd MMM yyyy, hh:mm a'
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">
                                                                            {createdByName}
                                                                        </p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                                            {format(
                                                                                new Date(
                                                                                    request.updated_at ||
                                                                                        request.created_at
                                                                                ),
                                                                                'dd MMM yyyy, hh:mm a'
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            disabled={isQuoteLocked}
                                                                            onClick={() =>
                                                                                setQuoteRowEditMode(prev => ({
                                                                                    ...prev,
                                                                                    [row.key]: !prev[row.key],
                                                                                }))
                                                                            }
                                                                            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                                                                            title="Edit row"
                                                                        >
                                                                            <FileText size={14} />
                                                                        </button>
                                                                        {!isMandatory && (
                                                                            <button
                                                                                type="button"
                                                                                disabled={isQuoteLocked}
                                                                                onClick={() => {
                                                                                    setQuoteVisibleFields(prev => ({
                                                                                        ...prev,
                                                                                        [row.key]: false,
                                                                                    }));
                                                                                    setIncludedQuoteFields(prev => ({
                                                                                        ...prev,
                                                                                        [row.key]: true,
                                                                                    }));
                                                                                    setEditableQuoteValues(prev => ({
                                                                                        ...prev,
                                                                                        [row.key]: 0,
                                                                                    }));
                                                                                    setQuoteRowEditMode(prev => ({
                                                                                        ...prev,
                                                                                        [row.key]: false,
                                                                                    }));
                                                                                }}
                                                                                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                                                                                title="Delete row"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                {customInsuranceAddons.map(addon => {
                                                    const variance = Number(addon.offer || 0);
                                                    return (
                                                        <div
                                                            key={addon.id}
                                                            className="grid grid-cols-1 md:grid-cols-[170px_1fr_1fr_160px_190px_190px_90px] gap-3 p-4 border-b border-slate-100 dark:border-white/10 items-center"
                                                        >
                                                            <label className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                                <input
                                                                    type="checkbox"
                                                                    checked
                                                                    readOnly
                                                                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                                                                />
                                                                {addon.label}
                                                            </label>
                                                            <p className="text-base font-black text-slate-900 dark:text-white">
                                                                {formatCurrency(0)}
                                                            </p>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={addon.offer}
                                                                onChange={e =>
                                                                    setCustomInsuranceAddons(prev =>
                                                                        prev.map(row =>
                                                                            row.id === addon.id
                                                                                ? {
                                                                                      ...row,
                                                                                      offer: Math.max(
                                                                                          0,
                                                                                          Number(e.target.value || 0)
                                                                                      ),
                                                                                  }
                                                                                : row
                                                                        )
                                                                    )
                                                                }
                                                                disabled={isQuoteLocked}
                                                                className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                                                            />
                                                            <p className="text-sm font-black text-right text-amber-600 dark:text-amber-300">
                                                                {variance > 0
                                                                    ? `Surge ${formatCurrency(variance)}`
                                                                    : '—'}
                                                            </p>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">
                                                                    {createdByName}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                                    {format(
                                                                        new Date(request.created_at),
                                                                        'dd MMM yyyy, hh:mm a'
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">
                                                                    {createdByName}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                                    {format(
                                                                        new Date(
                                                                            request.updated_at || request.created_at
                                                                        ),
                                                                        'dd MMM yyyy, hh:mm a'
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    disabled={isQuoteLocked}
                                                                    onClick={() =>
                                                                        setCustomInsuranceAddons(prev =>
                                                                            prev.filter(row => row.id !== addon.id)
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                                                                    title="Delete row"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div className="grid grid-cols-1 md:grid-cols-[170px_1fr_1fr_160px_190px_190px_90px] gap-3 px-4 py-2 border-b border-slate-100/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddItemSelector(prev => !prev)}
                                                        disabled={isQuoteLocked}
                                                        className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider disabled:opacity-50"
                                                    >
                                                        <Pencil size={11} />
                                                        Add New Item
                                                    </button>
                                                    {showAddItemSelector ? (
                                                        <>
                                                            <input
                                                                list="quote-add-item-options"
                                                                value={quoteAddField}
                                                                onChange={e => setQuoteAddField(e.target.value)}
                                                                disabled={isQuoteLocked}
                                                                placeholder="Type to search item..."
                                                                className="h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-2 text-xs font-bold text-slate-900 dark:text-white"
                                                            />
                                                            <datalist id="quote-add-item-options">
                                                                {addItemOptions.map(option => (
                                                                    <option key={option.key} value={option.label} />
                                                                ))}
                                                            </datalist>
                                                        </>
                                                    ) : (
                                                        <p />
                                                    )}
                                                    {showAddItemSelector ? (
                                                        <button
                                                            type="button"
                                                            disabled={isQuoteLocked || !selectedAddItem}
                                                            onClick={() => {
                                                                if (!selectedAddItem) return;
                                                                const key = selectedAddItem.key;
                                                                if (key.startsWith('registration:')) {
                                                                    const regKey = key.replace('registration:', '') as
                                                                        | 'state'
                                                                        | 'bharat'
                                                                        | 'company';
                                                                    const option = registrationCatalogOptions.find(
                                                                        item => item.key === regKey
                                                                    );
                                                                    if (option) {
                                                                        setSelectedRegistrationOption(option);
                                                                        setEditableQuoteValues(prev => ({
                                                                            ...prev,
                                                                            registration: Number(option.total || 0),
                                                                        }));
                                                                    }
                                                                    setQuoteVisibleFields(prev => ({
                                                                        ...prev,
                                                                        registration: true,
                                                                    }));
                                                                } else if (key.startsWith('insuranceAddon:')) {
                                                                    const addonKey = key.replace('insuranceAddon:', '');
                                                                    const option = insuranceAddonCatalogOptions.find(
                                                                        item => item.key === addonKey
                                                                    );
                                                                    const nextNumber = customInsuranceAddons.length + 1;
                                                                    setCustomInsuranceAddons(prev => [
                                                                        ...prev,
                                                                        {
                                                                            id: `${Date.now()}-${nextNumber}`,
                                                                            label:
                                                                                option?.label ||
                                                                                `Insurance Add-on ${nextNumber}`,
                                                                            offer: Number(option?.total || 0),
                                                                        },
                                                                    ]);
                                                                } else {
                                                                    setQuoteVisibleFields(prev => ({
                                                                        ...prev,
                                                                        [key as keyof typeof quoteVisibleFields]: true,
                                                                    }));
                                                                }
                                                                setQuoteAddField('');
                                                                setShowAddItemSelector(false);
                                                            }}
                                                            className="h-9 rounded-lg bg-indigo-600 px-3 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-50"
                                                        >
                                                            Add
                                                        </button>
                                                    ) : (
                                                        <p />
                                                    )}
                                                    <p />
                                                    <p />
                                                    <p />
                                                    <p />
                                                </div>
                                                <div className="p-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    !confirm(
                                                                        'Delete this quote? This action cannot be undone.'
                                                                    )
                                                                )
                                                                    return;
                                                                handleDeleteQuote();
                                                            }}
                                                            disabled={isQuoteLocked}
                                                            className="h-10 rounded-xl border border-rose-200 bg-rose-50 px-4 text-[10px] font-black uppercase tracking-wider text-rose-600 disabled:opacity-50 inline-flex items-center gap-1"
                                                        >
                                                            <Trash2 size={12} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!confirm('Save quote changes?')) return;
                                                                handleSaveQuote();
                                                            }}
                                                            disabled={isQuoteLocked || isSavingQuote}
                                                            className="h-10 rounded-xl bg-indigo-600 px-4 text-[10px] font-black uppercase tracking-wider text-white disabled:bg-slate-300 dark:disabled:bg-slate-700"
                                                        >
                                                            {isSavingQuote ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleApproveQuote}
                                                            disabled={
                                                                isQuoteLocked || currentWorkflowStage === 'issued'
                                                            }
                                                            className="h-10 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[10px] font-black uppercase tracking-wider text-emerald-700 disabled:opacity-50"
                                                        >
                                                            Approved
                                                        </button>
                                                    </div>
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
                        )}
                    </div>
                )}

            {selectedQuote && (
                <>
                    <p className="px-1 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Purchase Order
                    </p>
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden">
                        {/* Header row: PO Ref left, PO status badge right */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PO Ref</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {formatTripletId(primaryPo?.display_id || primaryPo?.id || selectedQuote.id)}
                                </p>
                                {/* Quote traceability: show the source quote ID */}
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                    From Quote:{' '}
                                    <span className="text-slate-500">
                                        {formatTripletId(selectedQuote.display_id || selectedQuote.id)}
                                    </span>
                                </p>
                            </div>
                            <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                    poStatusLabel === 'Issued'
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        : poStatusLabel === 'In Review'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : primaryPo?.po_status === 'SENT'
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : primaryPo?.po_status === 'SHIPPED'
                                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                              : primaryPo?.po_status === 'RECEIVED'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                            >
                                {primaryPo?.po_status || poStatusLabel}
                            </span>
                        </div>
                        {/* Body */}
                        <div className="px-4 py-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                    Supplier
                                </p>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                    {parseTenantRef(selectedQuote.id_tenants)?.name ||
                                        quoteDealerOptions.find(option => option.id === selectedQuote.dealer_tenant_id)
                                            ?.name ||
                                        'NA'}
                                </p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-1">
                                    {(selectedQuote.inv_quote_line_items || [])
                                        .map(
                                            line =>
                                                requestItems.find(item => item.id === line.request_item_id)
                                                    ?.cost_type || ''
                                        )
                                        .filter(Boolean)
                                        .slice(0, 5)
                                        .join(', ') || 'Items mapped'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                    Offer Price
                                </p>
                                <p className="text-lg font-black text-emerald-700 dark:text-emerald-200">
                                    {formatCurrency(getQuoteTotal(selectedQuote))}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowPurchaseOrders(prev => !prev)}
                                    className="mt-1 inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                                    title={showPurchaseOrders ? 'Collapse PO' : 'Expand PO'}
                                >
                                    {showPurchaseOrders ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            </div>
                        </div>
                        {showPurchaseOrders && (
                            <div className="px-4 pb-4 border-t border-slate-100 dark:border-white/10">
                                <div className="grid grid-cols-1 md:grid-cols-[170px_1fr_1fr_160px_190px_190px_90px] gap-3 p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        Item
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
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        Approved By
                                    </p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        Issued By
                                    </p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">
                                        Action
                                    </p>
                                </div>
                                {(selectedQuote.inv_quote_line_items || []).map(line => {
                                    const reqItem = requestItems.find(item => item.id === line.request_item_id);
                                    const rateValue = Number(reqItem?.expected_amount || 0);
                                    const offerValue = Number(line.offered_amount || 0);
                                    const variance = offerValue - rateValue;
                                    return (
                                        <div
                                            key={line.request_item_id}
                                            className="grid grid-cols-1 md:grid-cols-[170px_1fr_1fr_160px_190px_190px_90px] gap-3 p-3 border-b border-slate-100 dark:border-white/10 items-center"
                                        >
                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider inline-flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked
                                                    readOnly
                                                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                                                />
                                                {formatCostTypeLabel(reqItem?.cost_type)}
                                            </p>
                                            <p className="text-base font-black text-slate-900 dark:text-white">
                                                {formatCurrency(rateValue)}
                                            </p>
                                            <p className="text-base font-black text-slate-900 dark:text-white">
                                                {formatCurrency(offerValue)}
                                            </p>
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
                                            <div>
                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">
                                                    {createdByName}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                    {format(new Date(request.created_at), 'dd MMM yyyy, hh:mm a')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">
                                                    {createdByName}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                    {format(
                                                        new Date(request.updated_at || request.created_at),
                                                        'dd MMM yyyy, hh:mm a'
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                —
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="pt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleReviewPo}
                                        disabled={!primaryPo || Boolean(poReviewState[primaryPo.id])}
                                        className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 disabled:opacity-50"
                                    >
                                        Review
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleIssuePo}
                                        disabled={!primaryPo || !poReviewState[primaryPo.id] || isIssuingPo}
                                        className="h-10 rounded-xl bg-violet-600 px-4 text-[10px] font-black uppercase tracking-wider text-white disabled:bg-slate-300 dark:disabled:bg-slate-700"
                                    >
                                        {isIssuingPo ? 'Issuing...' : 'Issue'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {isPoIssued && primaryPo && (
                <>
                    <div className="px-1 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Dispatch Details
                        </p>
                        {primaryPo.po_status !== 'RECEIVED' && (
                            <button
                                type="button"
                                onClick={() => setDispatchEditMode(prev => !prev)}
                                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                            >
                                <Pencil size={10} />
                                {dispatchEditMode ? 'Cancel' : 'Edit'}
                            </button>
                        )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden">
                        {/* Header row — Dispatch Ref + PO status badge */}
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Dispatch Ref
                                </p>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {dispatchDetails.dispatchId}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                        primaryPo.po_status === 'RECEIVED'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : primaryPo.po_status === 'SHIPPED'
                                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    }`}
                                >
                                    {primaryPo.po_status}
                                </span>
                            </div>
                        </div>

                        {/* Fields grid */}
                        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-4">
                            {/* Supplier */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Supplier
                                </p>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                    {dispatchDetails.supplier}
                                </p>
                            </div>

                            {/* Supplier Warehouse / Dispatch Point */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Supplier Warehouse / Dispatch Point
                                </p>
                                {dispatchEditMode ? (
                                    <select
                                        value={dispatchDetails.supplierWarehouseId}
                                        onChange={e => {
                                            const opt = supplierWarehouseOptions.find(w => w.id === e.target.value);
                                            setDispatchDetails(prev => ({
                                                ...prev,
                                                supplierWarehouseId: e.target.value,
                                                supplierWarehouseName: opt?.name || '',
                                                // Auto-fill incharge from selected supplier warehouse
                                                warehouseInchargeName: opt?.managerName || prev.warehouseInchargeName,
                                                warehouseInchargeContact:
                                                    opt?.managerPhone ||
                                                    opt?.contactPhone ||
                                                    prev.warehouseInchargeContact,
                                            }));
                                        }}
                                        className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">Select supplier warehouse</option>
                                        {supplierWarehouseOptions.map(w => (
                                            <option key={w.id} value={w.id}>
                                                {w.name}
                                                {w.managerName ? ` — ${w.managerName}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {dispatchDetails.supplierWarehouseName || 'NA'}
                                    </p>
                                )}
                            </div>

                            {/* Warehouse Incharge */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Warehouse Incharge
                                </p>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                    {dispatchDetails.warehouseInchargeName}
                                    {dispatchDetails.warehouseInchargeContact !== 'NA' && (
                                        <span className="ml-2 text-slate-400">
                                            • {dispatchDetails.warehouseInchargeContact}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Warehouse */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Receiving Warehouse
                                </p>
                                {dispatchEditMode ? (
                                    <select
                                        value={dispatchDetails.warehouseId}
                                        onChange={e => {
                                            const opt = warehouseOptions.find(w => w.id === e.target.value);
                                            setDispatchDetails(prev => ({
                                                ...prev,
                                                warehouseId: e.target.value,
                                                warehouse: opt?.name || 'NA',
                                            }));
                                        }}
                                        className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">Select warehouse</option>
                                        {warehouseOptions.map(w => (
                                            <option key={w.id} value={w.id}>
                                                {w.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {dispatchDetails.warehouse}
                                    </p>
                                )}
                            </div>

                            {/* Dispatch Date */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Dispatch Date
                                </p>
                                {dispatchEditMode ? (
                                    <input
                                        type="datetime-local"
                                        value={dispatchDetails.dispatchDate}
                                        onChange={e =>
                                            setDispatchDetails(prev => ({ ...prev, dispatchDate: e.target.value }))
                                        }
                                        className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                ) : (
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {dispatchDetails.dispatchDate
                                            ? format(new Date(dispatchDetails.dispatchDate), 'dd MMM yyyy, hh:mm a')
                                            : 'NA'}
                                    </p>
                                )}
                            </div>

                            {/* Chassis Number */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Chassis Number
                                </p>
                                {dispatchEditMode ? (
                                    <input
                                        type="text"
                                        value={
                                            dispatchDetails.chassisNumber === 'NA' ? '' : dispatchDetails.chassisNumber
                                        }
                                        placeholder="e.g. ME4JF505XRT123456 or 12345"
                                        minLength={5}
                                        onChange={e => {
                                            // alphanumeric only, auto-uppercase, min 5 chars accepted
                                            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                            setDispatchDetails(prev => ({
                                                ...prev,
                                                chassisNumber: val || 'NA',
                                            }));
                                        }}
                                        className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200 uppercase placeholder:normal-case placeholder:font-normal"
                                    />
                                ) : (
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {dispatchDetails.chassisNumber}
                                    </p>
                                )}
                            </div>

                            {/* Engine Number */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Engine Number
                                </p>
                                {dispatchEditMode ? (
                                    <input
                                        type="text"
                                        value={
                                            dispatchDetails.engineNumber === 'NA' ? '' : dispatchDetails.engineNumber
                                        }
                                        placeholder="e.g. JF505E23456 or 12345"
                                        minLength={5}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                            setDispatchDetails(prev => ({
                                                ...prev,
                                                engineNumber: val || 'NA',
                                            }));
                                        }}
                                        className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200 uppercase placeholder:normal-case placeholder:font-normal"
                                    />
                                ) : (
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {dispatchDetails.engineNumber}
                                    </p>
                                )}
                            </div>

                            {/* Delivery Note / LR */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Delivery Note / LR#
                                </p>
                                {dispatchEditMode ? (
                                    <input
                                        type="text"
                                        value={
                                            dispatchDetails.deliveryNote === 'NA' ? '' : dispatchDetails.deliveryNote
                                        }
                                        placeholder="Lorry receipt / docket number"
                                        onChange={e =>
                                            setDispatchDetails(prev => ({
                                                ...prev,
                                                deliveryNote: e.target.value || 'NA',
                                            }))
                                        }
                                        className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                ) : (
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {dispatchDetails.deliveryNote}
                                    </p>
                                )}
                            </div>

                            {/* Transporter Name */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Transporter Name
                                </p>
                                {dispatchEditMode ? (
                                    <input
                                        type="text"
                                        value={
                                            dispatchDetails.transporterName === 'NA'
                                                ? ''
                                                : dispatchDetails.transporterName
                                        }
                                        placeholder="e.g. VRL Logistics"
                                        onChange={e =>
                                            setDispatchDetails(prev => ({
                                                ...prev,
                                                transporterName: e.target.value || 'NA',
                                            }))
                                        }
                                        className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                ) : (
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {dispatchDetails.transporterName}
                                    </p>
                                )}
                            </div>

                            {/* Transporter Contact */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Transporter Contact
                                </p>
                                {dispatchEditMode ? (
                                    <input
                                        type="tel"
                                        value={
                                            dispatchDetails.transporterContact === 'NA'
                                                ? ''
                                                : dispatchDetails.transporterContact
                                        }
                                        placeholder="10-digit mobile"
                                        maxLength={10}
                                        onChange={e =>
                                            setDispatchDetails(prev => ({
                                                ...prev,
                                                transporterContact: e.target.value || 'NA',
                                            }))
                                        }
                                        className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                ) : (
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {dispatchDetails.transporterContact}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions footer */}
                        {(dispatchEditMode || primaryPo.po_status === 'SENT' || primaryPo.po_status === 'SHIPPED') &&
                            primaryPo.po_status !== 'RECEIVED' && (
                                <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {dispatchEditMode
                                            ? 'Save dispatch details before marking as shipped'
                                            : primaryPo.po_status === 'SHIPPED'
                                              ? 'Stock in transit — ready to receive at warehouse'
                                              : 'Transporter details saved — ready to dispatch'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {dispatchEditMode && (
                                            <button
                                                type="button"
                                                onClick={handleSaveDispatch}
                                                disabled={isSavingDispatch}
                                                className="h-9 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-50 transition-all"
                                            >
                                                {isSavingDispatch ? 'Saving...' : 'Save Details'}
                                            </button>
                                        )}
                                        {primaryPo.po_status === 'SENT' && (
                                            <button
                                                type="button"
                                                onClick={handleMoveDispatchNext}
                                                disabled={isMovingDispatch || isSavingDispatch}
                                                className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
                                            >
                                                <Truck size={12} />
                                                {isMovingDispatch ? 'Updating...' : 'Mark as Shipped'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </>
            )}

            {/* ── GRN RECEIPT (post-receive read-only display) ── */}
            {primaryPo && primaryPo.po_status === 'RECEIVED' && receivedStock && (
                <>
                    <p className="px-1 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        GRN Receipt
                    </p>
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900/60 overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    GRN Ref
                                </p>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {formatTripletId(primaryPo.display_id || primaryPo.id)}
                                </p>
                            </div>
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">
                                ✓ Received
                            </span>
                        </div>

                        {/* Details grid */}
                        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            {[
                                { label: 'Chassis Number', value: (receivedStock as any).chassis_number },
                                { label: 'Engine Number', value: (receivedStock as any).engine_number },
                                { label: 'Key Number', value: (receivedStock as any).key_number },
                                { label: 'Battery Make', value: (receivedStock as any).battery_make },
                                { label: 'Battery Type', value: (receivedStock as any).battery_type },
                                { label: 'Battery Number', value: (receivedStock as any).battery_number },
                                { label: 'Mfg. Date', value: (receivedStock as any).manufacturing_date },
                                { label: 'QC Notes', value: (receivedStock as any).qc_notes },
                            ]
                                .filter(f => f.value)
                                .map(f => (
                                    <div key={f.label}>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                            {f.label}
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight break-all">
                                            {f.value}
                                        </p>
                                    </div>
                                ))}
                        </div>

                        {/* Media thumbnails — from media_gallery (includes all purposes) */}
                        {(() => {
                            // Prefer media_gallery JSONB (new format), fall back to individual columns for old rows
                            const gallery: Array<{ url: string; purpose: string; isVideo: boolean }> = (
                                receivedStock as any
                            ).media_gallery?.length
                                ? (receivedStock as any).media_gallery
                                : [
                                      {
                                          url: (receivedStock as any).media_chassis_url,
                                          purpose: 'chassis',
                                          isVideo: false,
                                      },
                                      {
                                          url: (receivedStock as any).media_engine_url,
                                          purpose: 'engine',
                                          isVideo: false,
                                      },
                                      {
                                          url: (receivedStock as any).media_sticker_url,
                                          purpose: 'sticker',
                                          isVideo: false,
                                      },
                                      {
                                          url: (receivedStock as any).media_vehicle_url,
                                          purpose: 'vehicle',
                                          isVideo: false,
                                      },
                                      {
                                          url: (receivedStock as any).media_qc_video_url,
                                          purpose: 'qc_video',
                                          isVideo: true,
                                      },
                                  ].filter(m => m.url);
                            if (!gallery.length) return null;
                            const PLABELS: Record<string, string> = {
                                chassis: 'Chassis',
                                engine: 'Engine',
                                sticker: 'Sticker',
                                vehicle: 'Vehicle',
                                qc_video: 'QC Video',
                                other: 'Other',
                            };
                            return (
                                <div className="px-5 pb-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Media Assets&nbsp;
                                        <span className="normal-case font-semibold text-slate-300">
                                            ({gallery.length})
                                        </span>
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {gallery.map((m, gi) => (
                                            <a
                                                key={gi}
                                                href={m.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-white/10 block flex-shrink-0"
                                            >
                                                {m.isVideo ? (
                                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-1">
                                                        <span className="text-2xl">🎥</span>
                                                        <span className="text-[7px] font-black text-slate-400 uppercase">
                                                            Video
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={m.url}
                                                        alt={m.purpose}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                    />
                                                )}
                                                <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[7px] font-black text-center py-0.5 uppercase tracking-wide">
                                                    {PLABELS[m.purpose] ?? m.purpose}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Received at */}
                        {(receivedStock as any).created_at && (
                            <div className="px-5 pb-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Received At
                                </p>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {new Date((receivedStock as any).created_at).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── INLINE GRN / RECEIVING SECTION ── */}
            {primaryPo && primaryPo.po_status === 'SHIPPED' && request && (
                <>
                    <p className="px-1 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Receive Stock
                    </p>
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    GRN Ref
                                </p>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {formatTripletId(primaryPo.display_id || primaryPo.id)}
                                </p>
                            </div>
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Ready to Receive
                            </span>
                        </div>

                        {/* Fields grid */}
                        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="md:col-span-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Receiving Branch
                                </p>
                                <select
                                    value={grnBranchId || dispatchDetails.warehouseId}
                                    onChange={e => setGrnBranchId(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200"
                                >
                                    <option value="">Select branch</option>
                                    {warehouseOptions.map(w => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ── Chassis Number — verify against dispatch ────── */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                                    <span>
                                        Chassis Number{' '}
                                        <span className="normal-case font-semibold text-slate-300">
                                            (verify on vehicle)
                                        </span>
                                    </span>
                                    <span
                                        className={`font-black tabular-nums ${(grnChassisNumber || '').length > 17 ? 'text-red-500' : (grnChassisNumber || '').length === 17 ? 'text-emerald-600' : 'text-slate-300'}`}
                                    >
                                        {(grnChassisNumber || '').length}/17
                                    </span>
                                </p>
                                <input
                                    type="text"
                                    value={
                                        grnChassisNumber ||
                                        (dispatchDetails.chassisNumber !== 'NA' ? dispatchDetails.chassisNumber : '')
                                    }
                                    placeholder="17-char VIN"
                                    maxLength={17}
                                    onChange={e => {
                                        const val = e.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, '')
                                            .replace(/[IOQ]/g, '')
                                            .slice(0, 17);
                                        setGrnChassisNumber(val);
                                        if (val.length === 17) {
                                            const decoded = decodeVinMfgDate(val);
                                            if (decoded) setGrnMfgDate(decoded);
                                        }
                                    }}
                                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200 uppercase tracking-widest"
                                />
                                {/* Dispatch vs GRN match indicator */}
                                {dispatchDetails.chassisNumber !== 'NA' &&
                                    grnChassisNumber &&
                                    (grnChassisNumber === dispatchDetails.chassisNumber ? (
                                        <p className="text-[8px] font-black text-emerald-500 mt-0.5">
                                            ✓ Matches dispatched VIN
                                        </p>
                                    ) : (
                                        <p className="text-[8px] font-black text-amber-500 mt-0.5">
                                            ⚠ Differs from dispatch: {dispatchDetails.chassisNumber}
                                        </p>
                                    ))}
                            </div>

                            {/* ── Engine Number — verify against dispatch ──────── */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Engine Number{' '}
                                    <span className="normal-case font-semibold text-slate-300">
                                        (verify on vehicle)
                                    </span>
                                </p>
                                <input
                                    type="text"
                                    value={
                                        grnEngineNumber ||
                                        (dispatchDetails.engineNumber !== 'NA' ? dispatchDetails.engineNumber : '')
                                    }
                                    placeholder="Engine no."
                                    onChange={e =>
                                        setGrnEngineNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200 uppercase"
                                />
                                {dispatchDetails.engineNumber !== 'NA' &&
                                    grnEngineNumber &&
                                    (grnEngineNumber === dispatchDetails.engineNumber ? (
                                        <p className="text-[8px] font-black text-emerald-500 mt-0.5">
                                            ✓ Matches dispatched engine no.
                                        </p>
                                    ) : (
                                        <p className="text-[8px] font-black text-amber-500 mt-0.5">
                                            ⚠ Differs from dispatch: {dispatchDetails.engineNumber}
                                        </p>
                                    ))}
                            </div>

                            {/* Key Number */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Key Number{' '}
                                    <span className="normal-case font-semibold text-slate-300">(optional)</span>
                                </p>
                                <input
                                    type="text"
                                    value={grnKeyNumber}
                                    placeholder="e.g. K-1234"
                                    onChange={e =>
                                        setGrnKeyNumber(e.target.value.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase())
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200 uppercase"
                                />
                            </div>

                            {/* Battery Make — branded dropdown */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Battery Make{' '}
                                    <span className="normal-case font-bold text-slate-300">(optional)</span>
                                </p>
                                <select
                                    value={grnBatteryMake}
                                    onChange={e => setGrnBatteryMake(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200"
                                >
                                    <option value="">Select brand</option>
                                    {[
                                        'Exide',
                                        'Amaron',
                                        'Tata Green',
                                        'SF Sonic',
                                        'Okaya',
                                        'Luminous',
                                        'Rocket',
                                        'Yuasa',
                                        'Panasonic',
                                        'Bosch',
                                        'Livguard',
                                        'Zipp',
                                        'Eastman',
                                    ].map(b => (
                                        <option key={b} value={b}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Battery Type — auto-filled from SKU spec */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Battery Type
                                    {skuBatteryType && (
                                        <span className="ml-1 normal-case font-bold text-emerald-500">
                                            (from SKU spec)
                                        </span>
                                    )}
                                </p>
                                <input
                                    type="text"
                                    value={grnBatteryType}
                                    onChange={e => setGrnBatteryType(e.target.value)}
                                    placeholder="e.g. VRLA, Li-ion, AGM"
                                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200"
                                />
                            </div>

                            {/* Battery Number */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Battery Number{' '}
                                    <span className="normal-case font-bold text-slate-300">(optional)</span>
                                </p>
                                <input
                                    type="text"
                                    value={grnBatteryNumber}
                                    onChange={e => setGrnBatteryNumber(e.target.value.toUpperCase())}
                                    placeholder="Battery serial / stamp"
                                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200 uppercase"
                                />
                            </div>

                            {/* Manufacturing Date — Day + Month + Year */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Manufacturing Date
                                </p>
                                <div className="flex gap-2">
                                    {/* Day */}
                                    <select
                                        value={grnMfgDate ? grnMfgDate.split('-')[2] || '' : ''}
                                        onChange={e => {
                                            const parts = grnMfgDate ? grnMfgDate.split('-') : ['', '01', ''];
                                            const yr = parts[0] || new Date().getFullYear().toString();
                                            const mo = parts[1] || '01';
                                            setGrnMfgDate(
                                                e.target.value ? `${yr}-${mo}-${e.target.value}` : `${yr}-${mo}`
                                            );
                                        }}
                                        className="w-16 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200"
                                    >
                                        <option value="">DD</option>
                                        {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Month */}
                                    <select
                                        value={grnMfgDate ? grnMfgDate.split('-')[1] || '' : ''}
                                        onChange={e => {
                                            const parts = grnMfgDate ? grnMfgDate.split('-') : ['', '', ''];
                                            const yr = parts[0] || new Date().getFullYear().toString();
                                            const dd = parts[2] || '01';
                                            setGrnMfgDate(e.target.value ? `${yr}-${e.target.value}-${dd}` : '');
                                        }}
                                        className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200"
                                    >
                                        <option value="">Mon</option>
                                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(
                                            (m, i) => (
                                                <option key={m} value={m}>
                                                    {
                                                        [
                                                            'Jan',
                                                            'Feb',
                                                            'Mar',
                                                            'Apr',
                                                            'May',
                                                            'Jun',
                                                            'Jul',
                                                            'Aug',
                                                            'Sep',
                                                            'Oct',
                                                            'Nov',
                                                            'Dec',
                                                        ][i]
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                    {/* Year */}
                                    <select
                                        value={grnMfgDate ? grnMfgDate.split('-')[0] || '' : ''}
                                        onChange={e => {
                                            const parts = grnMfgDate ? grnMfgDate.split('-') : ['', '01', '01'];
                                            const mo = parts[1] || '01';
                                            const dd = parts[2] || '01';
                                            setGrnMfgDate(e.target.value ? `${e.target.value}-${mo}-${dd}` : '');
                                        }}
                                        className="w-24 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200"
                                    >
                                        <option value="">Year</option>
                                        {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* QC Notes — full width */}
                            <div className="md:col-span-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    QC Notes <span className="normal-case font-bold text-slate-300">(optional)</span>
                                </p>
                                <input
                                    type="text"
                                    value={grnQcNotes}
                                    onChange={e => setGrnQcNotes(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-200"
                                />
                            </div>

                            {/* Media Assets — multi-upload with per-photo tagging */}
                            <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-white/10">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Media Assets
                                </p>
                                <GrnMediaGallery
                                    entityId={primaryPo?.id ?? 'grn'}
                                    items={grnMediaItems}
                                    onChange={setGrnMediaItems}
                                />
                            </div>
                        </div>

                        {/* Submit footer */}
                        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Vehicle details locked after receiving
                            </p>
                            <button
                                type="button"
                                disabled={isSubmittingGrn}
                                onClick={async () => {
                                    const effectiveBranch = grnBranchId || dispatchDetails.warehouseId;
                                    const effectiveChassis = (
                                        grnChassisNumber ||
                                        (dispatchDetails.chassisNumber !== 'NA' ? dispatchDetails.chassisNumber : '')
                                    ).trim();
                                    const effectiveEngine = (
                                        grnEngineNumber ||
                                        (dispatchDetails.engineNumber !== 'NA' ? dispatchDetails.engineNumber : '')
                                    ).trim();
                                    if (!effectiveBranch) {
                                        toast.error('Select receiving branch');
                                        return;
                                    }
                                    if (!effectiveChassis || effectiveChassis.length < 5) {
                                        toast.error('Chassis number must be at least 5 characters');
                                        return;
                                    }
                                    if (!effectiveEngine || effectiveEngine.length < 5) {
                                        toast.error('Engine number must be at least 5 characters');
                                        return;
                                    }

                                    setIsSubmittingGrn(true);
                                    try {
                                        const { receiveStock } = await import('@/actions/inventory');
                                        const result = await receiveStock({
                                            po_id: primaryPo.id,
                                            tenant_id: request.tenant_id ?? '',
                                            sku_id: request.sku_id ?? '',
                                            branch_id: effectiveBranch,
                                            chassis_number: effectiveChassis.toUpperCase(),
                                            engine_number: effectiveEngine.toUpperCase(),
                                            key_number: grnKeyNumber.trim() || undefined,
                                            battery_make: grnBatteryMake.trim() || undefined,
                                            battery_type: grnBatteryType.trim() || undefined,
                                            battery_number: grnBatteryNumber.trim() || undefined,
                                            manufacturing_date: grnMfgDate || undefined,
                                            media_chassis_url:
                                                grnMediaItems.find(i => i.purpose === 'chassis')?.url || undefined,
                                            media_engine_url:
                                                grnMediaItems.find(i => i.purpose === 'engine')?.url || undefined,
                                            media_sticker_url:
                                                grnMediaItems.find(i => i.purpose === 'sticker')?.url || undefined,
                                            media_vehicle_url:
                                                grnMediaItems.find(i => i.purpose === 'vehicle')?.url || undefined,
                                            media_qc_video_url:
                                                grnMediaItems.find(i => i.purpose === 'qc_video')?.url || undefined,
                                            // Save ALL items (including 'other') to gallery
                                            media_gallery: grnMediaItems.map(i => ({
                                                url: i.url,
                                                purpose: i.purpose,
                                                isVideo: i.isVideo,
                                            })),
                                            qc_notes: grnQcNotes.trim() || undefined,
                                        });
                                        if (!result.success) {
                                            toast.error(result.message || 'Failed to receive stock');
                                            return;
                                        }
                                        toast.success('Stock received successfully');
                                        fetchRequestDetail();
                                    } catch (err: unknown) {
                                        toast.error(err instanceof Error ? err.message : 'Failed to receive stock');
                                    } finally {
                                        setIsSubmittingGrn(false);
                                    }
                                }}
                                className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
                            >
                                <PackageCheck size={12} />
                                {isSubmittingGrn ? 'Receiving...' : 'Mark as Received'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(requisitionsBasePath)}
                        className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-black uppercase tracking-wider transition-all"
                    >
                        Back to Requisitions
                    </button>
                    {request.status !== 'RECEIVED' && request.status !== 'CANCELLED' && (
                        <button
                            onClick={handleCancelRequest}
                            disabled={isCancelling || selectingQuoteId !== null}
                            className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/30 disabled:opacity-50 text-xs font-black uppercase tracking-wider transition-all"
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel Requisition'}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {request.status === 'QUOTING' && (
                        <button
                            type="button"
                            onClick={() => {
                                setShowQuoteSection(true);
                                setShowAddItemSelector(false);
                                setIsSupplierEditing(true);
                                setIsCreatingNewQuote(true);
                                setShowQuoteEditor(true);
                                setSelectedDealer('');
                            }}
                            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-black uppercase tracking-wider transition-all"
                        >
                            + Add New Quote
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
