import type React from 'react';
import {
    Bookmark,
    CheckCheck,
    MessageSquareQuote,
    PackageCheck,
    ShoppingCart,
    Undo2,
    Wallet,
    FileText,
} from 'lucide-react';

export type RequestStatus = 'QUOTING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export type RequestItem = {
    id: string;
    cost_type: string;
    expected_amount: number;
    description: string | null;
};

export type QuoteTenantRef = {
    name: string | null;
    slug: string | null;
};

export type DealerQuote = {
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

export type PurchaseOrder = {
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

export type RequisitionDetail = {
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

export type DealerOption = { id: string; name: string };

export const EMPTY_REQUEST_ITEMS: RequestItem[] = [];

export type ProgressStageKey =
    | 'BOOKING'
    | 'REQUISITION'
    | 'QUOTING'
    | 'PURCHASE_ORDER'
    | 'DISPATCH_ORDER'
    | 'PAYMENT'
    | 'RECEIVED'
    | 'TERMINAL';

export const BASE_PROGRESS_STAGES: Array<{ key: ProgressStageKey; label: string }> = [
    { key: 'BOOKING', label: 'BOOKING' },
    { key: 'REQUISITION', label: 'REQUISITION' },
    { key: 'QUOTING', label: 'QUOTING' },
    { key: 'PURCHASE_ORDER', label: 'PURCHASE ORDER' },
    { key: 'DISPATCH_ORDER', label: 'DISPATCH ORDER' },
    { key: 'PAYMENT', label: 'PAYMENT' },
    { key: 'RECEIVED', label: 'RECEIVED' },
];

export const STAGE_ICON_MAP: Record<ProgressStageKey, React.ComponentType<{ size?: number; className?: string }>> = {
    BOOKING: Bookmark,
    REQUISITION: FileText,
    QUOTING: MessageSquareQuote,
    PURCHASE_ORDER: ShoppingCart,
    DISPATCH_ORDER: PackageCheck,
    PAYMENT: Wallet,
    RECEIVED: CheckCheck,
    TERMINAL: Undo2,
};

export const STAGE_TONE_MAP = {
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

export const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
    QUOTING:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    ORDERED:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    RECEIVED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    CANCELLED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
};

export const QUOTE_STATUS_STYLES: Record<DealerQuote['status'], string> = {
    SUBMITTED:
        'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
    SELECTED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    REJECTED: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
};

export const PO_STATUS_STYLES: Record<PurchaseOrder['po_status'], string> = {
    DRAFT: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
    SENT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    SHIPPED:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    RECEIVED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
};

export const formatCurrency = (amount: number | null | undefined) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
export const getQuoteTotal = (quote: DealerQuote) =>
    Number(quote.bundled_amount || 0) + Number(quote.transport_amount || 0);

export const classifyCostBucket = (costType: string) => {
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

export const formatTripletId = (raw?: string | null) => {
    if (!raw) return 'NA';
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 9)}`;
};

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

export function decodeVinMfgDate(vin: string): string | null {
    const v = vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length !== 17) return null;
    const wmi = v.slice(0, 3);
    const yearChar = v[9];
    let year = VIN_YEAR_MAP[yearChar];
    if (!year) return null;
    const isLetter = /[A-Z]/.test(yearChar);
    if (isLetter && year < 2004) year += 30;
    const monthChar = wmi === 'ME4' ? v[8] : v[10];
    const month = VIN_MONTH_MAP[monthChar] ?? '01';
    return `${year}-${month}-01`;
}

export const formatAddonLabelFromKey = (rawKey: string) =>
    rawKey
        .replace(/^addon_/, '')
        .replace(/_total_amount$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

export const formatCostTypeLabel = (value?: string | null) =>
    String(value || 'Item')
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

export const parseTenantRef = (value: DealerQuote['id_tenants']) => {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] || null;
    return value;
};
