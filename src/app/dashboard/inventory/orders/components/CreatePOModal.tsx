'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Calendar, Loader2, Plus, ShoppingBag, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createPurchaseOrderFromQuote } from '@/actions/inventory';
import { toast } from 'sonner';

type QuoteOption = {
    id: string;
    status: 'SUBMITTED' | 'SELECTED' | 'REJECTED';
    bundled_amount: number;
    transport_amount: number;
    id_tenants: { name: string | null } | { name: string | null }[] | null;
};

type RequestOption = {
    id: string;
    display_id: string | null;
    status: 'QUOTING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    source_type: string;
    created_at: string;
    inv_dealer_quotes: QuoteOption[];
    inv_purchase_orders: Array<{ id: string; display_id: string | null }>;
};

const formatCurrency = (amount: number | null | undefined) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const quoteTotal = (quote: QuoteOption) => Number(quote.bundled_amount || 0) + Number(quote.transport_amount || 0);
const parseDealerName = (value: QuoteOption['id_tenants']) => {
    if (!value) return 'Dealer';
    if (Array.isArray(value)) return value[0]?.name || 'Dealer';
    return value.name || 'Dealer';
};

export default function CreatePOModal({
    isOpen,
    onClose,
    onSuccess,
    tenantId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    tenantId?: string;
}) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState<RequestOption[]>([]);
    const [selectedRequestId, setSelectedRequestId] = useState('');
    const [selectedQuoteId, setSelectedQuoteId] = useState('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [transporterName, setTransporterName] = useState('');
    const [docketNumber, setDocketNumber] = useState('');

    const eligibleRequests = useMemo(() => {
        return requests.filter(req => {
            if (req.inv_purchase_orders.length > 0) return false;
            return req.inv_dealer_quotes.some(quote => quote.status === 'SUBMITTED' || quote.status === 'SELECTED');
        });
    }, [requests]);

    const selectedRequest = useMemo(
        () => eligibleRequests.find(req => req.id === selectedRequestId) || null,
        [eligibleRequests, selectedRequestId]
    );

    const selectableQuotes = useMemo(() => {
        if (!selectedRequest) return [];
        return selectedRequest.inv_dealer_quotes
            .filter(quote => quote.status === 'SUBMITTED' || quote.status === 'SELECTED')
            .sort((a, b) => quoteTotal(a) - quoteTotal(b));
    }, [selectedRequest]);

    useEffect(() => {
        if (!isOpen || !tenantId) return;

        const fetchCandidates = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('inv_requests')
                    .select(
                        `
                        id, display_id, status, source_type, created_at,
                        inv_dealer_quotes(
                            id, status, bundled_amount, transport_amount,
                            id_tenants:dealer_tenant_id(name)
                        ),
                        inv_purchase_orders(id, display_id)
                        `
                    )
                    .eq('tenant_id', tenantId)
                    .in('status', ['QUOTING', 'ORDERED'])
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setRequests((data as RequestOption[]) || []);
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Failed to load requisitions');
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, [isOpen, supabase, tenantId]);

    useEffect(() => {
        if (!selectedRequest) {
            setSelectedQuoteId('');
            return;
        }

        if (!selectableQuotes.length) {
            setSelectedQuoteId('');
            return;
        }

        const currentQuoteStillExists = selectableQuotes.some(quote => quote.id === selectedQuoteId);
        if (currentQuoteStillExists) return;

        const selectedQuote = selectableQuotes.find(quote => quote.status === 'SELECTED');
        setSelectedQuoteId(selectedQuote?.id || selectableQuotes[0].id);
    }, [selectableQuotes, selectedQuoteId, selectedRequest]);

    const handleCreatePO = async () => {
        if (!selectedRequestId || !selectedQuoteId) {
            toast.error('Select requisition and dealer quote first');
            return;
        }

        setSubmitting(true);
        try {
            const result = await createPurchaseOrderFromQuote({
                request_id: selectedRequestId,
                quote_id: selectedQuoteId,
                expected_delivery_date: expectedDeliveryDate || undefined,
                transporter_name: transporterName || undefined,
                docket_number: docketNumber || undefined,
            });

            if (!result.success) {
                toast.error(result.message || 'Failed to create PO');
                return;
            }

            toast.success(result.message || 'PO created');
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to create PO');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-2xl border border-slate-200 dark:border-white/5 shadow-2xl space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                            <ShoppingBag size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Create Purchase Order
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                Convert submitted dealer quote to PO
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 flex flex-col items-center gap-3">
                        <Loader2 size={30} className="animate-spin text-indigo-500" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Loading candidates...
                        </p>
                    </div>
                ) : eligibleRequests.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-5 text-center">
                        <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                            No eligible requisitions found.
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">
                            Add dealer quotes in requisitions first, then create PO.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Requisition
                                </label>
                                <select
                                    value={selectedRequestId}
                                    onChange={e => setSelectedRequestId(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white uppercase"
                                >
                                    <option value="">Select requisition</option>
                                    {eligibleRequests.map(request => (
                                        <option key={request.id} value={request.id}>
                                            {(request.display_id || `REQ-${request.id.slice(0, 8).toUpperCase()}`) +
                                                ` (${request.source_type})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Dealer Quote
                                </label>
                                <select
                                    value={selectedQuoteId}
                                    onChange={e => setSelectedQuoteId(e.target.value)}
                                    disabled={!selectedRequest}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white disabled:opacity-50"
                                >
                                    <option value="">Select quote</option>
                                    {selectableQuotes.map(quote => (
                                        <option key={quote.id} value={quote.id}>
                                            {`${parseDealerName(quote.id_tenants)} • ${formatCurrency(quoteTotal(quote))} • ${quote.status}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={12} />
                                    Expected Delivery
                                </label>
                                <input
                                    type="date"
                                    value={expectedDeliveryDate}
                                    onChange={e => setExpectedDeliveryDate(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Building2 size={12} />
                                    Transporter
                                </label>
                                <input
                                    type="text"
                                    value={transporterName}
                                    onChange={e => setTransporterName(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Docket / LR #
                                </label>
                                <input
                                    type="text"
                                    value={docketNumber}
                                    onChange={e => setDocketNumber(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreatePO}
                        disabled={submitting || loading || !selectedRequestId || !selectedQuoteId}
                        className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {submitting ? 'Creating...' : 'Create PO'}
                    </button>
                </div>
            </div>
        </div>
    );
}
