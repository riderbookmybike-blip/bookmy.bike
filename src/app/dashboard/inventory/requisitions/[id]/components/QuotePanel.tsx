'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, PencilLine, PlusCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { addDealerQuote, getSupplierTenants, updateDealerQuote } from '@/actions/inventory';

type RequestItem = {
    id: string;
    cost_type: string;
    expected_amount: number;
    description: string | null;
};

type SupplierTenant = {
    id: string;
    name: string | null;
    slug: string | null;
    type: string | null;
};

type QuoteLineItem = {
    request_item_id: string;
    offered_amount: number;
    notes: string | null;
};

type QuoteTerms = {
    payment_mode: 'ADVANCE' | 'PARTIAL' | 'CREDIT' | 'OTHER' | null;
    credit_days: number | null;
    advance_percent: number | null;
    expected_dispatch_days: number | null;
    notes: string | null;
};

type ExistingQuote = {
    id: string;
    dealer_tenant_id: string;
    bundled_item_ids?: string[] | null;
    bundled_amount: number;
    transport_amount: number;
    freebie_description: string | null;
    status: 'SUBMITTED' | 'SELECTED' | 'REJECTED';
    id_tenants?: { name: string | null } | { name: string | null }[] | null;
    inv_quote_line_items?: QuoteLineItem[] | null;
    inv_quote_terms?: QuoteTerms | null;
};

const PAYMENT_MODE_OPTIONS = [
    { value: '', label: 'No terms' },
    { value: 'ADVANCE', label: 'Advance' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'CREDIT', label: 'Credit' },
    { value: 'OTHER', label: 'Other' },
] as const;

const formatCurrency = (amount: number | null | undefined) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const toPositiveAmount = (value: unknown) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100) / 100;
};

const parseDealerName = (quote: ExistingQuote) => {
    const value = quote.id_tenants;
    if (!value) return quote.dealer_tenant_id;
    if (Array.isArray(value)) return value[0]?.name || quote.dealer_tenant_id;
    return value.name || quote.dealer_tenant_id;
};

