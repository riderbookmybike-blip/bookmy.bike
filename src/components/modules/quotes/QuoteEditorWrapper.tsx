'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QuoteEditorTable, { QuoteData } from './QuoteEditorTable';
import {
    getQuoteById,
    updateQuotePricing,
    sendQuoteToCustomer,
    markQuoteInReview,
    getTasksForEntity,
    getQuotesForMember,
    getQuotesForLead,
    getBookingsForMember,
    getBookingsForLead,
    getReceiptsForEntity,
    createBookingFromQuote,
} from '@/actions/crm';
import { resolveFinanceRoute } from '@/actions/resolveFinanceRoute';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';

interface QuoteEditorWrapperProps {
    quoteId: string;
    onClose?: () => void;
    onRefresh?: () => void;
}

export default function QuoteEditorWrapper({ quoteId, onClose, onRefresh }: QuoteEditorWrapperProps) {
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [relatedQuotes, setRelatedQuotes] = useState<
        {
            id: string;
            displayId: string;
            status?: string | null;
            createdAt?: string | null;
            onRoadPrice?: string | number | null;
            createdBy?: string | null;
        }[]
    >([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvedRoute, setResolvedRoute] = useState<any>(null);
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    useEffect(() => {
        loadQuote();
    }, [quoteId]);

    const loadQuote = async () => {
        setLoading(true);
        setError(null);

        const result = await getQuoteById(quoteId);

        if (result.success && result.data) {
            if (result.data.status === 'DRAFT') {
                const markResult = await markQuoteInReview(quoteId);
                if (!markResult.success) {
                    toast.error(markResult.error || 'Failed to mark quote in review');
                }
                const now = new Date().toISOString();
                setQuote({
                    ...(result.data as unknown as QuoteData),
                    status: 'IN_REVIEW',
                    reviewedAt: now,
                    timeline: [
                        ...(result.data.timeline || []),
                        { event: 'In Review', timestamp: now, actor: null, actorType: 'team' },
                    ],
                });
            } else {
                setQuote(result.data as unknown as QuoteData);
            }

            const taskData = await getTasksForEntity('QUOTE', quoteId);
            setTasks(taskData || []);

            // Fetch ALL quotes for this MEMBER (member-level, not lead-level)
            const memberId = result.data.customerProfile?.memberId;
            const leadId = result.data.leadId;

            if (memberId) {
                const memberQuotes = await getQuotesForMember(memberId);
                setRelatedQuotes(
                    (memberQuotes || []).map((q: any) => ({
                        id: q.id,
                        displayId: q.display_id || q.displayId || formatDisplayId(q.id),
                        status: q.status,
                        createdAt: q.created_at || q.createdAt,
                        onRoadPrice: q.on_road_price,
                        createdBy: q.created_by,
                        vehicleName:
                            [q.commercials?.brand, q.commercials?.model, q.commercials?.variant]
                                .filter(Boolean)
                                .join(' ') || null,
                        vehicleColor: q.commercials?.color_name || q.commercials?.color || null,
                    }))
                );
            } else if (leadId) {
                const leadQuotes = await getQuotesForLead(leadId);
                setRelatedQuotes(
                    (leadQuotes || []).map((q: any) => ({
                        id: q.id,
                        displayId: q.display_id || q.displayId || formatDisplayId(q.id),
                        status: q.status,
                        createdAt: q.created_at || q.createdAt,
                        onRoadPrice: q.on_road_price,
                        createdBy: q.created_by,
                        vehicleName:
                            [q.commercials?.brand, q.commercials?.model, q.commercials?.variant]
                                .filter(Boolean)
                                .join(' ') || null,
                        vehicleColor: q.commercials?.color_name || q.commercials?.color || null,
                    }))
                );
            } else {
                setRelatedQuotes([]);
            }

            // Fetch Bookings and Payments — member-level
            if (memberId) {
                const [bookingsData, paymentsData] = await Promise.all([
                    getBookingsForMember(memberId),
                    getReceiptsForEntity(leadId || null, memberId),
                ]);
                setBookings(bookingsData);
                setPayments(paymentsData);
            } else if (leadId) {
                const [bookingsData, paymentsData] = await Promise.all([
                    getBookingsForLead(leadId),
                    getReceiptsForEntity(leadId, null),
                ]);
                setBookings(bookingsData);
                setPayments(paymentsData);
            }
        } else {
            setError(result.error || 'Failed to load quote');
        }

        // Resolve finance routing for dealer quotes
        if (result.success && result.data) {
            const tenantId = (result.data as any).tenantId || (result.data as any).tenant_id;
            if (tenantId) {
                try {
                    const route = await resolveFinanceRoute(tenantId);
                    setResolvedRoute(route);
                } catch (e) {
                    console.warn('[QuoteEditor] Finance route resolution failed:', e);
                }
            }
        }

        setLoading(false);
    };

    const handleSave = async (data: Partial<QuoteData>) => {
        if (!quote) return;

        const result = await updateQuotePricing(quoteId, {
            rtoType: data.pricing?.rtoType,
            rtoTotal: data.pricing?.rtoTotal,
            rtoBreakdown: data.pricing?.rtoBreakdown,
            rtoOptions: data.pricing?.rtoOptions,
            // Pass full objects for insurance addons to persist amounts
            insuranceAddons: data.pricing?.insuranceAddons?.filter(a => a.selected) as any,
            insuranceTotal: data.pricing?.insuranceTotal,
            insuranceOD: data.pricing?.insuranceOD,
            insuranceTP: data.pricing?.insuranceTP,
            insuranceGST: data.pricing?.insuranceGST,
            accessories: data.pricing?.accessories?.filter(a => a.selected) as any,
            accessoriesTotal: data.pricing?.accessoriesTotal,
            services: data.pricing?.services?.filter((s: any) => s.selected) as any,
            servicesTotal: data.pricing?.servicesTotal,
            grandTotal: data.pricing?.finalTotal,
            managerDiscount: data.pricing?.managerDiscount,
            managerDiscountNote: data.pricing?.managerDiscountNote || undefined,
        });

        if (result.success) {
            if (result.newQuoteId && result.newQuoteId !== quoteId) {
                onRefresh?.();
                if (slug) {
                    window.location.href = `/app/${slug}/quotes/${result.newQuoteId}`;
                }
                return;
            }
            await loadQuote(); // Reload to get updated data
            onRefresh?.();
        } else {
            throw new Error(result.error);
        }
    };

    const handleSendToCustomer = async () => {
        const result = await sendQuoteToCustomer(quoteId);

        if (result.success) {
            toast.success('Quote sent to customer');
            await loadQuote();
            onRefresh?.();
        } else {
            toast.error(result.error || 'Failed to send quote');
        }
    };

    const handleConfirmBooking = async () => {
        const result = await createBookingFromQuote(quoteId);

        if (result.success && (result as any).data?.id) {
            toast.success('Sales order created');
            onRefresh?.();
            if (slug) {
                window.location.href = `/app/${slug}/sales-orders/${(result as any).data.id}?stage=BOOKING`;
            }
        } else {
            toast.error(result.message || 'Failed to create sales order');
        }
    };

    if (loading) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0d10] p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-hidden">
                {/* Skeleton: Header Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-28 h-5 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
                        <div className="w-20 h-5 bg-indigo-100 dark:bg-indigo-500/10 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-24 h-8 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
                        <div className="w-24 h-8 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
                    </div>
                </div>

                {/* Skeleton: Customer + Vehicle Info */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="w-3/4 max-w-[192px] h-5 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
                            <div className="w-1/2 max-w-[128px] h-3 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                        </div>
                        <div className="w-20 sm:w-28 h-7 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse shrink-0 hidden sm:block" />
                    </div>
                    <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex gap-4 sm:gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex-1 space-y-2">
                                <div className="w-12 sm:w-16 h-2.5 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                                <div className="w-16 sm:w-24 h-4 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skeleton: Pricing Rows */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-white/5">
                        <div className="w-40 h-3 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                        <div className="flex-1" />
                        <div className="w-20 h-3 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                        <div className="w-24 h-3 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                    </div>
                    {/* Rows */}
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 dark:border-white/[0.03] last:border-0"
                        >
                            <div
                                className={`h-4 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse`}
                                style={{ width: `${100 + (i % 3) * 40}px`, animationDelay: `${i * 100}ms` }}
                            />
                            <div className="flex-1" />
                            <div
                                className="w-16 h-4 bg-slate-100 dark:bg-white/5 rounded animate-pulse"
                                style={{ animationDelay: `${i * 100 + 50}ms` }}
                            />
                            <div
                                className="w-20 h-4 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse"
                                style={{ animationDelay: `${i * 100 + 100}ms` }}
                            />
                        </div>
                    ))}
                    {/* Total Row */}
                    <div className="flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/10">
                        <div className="w-32 h-5 bg-slate-300 dark:bg-white/15 rounded-lg animate-pulse" />
                        <div className="w-28 h-6 bg-indigo-200 dark:bg-indigo-500/20 rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Skeleton: Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <div className="w-32 h-10 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
                    <div className="w-36 h-10 bg-indigo-200 dark:bg-indigo-500/15 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0b0d10]">
                <div className="text-center">
                    <p className="text-red-500 dark:text-red-400 text-lg font-medium">Error Loading Quote</p>
                    <p className="text-slate-500 dark:text-white/40 text-sm mt-2">{error || 'Quote not found'}</p>
                    <button
                        onClick={loadQuote}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white text-sm rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <QuoteEditorTable
            quote={quote}
            tasks={tasks}
            relatedQuotes={relatedQuotes}
            bookings={bookings}
            payments={payments}
            onSave={handleSave}
            onSendToCustomer={handleSendToCustomer}
            onConfirmBooking={handleConfirmBooking}
            onRefresh={loadQuote}
            isEditable={quote.status === 'DRAFT' || quote.status === 'IN_REVIEW'}
            resolvedRoute={resolvedRoute}
        />
    );
}
