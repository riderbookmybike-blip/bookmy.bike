'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

type ExistingQuote = {
    id: string;
    dealer_tenant_id: string;
    bundled_item_ids?: string[] | null;
    bundled_amount: number;
    transport_amount: number;
    freebie_description: string | null;
    status: 'SUBMITTED' | 'SELECTED' | 'REJECTED';
    id_tenants?: { name: string | null } | { name: string | null }[] | null;
};

const formatCurrency = (amount: number | null | undefined) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
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
    const [bundledAmount, setBundledAmount] = useState('');
    const [transportAmount, setTransportAmount] = useState('');
    const [freebieDescription, setFreebieDescription] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [editingQuoteId, setEditingQuoteId] = useState('');
    const [cloneSourceQuoteId, setCloneSourceQuoteId] = useState('');
    const [cloneTargetDealerIds, setCloneTargetDealerIds] = useState<string[]>([]);
    const [cloning, setCloning] = useState(false);

    useEffect(() => {
        setSelectedItemIds(requestItems.map(item => item.id));
    }, [requestItems]);

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

    const expectedTotal = useMemo(() => {
        const selectedSet = new Set(selectedItemIds);
        return requestItems
            .filter(item => selectedSet.has(item.id))
            .reduce((sum, item) => sum + Number(item.expected_amount || 0), 0);
    }, [requestItems, selectedItemIds]);

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
        if (editingQuoteId) return;
        if (!cloneSourceQuote) return;

        setBundledAmount(String(cloneSourceQuote.bundled_amount || ''));
        setTransportAmount(String(cloneSourceQuote.transport_amount || 0));
        setFreebieDescription(cloneSourceQuote.freebie_description || '');

        const validItemIds = (cloneSourceQuote.bundled_item_ids || []).filter(itemId =>
            requestItems.some(item => item.id === itemId)
        );
        if (validItemIds.length > 0) {
            setSelectedItemIds(validItemIds);
        }

        if (dealerTenantId === cloneSourceQuote.dealer_tenant_id) {
            setDealerTenantId('');
        }

        setCloneTargetDealerIds(prev =>
            prev.filter(
                targetId => targetId !== cloneSourceQuote.dealer_tenant_id && !activeQuoteDealerIds.has(targetId)
            )
        );
    }, [activeQuoteDealerIds, cloneSourceQuote, dealerTenantId, editingQuoteId, requestItems]);

    useEffect(() => {
        if (!editingQuote) return;
        setDealerTenantId(editingQuote.dealer_tenant_id);
        setBundledAmount(String(editingQuote.bundled_amount || 0));
        setTransportAmount(String(editingQuote.transport_amount || 0));
        setFreebieDescription(editingQuote.freebie_description || '');

        const validItemIds = (editingQuote.bundled_item_ids || []).filter(itemId =>
            requestItems.some(item => item.id === itemId)
        );
        setSelectedItemIds(validItemIds.length > 0 ? validItemIds : requestItems.map(item => item.id));
    }, [editingQuote, requestItems]);

    const resetQuoteForm = () => {
        setEditingQuoteId('');
        setDealerTenantId('');
        setBundledAmount('');
        setTransportAmount('');
        setFreebieDescription('');
        setSelectedItemIds(requestItems.map(item => item.id));
    };

    const toggleItem = (itemId: string) => {
        setSelectedItemIds(prev => (prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]));
    };

    const toggleCloneTarget = (dealerId: string) => {
        setCloneTargetDealerIds(prev =>
            prev.includes(dealerId) ? prev.filter(id => id !== dealerId) : [...prev, dealerId]
        );
    };

    const handleSubmit = async () => {
        const bundleValue = Number(bundledAmount);
        const transportValue = Number(transportAmount || 0);

        if (!editingQuote && !dealerTenantId) {
            toast.error('Select supplier dealership');
            return;
        }
        if (!bundleValue || Number.isNaN(bundleValue) || bundleValue <= 0) {
            toast.error('Enter valid bundled amount');
            return;
        }

        setSubmitting(true);
        try {
            const result = editingQuote
                ? await updateDealerQuote({
                      quote_id: editingQuote.id,
                      bundled_item_ids: selectedItemIds,
                      bundled_amount: bundleValue,
                      transport_amount: transportValue,
                      freebie_description: freebieDescription.trim() || null,
                  })
                : await addDealerQuote({
                      request_id: requestId,
                      dealer_tenant_id: dealerTenantId,
                      bundled_item_ids: selectedItemIds,
                      bundled_amount: bundleValue,
                      transport_amount: transportValue,
                      freebie_description: freebieDescription.trim() || undefined,
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

        setCloning(true);
        try {
            let successCount = 0;
            const failedDealers: string[] = [];

            for (const dealerId of cloneTargetDealerIds) {
                const result = await addDealerQuote({
                    request_id: requestId,
                    dealer_tenant_id: dealerId,
                    bundled_item_ids: cloneSourceQuote.bundled_item_ids || selectedItemIds,
                    bundled_amount: Number(cloneSourceQuote.bundled_amount || 0),
                    transport_amount: Number(cloneSourceQuote.transport_amount || 0),
                    freebie_description: cloneSourceQuote.freebie_description || undefined,
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
                                Bundled Amount
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={bundledAmount}
                                onChange={e => setBundledAmount(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                            />
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
                            Freebies / Add-ons Included (optional)
                        </label>
                        <input
                            type="text"
                            value={freebieDescription}
                            onChange={e => setFreebieDescription(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                        />
                    </div>

                    {requestItems.length > 0 && (
                        <div className="mt-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                Included Cost Lines ({selectedItemIds.length}/{requestItems.length}) • Expected{' '}
                                {formatCurrency(expectedTotal)}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {requestItems.map(item => {
                                    const checked = selectedItemIds.includes(item.id);
                                    return (
                                        <label
                                            key={item.id}
                                            className={`rounded-xl border px-3 py-2 text-[10px] uppercase font-black tracking-wide flex items-center justify-between cursor-pointer ${
                                                checked
                                                    ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            <span>{item.cost_type.replace(/_/g, ' ')}</span>
                                            <span>{formatCurrency(item.expected_amount)}</span>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleItem(item.id)}
                                                className="hidden"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

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