export default function QuotePanel({
    requestId,
    requestStatus,
    requestItems,
    existingQuotes,
    tenantId,
    onRefresh,
}: {
    requestId: string;
    requestStatus: 'QUOTING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    requestItems: RequestItem[];
    existingQuotes: ExistingQuote[];
    tenantId: string;
    onRefresh: () => void;
}) {
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [suppliers, setSuppliers] = useState<SupplierTenant[]>([]);
    const [dealerTenantId, setDealerTenantId] = useState('');
    const [transportAmount, setTransportAmount] = useState('');
    const [freebieDescription, setFreebieDescription] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [lineItemAmounts, setLineItemAmounts] = useState<Record<string, string>>({});
    const [editingQuoteId, setEditingQuoteId] = useState('');
    const [cloneSourceQuoteId, setCloneSourceQuoteId] = useState('');
    const [cloneTargetDealerIds, setCloneTargetDealerIds] = useState<string[]>([]);
    const [cloning, setCloning] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'' | 'ADVANCE' | 'PARTIAL' | 'CREDIT' | 'OTHER'>('');
    const [creditDays, setCreditDays] = useState('');
    const [advancePercent, setAdvancePercent] = useState('');
    const [expectedDispatchDays, setExpectedDispatchDays] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const expectedAmountById = useMemo(
        () =>
            requestItems.reduce(
                (acc, item) => {
                    acc[item.id] = Number(item.expected_amount || 0);
                    return acc;
                },
                {} as Record<string, number>
            ),
        [requestItems]
    );

    const applyDefaultMatrix = useCallback(() => {
        const defaultSelectedIds = requestItems.map(item => item.id);
        const defaultAmounts = requestItems.reduce(
            (acc, item) => {
                acc[item.id] = String(Number(item.expected_amount || 0));
                return acc;
            },
            {} as Record<string, string>
        );
        setSelectedItemIds(defaultSelectedIds);
        setLineItemAmounts(defaultAmounts);
    }, [requestItems]);

    const applyQuoteMatrix = useCallback(
        (quote: ExistingQuote | null) => {
            if (!quote) {
                applyDefaultMatrix();
                return;
            }

            const quoteLineItems = Array.isArray(quote.inv_quote_line_items) ? quote.inv_quote_line_items : [];
            const validQuoteLines = quoteLineItems.filter(line =>
                requestItems.some(item => item.id === line.request_item_id)
            );

            if (validQuoteLines.length > 0) {
                const nextAmounts: Record<string, string> = {};
                requestItems.forEach(item => {
                    nextAmounts[item.id] = String(Number(item.expected_amount || 0));
                });

                const selectedFromLines: string[] = [];
                validQuoteLines.forEach(line => {
                    const offered = toPositiveAmount(line.offered_amount);
                    nextAmounts[line.request_item_id] = String(offered);
                    if (offered > 0) selectedFromLines.push(line.request_item_id);
                });

                const fallbackSelected = (quote.bundled_item_ids || []).filter(id =>
                    requestItems.some(item => item.id === id)
                );
                const selected = selectedFromLines.length > 0 ? selectedFromLines : fallbackSelected;
                setSelectedItemIds(selected.length > 0 ? selected : requestItems.map(item => item.id));
                setLineItemAmounts(nextAmounts);
                return;
            }

            const bundledIds = (quote.bundled_item_ids || []).filter(id => requestItems.some(item => item.id === id));
            const selected = bundledIds.length > 0 ? bundledIds : requestItems.map(item => item.id);

            const amounts: Record<string, string> = {};
            requestItems.forEach(item => {
                amounts[item.id] = String(Number(item.expected_amount || 0));
            });

            if (selected.length === 1 && Number(quote.bundled_amount || 0) > 0) {
                amounts[selected[0]] = String(Number(quote.bundled_amount || 0));
            }

            setSelectedItemIds(selected);
            setLineItemAmounts(amounts);
        },
        [applyDefaultMatrix, requestItems]
    );

    const resetTerms = useCallback(() => {
        setPaymentMode('');
        setCreditDays('');
        setAdvancePercent('');
        setExpectedDispatchDays('');
        setPaymentNotes('');
    }, []);

    const applyQuoteTerms = useCallback(
        (quote: ExistingQuote | null) => {
            if (!quote?.inv_quote_terms) {
                resetTerms();
                return;
            }
            const terms = quote.inv_quote_terms;
            setPaymentMode((terms.payment_mode || '') as '' | 'ADVANCE' | 'PARTIAL' | 'CREDIT' | 'OTHER');
            setCreditDays(
                terms.credit_days !== null && terms.credit_days !== undefined ? String(terms.credit_days) : ''
            );
            setAdvancePercent(
                terms.advance_percent !== null && terms.advance_percent !== undefined
                    ? String(terms.advance_percent)
                    : ''
            );
            setExpectedDispatchDays(
                terms.expected_dispatch_days !== null && terms.expected_dispatch_days !== undefined
                    ? String(terms.expected_dispatch_days)
                    : ''
            );
            setPaymentNotes(terms.notes || '');
        },
        [resetTerms]
    );

    useEffect(() => {
        const fetchSuppliers = async () => {
            setLoadingSuppliers(true);
            try {
                const result = await getSupplierTenants();
                if (!result.success || !result.data) {
                    throw new Error(result.message || 'Failed to fetch suppliers');
                }
                const allSuppliers = (result.data as SupplierTenant[]) || [];
                setSuppliers(allSuppliers.filter(supplier => supplier.id !== tenantId));
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Failed to fetch suppliers');
            } finally {
                setLoadingSuppliers(false);
            }
        };

        fetchSuppliers();
    }, [tenantId]);

    const activeQuoteDealerIds = useMemo(
        () => new Set(existingQuotes.filter(quote => quote.status !== 'REJECTED').map(quote => quote.dealer_tenant_id)),
        [existingQuotes]
    );

    const cloneSourceQuote = useMemo(
        () => existingQuotes.find(quote => quote.id === cloneSourceQuoteId) || null,
        [cloneSourceQuoteId, existingQuotes]
    );

    const editableQuotes = useMemo(
        () => existingQuotes.filter(quote => quote.status === 'SUBMITTED'),
        [existingQuotes]
    );
    const editingQuote = useMemo(
        () => editableQuotes.find(quote => quote.id === editingQuoteId) || null,
        [editableQuotes, editingQuoteId]
    );

    const cloneTargets = useMemo(() => {
        if (!cloneSourceQuote) return [];
        return suppliers.filter(supplier => {
            if (supplier.id === cloneSourceQuote.dealer_tenant_id) return false;
            return !activeQuoteDealerIds.has(supplier.id);
        });
    }, [activeQuoteDealerIds, cloneSourceQuote, suppliers]);

    useEffect(() => {
        if (editingQuote) return;
        if (!cloneSourceQuote) return;

        setTransportAmount(String(cloneSourceQuote.transport_amount || 0));
        setFreebieDescription(cloneSourceQuote.freebie_description || '');
        applyQuoteMatrix(cloneSourceQuote);
        applyQuoteTerms(cloneSourceQuote);

        if (dealerTenantId === cloneSourceQuote.dealer_tenant_id) {
            setDealerTenantId('');
        }

        setCloneTargetDealerIds(prev =>
            prev.filter(
                targetId => targetId !== cloneSourceQuote.dealer_tenant_id && !activeQuoteDealerIds.has(targetId)
            )
        );
    }, [activeQuoteDealerIds, applyQuoteMatrix, applyQuoteTerms, cloneSourceQuote, dealerTenantId, editingQuote]);

    useEffect(() => {
        if (!editingQuote) return;
        setDealerTenantId(editingQuote.dealer_tenant_id);
        setTransportAmount(String(editingQuote.transport_amount || 0));
        setFreebieDescription(editingQuote.freebie_description || '');
        applyQuoteMatrix(editingQuote);
        applyQuoteTerms(editingQuote);
    }, [applyQuoteMatrix, applyQuoteTerms, editingQuote]);

    useEffect(() => {
        if (!editingQuote && !cloneSourceQuote) {
            applyDefaultMatrix();
        }
    }, [applyDefaultMatrix, cloneSourceQuote, editingQuote]);

    const expectedTotal = useMemo(
        () =>
            selectedItemIds.reduce((sum, itemId) => {
                return sum + Number(expectedAmountById[itemId] || 0);
            }, 0),
        [expectedAmountById, selectedItemIds]
    );

    const bundledAmount = useMemo(
        () =>
            selectedItemIds.reduce((sum, itemId) => {
                return sum + toPositiveAmount(lineItemAmounts[itemId]);
            }, 0),
        [lineItemAmounts, selectedItemIds]
    );

    const transportValue = useMemo(() => toPositiveAmount(transportAmount), [transportAmount]);
    const totalOffer = Math.round((bundledAmount + transportValue) * 100) / 100;
    const varianceAmount = Math.round((bundledAmount - expectedTotal) * 100) / 100;

    const resetQuoteForm = useCallback(() => {
        setEditingQuoteId('');
        setDealerTenantId('');
        setTransportAmount('');
        setFreebieDescription('');
        setCloneSourceQuoteId('');
        setCloneTargetDealerIds([]);
        resetTerms();
        applyDefaultMatrix();
    }, [applyDefaultMatrix, resetTerms]);

    const toggleItem = (itemId: string) => {
        setSelectedItemIds(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            }
            return [...prev, itemId];
        });
        setLineItemAmounts(prev => {
            if (prev[itemId] && Number(prev[itemId]) > 0) return prev;
            return {
                ...prev,
                [itemId]: String(Number(expectedAmountById[itemId] || 0)),
            };
        });
    };

    const toggleCloneTarget = (dealerId: string) => {
        setCloneTargetDealerIds(prev =>
            prev.includes(dealerId) ? prev.filter(id => id !== dealerId) : [...prev, dealerId]
        );
    };

    const fillOfferedFromExpected = () => {
        setLineItemAmounts(prev => {
            const next = { ...prev };
            selectedItemIds.forEach(itemId => {
                next[itemId] = String(Number(expectedAmountById[itemId] || 0));
            });
            return next;
        });
    };

    const buildLineItemsPayload = useCallback(
        (quote?: ExistingQuote | null) => {
            if (quote) {
                const quoteLines = Array.isArray(quote.inv_quote_line_items) ? quote.inv_quote_line_items : [];
                if (quoteLines.length > 0) {
                    return quoteLines
                        .filter(line => requestItems.some(item => item.id === line.request_item_id))
                        .map(line => ({
                            request_item_id: line.request_item_id,
                            offered_amount: toPositiveAmount(line.offered_amount),
                            notes: line.notes || null,
                        }))
                        .filter(line => line.offered_amount > 0);
                }

                const fallbackIds = (quote.bundled_item_ids || []).filter(itemId =>
                    requestItems.some(item => item.id === itemId)
                );
                return fallbackIds
                    .map(itemId => ({
                        request_item_id: itemId,
                        offered_amount: toPositiveAmount(expectedAmountById[itemId] || 0),
                        notes: null,
                    }))
                    .filter(line => line.offered_amount > 0);
            }

            return selectedItemIds
                .map(itemId => ({
                    request_item_id: itemId,
                    offered_amount: toPositiveAmount(lineItemAmounts[itemId]),
                    notes: null,
                }))
                .filter(line => line.offered_amount > 0);
        },
        [expectedAmountById, lineItemAmounts, requestItems, selectedItemIds]
    );

    const buildPaymentTermsPayload = useCallback(
        (quote?: ExistingQuote | null) => {
            if (quote?.inv_quote_terms) {
                return {
                    payment_mode: quote.inv_quote_terms.payment_mode || null,
                    credit_days: quote.inv_quote_terms.credit_days ?? null,
                    advance_percent: quote.inv_quote_terms.advance_percent ?? null,
                    expected_dispatch_days: quote.inv_quote_terms.expected_dispatch_days ?? null,
                    notes: quote.inv_quote_terms.notes || null,
                };
            }

            const parsedCreditDays = Number(creditDays);
            const parsedAdvancePercent = Number(advancePercent);
            const parsedDispatchDays = Number(expectedDispatchDays);

            if (
                !paymentMode &&
                !Number.isFinite(parsedCreditDays) &&
                !Number.isFinite(parsedAdvancePercent) &&
                !Number.isFinite(parsedDispatchDays) &&
                !paymentNotes.trim()
            ) {
                return null;
            }

            return {
                payment_mode: paymentMode || null,
                credit_days:
                    Number.isFinite(parsedCreditDays) && parsedCreditDays >= 0 ? Math.round(parsedCreditDays) : null,
                advance_percent:
                    Number.isFinite(parsedAdvancePercent) && parsedAdvancePercent >= 0 && parsedAdvancePercent <= 100
                        ? Math.round(parsedAdvancePercent * 100) / 100
                        : null,
                expected_dispatch_days:
                    Number.isFinite(parsedDispatchDays) && parsedDispatchDays >= 0
                        ? Math.round(parsedDispatchDays)
                        : null,
                notes: paymentNotes.trim() || null,
            };
        },
        [advancePercent, creditDays, expectedDispatchDays, paymentMode, paymentNotes]
    );

    const handleSubmit = async () => {
        if (!editingQuote && !dealerTenantId) {
            toast.error('Select supplier dealership');
            return;
        }
        if (selectedItemIds.length === 0) {
            toast.error('Select at least one cost line');
            return;
        }
        if (bundledAmount <= 0) {
            toast.error('Offered total must be greater than zero');
            return;
        }

        const lineItemsPayload = buildLineItemsPayload();
        if (lineItemsPayload.length === 0) {
            toast.error('Set offered amount on selected cost lines');
            return;
        }

        setSubmitting(true);
        try {
            const result = editingQuote
                ? await updateDealerQuote({
                      quote_id: editingQuote.id,
                      bundled_item_ids: selectedItemIds,
                      bundled_amount: bundledAmount,
                      transport_amount: transportValue,
                      freebie_description: freebieDescription.trim() || null,
                      line_items: lineItemsPayload,
                      payment_terms: buildPaymentTermsPayload(),
                  })
                : await addDealerQuote({
                      request_id: requestId,
                      dealer_tenant_id: dealerTenantId,
                      bundled_item_ids: selectedItemIds,
                      bundled_amount: bundledAmount,
                      transport_amount: transportValue,
                      freebie_description: freebieDescription.trim() || undefined,
                      line_items: lineItemsPayload,
                      payment_terms: buildPaymentTermsPayload(),
                  });

            if (!result.success) {
                toast.error(
                    result.message || (editingQuote ? 'Failed to update dealer quote' : 'Failed to add dealer quote')
                );
                return;
            }

            toast.success(result.message || (editingQuote ? 'Dealer quote updated' : 'Dealer quote added'));
            resetQuoteForm();
            onRefresh();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : editingQuote
                      ? 'Failed to update dealer quote'
                      : 'Failed to add dealer quote'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloneQuote = async () => {
        if (!cloneSourceQuote) {
            toast.error('Select source quote first');
            return;
        }

        if (cloneTargetDealerIds.length === 0) {
            toast.error('Select at least one target dealer');
            return;
        }

        const sourceLineItems = buildLineItemsPayload(cloneSourceQuote);
        if (sourceLineItems.length === 0) {
            toast.error('Source quote has no valid line items to clone');
            return;
        }

        setCloning(true);
        try {
            let successCount = 0;
            const failedDealers: string[] = [];

            for (const dealerId of cloneTargetDealerIds) {
                const result = await addDealerQuote({
                    request_id: requestId,
                    dealer_tenant_id: dealerId,
                    bundled_item_ids: sourceLineItems.map(item => item.request_item_id),
                    bundled_amount: sourceLineItems.reduce((sum, item) => sum + item.offered_amount, 0),
                    transport_amount: Number(cloneSourceQuote.transport_amount || 0),
                    freebie_description: cloneSourceQuote.freebie_description || undefined,
                    line_items: sourceLineItems,
                    payment_terms: buildPaymentTermsPayload(cloneSourceQuote),
                });

                if (result.success) {
                    successCount += 1;
                } else {
                    failedDealers.push(dealerId);
                }
            }

            if (successCount > 0) {
                toast.success(`Cloned quote to ${successCount} dealer(s)`);
                setCloneTargetDealerIds([]);
                await onRefresh();
            }

            if (failedDealers.length > 0) {
                toast.error(`Failed for ${failedDealers.length} dealer(s)`);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to clone quote');
        } finally {
            setCloning(false);
        }
    };

    return (
        <div className="m-6 border border-slate-200 dark:border-white/10 rounded-2xl p-4 bg-slate-50 dark:bg-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Add Dealer Quote</p>

            {requestStatus !== 'QUOTING' ? (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quote entry disabled because requisition is {requestStatus}
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {editableQuotes.length > 0 && (
                            <div className="md:col-span-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Edit Existing Quote (optional)
                                </label>
                                <div className="mt-2 flex flex-col md:flex-row gap-2">
                                    <select
                                        value={editingQuoteId}
                                        onChange={e => setEditingQuoteId(e.target.value)}
                                        className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                                    >
                                        <option value="">Create new quote</option>
                                        {editableQuotes.map(quote => (
                                            <option key={quote.id} value={quote.id}>
                                                {`${parseDealerName(quote)} • ${formatCurrency(
                                                    Number(quote.bundled_amount || 0) +
                                                        Number(quote.transport_amount || 0)
                                                )}`}
                                            </option>
                                        ))}
                                    </select>
                                    {editingQuoteId && (
                                        <button
                                            onClick={resetQuoteForm}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-100 text-[10px] font-black uppercase tracking-wider"
                                        >
                                            <RotateCcw size={12} />
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Supplier
                            </label>
                            <select
                                value={dealerTenantId}
                                onChange={e => setDealerTenantId(e.target.value)}
                                disabled={loadingSuppliers || !!editingQuoteId}
                                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="">Select dealer</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name || supplier.slug || supplier.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Bundled Amount (Auto)
                            </label>
                            <div className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white">
                                {formatCurrency(bundledAmount)}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Transport Amount
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={transportAmount}
                                onChange={e => setTransportAmount(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white dark:bg-slate-900/40">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Cost Line Matrix ({selectedItemIds.length}/{requestItems.length})
                            </p>
                            <button
                                type="button"
                                onClick={fillOfferedFromExpected}
                                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300"
                            >
                                Fill From Expected
                            </button>
                        </div>
                        <div className="mt-3 space-y-2">
                            {requestItems.map(item => {
                                const checked = selectedItemIds.includes(item.id);
                                const expected = Number(item.expected_amount || 0);
                                const offered = toPositiveAmount(lineItemAmounts[item.id]);
                                return (
                                    <div
                                        key={item.id}
                                        className={`rounded-xl border px-3 py-3 ${
                                            checked
                                                ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                                                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleItem(item.id)}
                                                className="h-4 w-4 rounded border-slate-300"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                                    {item.cost_type.replace(/_/g, ' ')}
                                                </p>
                                                {item.description && (
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 line-clamp-1">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                    Expected
                                                </p>
                                                <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                                                    {formatCurrency(expected)}
                                                </p>
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={lineItemAmounts[item.id] ?? ''}
                                                    disabled={!checked}
                                                    onChange={e =>
                                                        setLineItemAmounts(prev => ({
                                                            ...prev,
                                                            [item.id]: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-2.5 py-1.5 text-[11px] font-black text-slate-900 dark:text-white disabled:opacity-50"
                                                />
                                                <p
                                                    className={`mt-1 text-[9px] font-black uppercase tracking-wider text-right ${
                                                        offered - expected <= 0 ? 'text-emerald-500' : 'text-amber-500'
                                                    }`}
                                                >
                                                    {offered > 0 ? formatCurrency(offered - expected) : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div className="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                    Expected
                                </p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {formatCurrency(expectedTotal)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bundled</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {formatCurrency(bundledAmount)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                    Variance
                                </p>
                                <p
                                    className={`text-sm font-black ${
                                        varianceAmount <= 0
                                            ? 'text-emerald-600 dark:text-emerald-300'
                                            : 'text-amber-600 dark:text-amber-300'
                                    }`}
                                >
                                    {formatCurrency(varianceAmount)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                    Total Offer
                                </p>
                                <p className="text-sm font-black text-indigo-600 dark:text-indigo-300">
                                    {formatCurrency(totalOffer)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white dark:bg-slate-900/40">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                            Payment Terms
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                    Payment Mode
                                </label>
                                <select
                                    value={paymentMode}
                                    onChange={e =>
                                        setPaymentMode(
                                            e.target.value as '' | 'ADVANCE' | 'PARTIAL' | 'CREDIT' | 'OTHER'
                                        )
                                    }
                                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                                >
                                    {PAYMENT_MODE_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                    Credit Days
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={creditDays}
                                    onChange={e => setCreditDays(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                    Advance Percent
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={advancePercent}
                                    onChange={e => setAdvancePercent(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                    Expected Dispatch (days)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={expectedDispatchDays}
                                    onChange={e => setExpectedDispatchDays(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                Terms Notes
                            </label>
                            <input
                                type="text"
                                value={paymentNotes}
                                onChange={e => setPaymentNotes(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {existingQuotes.length > 0 && !editingQuoteId && (
                        <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white dark:bg-slate-900/40">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                Clone Existing Quote
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <select
                                    value={cloneSourceQuoteId}
                                    onChange={e => setCloneSourceQuoteId(e.target.value)}
                                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                                >
                                    <option value="">Select source quote</option>
                                    {existingQuotes
                                        .filter(quote => quote.status !== 'REJECTED')
                                        .map(quote => (
                                            <option key={quote.id} value={quote.id}>
                                                {`${parseDealerName(quote)} • ${formatCurrency(
                                                    Number(quote.bundled_amount || 0) +
                                                        Number(quote.transport_amount || 0)
                                                )}`}
                                            </option>
                                        ))}
                                </select>
                                <button
                                    onClick={handleCloneQuote}
                                    disabled={cloning || !cloneSourceQuote || cloneTargetDealerIds.length === 0}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cloning ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <PlusCircle size={12} />
                                    )}
                                    {cloning ? 'Cloning...' : `Clone To ${cloneTargetDealerIds.length}`}
                                </button>
                            </div>
                            {cloneSourceQuote && (
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-auto pr-1">
                                    {cloneTargets.length === 0 ? (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            No eligible dealers left for cloning.
                                        </p>
                                    ) : (
                                        cloneTargets.map(supplier => {
                                            const checked = cloneTargetDealerIds.includes(supplier.id);
                                            return (
                                                <label
                                                    key={supplier.id}
                                                    className={`rounded-xl border px-3 py-2 text-[10px] uppercase font-black tracking-wide flex items-center justify-between cursor-pointer ${
                                                        checked
                                                            ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                                                    }`}
                                                >
                                                    <span>{supplier.name || supplier.slug || supplier.id}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleCloneTarget(supplier.id)}
                                                        className="hidden"
                                                    />
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Freebies / Additional Inclusions (optional)
                        </label>
                        <input
                            type="text"
                            value={freebieDescription}
                            onChange={e => setFreebieDescription(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || loadingSuppliers}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : editingQuoteId ? (
                                <PencilLine size={12} />
                            ) : (
                                <PlusCircle size={12} />
                            )}
                            {submitting ? 'Saving...' : editingQuoteId ? 'Save Quote' : 'Add Quote'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
