'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileOutput,
    Loader2,
    Package,
    Receipt,
    TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant/tenantContext';
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
    display_id: string | null;
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

const REQUEST_STAGE_FLOW: RequestStatus[] = ['QUOTING', 'ORDERED', 'RECEIVED'];

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

    const requestItems = request?.inv_request_items || [];
    const quotes = useMemo(() => (request?.inv_dealer_quotes || []).slice(), [request?.inv_dealer_quotes]);
    const purchaseOrders = request?.inv_purchase_orders || [];

    const totalExpected = useMemo(
        () => requestItems.reduce((sum, item) => sum + Number(item.expected_amount || 0), 0),
        [requestItems]
    );

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

    const stageIndex = request ? REQUEST_STAGE_FLOW.indexOf(request.status) : -1;
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
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push(requisitionsBasePath)}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <FileOutput size={24} className="text-indigo-500" />
                        {request.display_id || `REQ-${request.id.slice(0, 8).toUpperCase()}`}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Created {format(new Date(request.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                </div>
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

            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Progress</p>
                <div className="flex items-center gap-3 overflow-x-auto">
                    {REQUEST_STAGE_FLOW.map((stage, idx) => {
                        const done = stageIndex >= idx;
                        return (
                            <React.Fragment key={stage}>
                                <div
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                                        done
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'
                                    }`}
                                >
                                    {stage}
                                </div>
                                {idx < REQUEST_STAGE_FLOW.length - 1 && (
                                    <ChevronRight
                                        size={14}
                                        className={done ? 'text-indigo-500 shrink-0' : 'text-slate-300 shrink-0'}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${REQUEST_STATUS_STYLES[request.status]}`}
                    >
                        {request.status}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Source</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{request.source_type}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SKU</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white break-all">{request.sku_id}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Expected Cost
                    </p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalExpected)}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Cost Lines
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {requestItems.length} items
                    </span>
                </div>
                {requestItems.length === 0 ? (
                    <div className="p-8 text-center text-[11px] font-bold text-slate-400 uppercase">
                        No cost lines attached to this requisition.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/10">
                        {requestItems.map(item => (
                            <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        {item.cost_type.replace(/_/g, ' ')}
                                    </p>
                                    {item.description && (
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {formatCurrency(item.expected_amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Dealer Quotes
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {quotes.length} quotes
                    </span>
                </div>

                {tenantId && (
                    <QuotePanel
                        requestId={request.id}
                        requestStatus={request.status}
                        requestItems={requestItems}
                        existingQuotes={quotes}
                        tenantId={tenantId}
                        onRefresh={fetchRequestDetail}
                    />
                )}

                {activeQuotes.length > 0 && (
                    <div className="px-6 pb-6">
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest inline-flex items-center gap-2">
                                    <BarChart3 size={12} />
                                    Comparison Snapshot
                                </p>
                                {bestQuote && (
                                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-wider">
                                        Best: {parseTenantRef(bestQuote.id_tenants)?.name || 'Dealer'} •{' '}
                                        {formatCurrency(getQuoteTotal(bestQuote))}
                                    </p>
                                )}
                            </div>
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 px-3 py-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Quotes
                                    </p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                        {activeQuotes.length}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 px-3 py-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Lowest Total
                                    </p>
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
                                        {bestQuote ? formatCurrency(getQuoteTotal(bestQuote)) : '—'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 px-3 py-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Spread
                                    </p>
                                    <p className="text-sm font-black text-amber-600 dark:text-amber-300">
                                        {formatCurrency(quoteSpread)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 px-3 py-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Selected
                                    </p>
                                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-300">
                                        {selectedQuote ? formatCurrency(getQuoteTotal(selectedQuote)) : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {quotes.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            No dealer quote yet. Add a quote before advancing to ORDERED.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/10">
                        {quotes
                            .slice()
                            .sort((a, b) => getQuoteTotal(a) - getQuoteTotal(b))
                            .map(quote => {
                                const dealer = parseTenantRef(quote.id_tenants);
                                const total = getQuoteTotal(quote);
                                const canSelect = request.status === 'QUOTING' && quote.status === 'SUBMITTED';
                                const isSelecting = selectingQuoteId === quote.id;
                                const isBest = !!bestQuote && bestQuote.id === quote.id;

                                return (
                                    <div
                                        key={quote.id}
                                        className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {dealer?.name || 'Dealer'}
                                                </p>
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${QUOTE_STATUS_STYLES[quote.status]}`}
                                                >
                                                    {quote.status}
                                                </span>
                                                {isBest && (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30">
                                                        Lowest Total
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                <span>Bundled: {formatCurrency(quote.bundled_amount)}</span>
                                                <span>Transport: {formatCurrency(quote.transport_amount)}</span>
                                                <span>Total: {formatCurrency(total)}</span>
                                                <span>Lines: {quote.inv_quote_line_items?.length || 0}</span>
                                                <span
                                                    className={
                                                        Number(quote.variance_amount || 0) <= 0
                                                            ? 'text-emerald-500'
                                                            : 'text-amber-500'
                                                    }
                                                >
                                                    Variance: {formatCurrency(quote.variance_amount)}
                                                </span>
                                            </div>
                                            {quote.inv_quote_terms && (
                                                <div className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                    Terms: {quote.inv_quote_terms.payment_mode || 'NA'}
                                                    {quote.inv_quote_terms.credit_days !== null &&
                                                        ` • Credit ${quote.inv_quote_terms.credit_days}d`}
                                                    {quote.inv_quote_terms.advance_percent !== null &&
                                                        ` • Advance ${quote.inv_quote_terms.advance_percent}%`}
                                                    {quote.inv_quote_terms.expected_dispatch_days !== null &&
                                                        ` • Dispatch ${quote.inv_quote_terms.expected_dispatch_days}d`}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {quote.status === 'SELECTED' && (
                                                <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                                                    <CheckCircle2 size={12} />
                                                    Selected
                                                </span>
                                            )}
                                            {canSelect && (
                                                <button
                                                    onClick={() => handleSelectQuote(quote.id)}
                                                    disabled={isSelecting || selectingQuoteId !== null}
                                                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    {isSelecting ? 'Selecting...' : 'Select & Move To Ordered'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}

                {requestItems.length > 0 && activeQuotes.length > 0 && (
                    <div className="px-6 pb-6">
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Cost Line Coverage Matrix
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/40">
                                            <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                Cost Line
                                            </th>
                                            <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                Expected
                                            </th>
                                            {activeQuotes.map(quote => (
                                                <th
                                                    key={quote.id}
                                                    className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest"
                                                >
                                                    {parseTenantRef(quote.id_tenants)?.name || 'Dealer'}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestItems.map(item => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-slate-100 dark:border-white/10"
                                            >
                                                <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase">
                                                    {item.cost_type.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-4 py-3 text-right text-[10px] font-black text-slate-900 dark:text-white">
                                                    {formatCurrency(item.expected_amount)}
                                                </td>
                                                {activeQuotes.map(quote => {
                                                    const included = (quote.bundled_item_ids || []).includes(item.id);
                                                    return (
                                                        <td
                                                            key={`${quote.id}-${item.id}`}
                                                            className="px-4 py-3 text-center text-[10px] font-black uppercase"
                                                        >
                                                            <span
                                                                className={`inline-flex px-2 py-1 rounded-lg border ${
                                                                    included
                                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                                                        : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                                                }`}
                                                            >
                                                                {included ? 'Included' : 'Excluded'}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50 dark:bg-white/5">
                                            <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase">
                                                Total Offer
                                            </td>
                                            <td className="px-4 py-3 text-right text-[10px] font-black text-slate-400">
                                                —
                                            </td>
                                            {activeQuotes.map(quote => (
                                                <td key={`${quote.id}-total`} className="px-4 py-3 text-center">
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white">
                                                        {formatCurrency(getQuoteTotal(quote))}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Receipt size={14} className="text-indigo-500" />
                        Purchase Orders
                    </h2>
                    <button
                        onClick={() => router.push(ordersBasePath)}
                        className="text-[10px] font-black text-indigo-500 uppercase tracking-wider hover:underline"
                    >
                        Open Orders
                    </button>
                </div>

                {purchaseOrders.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            No purchase order linked yet.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/10">
                        {purchaseOrders.map(po => (
                            <div key={po.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                                        {po.display_id || `PO-${po.id.slice(0, 8).toUpperCase()}`}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                        {formatCurrency(po.total_po_value)} • {po.payment_status.replace(/_/g, ' ')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${PO_STATUS_STYLES[po.po_status]}`}
                                    >
                                        {po.po_status}
                                    </span>
                                    <button
                                        onClick={() =>
                                            router.push(
                                                po.po_status === 'SHIPPED'
                                                    ? `${ordersBasePath}/${po.id}/grn`
                                                    : `${ordersBasePath}/${po.id}`
                                            )
                                        }
                                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider"
                                    >
                                        <TrendingUp size={12} />
                                        Open
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {request.status === 'ORDERED' && primaryPo?.po_status !== 'RECEIVED' && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-2">
                    <Clock size={14} />
                    To move requisition to RECEIVED, complete stock receipt (GRN) from the linked purchase order.
                </div>
            )}
        </div>
    );
}
