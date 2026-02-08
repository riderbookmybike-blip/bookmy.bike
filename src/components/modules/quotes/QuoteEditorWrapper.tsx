'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QuoteEditorTable, { QuoteData } from './QuoteEditorTable';
import {
    getQuoteById,
    updateQuotePricing,
    sendQuoteToCustomer,
    confirmQuoteAction,
    markQuoteInReview,
    getTasksForEntity,
    getQuotesForLead,
} from '@/actions/crm';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
            isLatest?: boolean | null;
            version?: number | null;
        }[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
                    status: 'PENDING_REVIEW',
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

            if (result.data.leadId) {
                const leadQuotes = await getQuotesForLead(result.data.leadId);
                setRelatedQuotes(
                    (leadQuotes || []).map((q: any) => ({
                        id: q.id,
                        displayId: q.display_id || q.displayId || formatDisplayId(q.id),
                        status: q.status,
                        createdAt: q.created_at || q.createdAt,
                        isLatest: q.is_latest ?? q.isLatest ?? false,
                        version: q.version ?? 1,
                    }))
                );
            } else {
                setRelatedQuotes([]);
            }
        } else {
            setError(result.error || 'Failed to load quote');
        }

        setLoading(false);
    };

    const handleSave = async (data: Partial<QuoteData>) => {
        if (!quote) return;

        const result = await updateQuotePricing(quoteId, {
            rtoType: data.pricing?.rtoType,
            // Pass full objects for insurance addons to persist amounts
            insuranceAddons: data.pricing?.insuranceAddons?.filter(a => a.selected) as any,
            insuranceTotal: data.pricing?.insuranceTotal,
            accessories: data.pricing?.accessories?.filter(a => a.selected) as any,
            accessoriesTotal: data.pricing?.accessoriesTotal,
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
        const result = await confirmQuoteAction(quoteId);

        if (result.success) {
            toast.success('Booking confirmed!');
            await loadQuote();
            onRefresh?.();
        } else {
            toast.error(result.message || 'Failed to confirm booking');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0b0d10]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary dark:text-white" />
                    <p className="text-slate-500 dark:text-white/60 text-sm">Loading quote...</p>
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
            onSave={handleSave}
            onSendToCustomer={handleSendToCustomer}
            onConfirmBooking={handleConfirmBooking}
            isEditable={quote.status === 'DRAFT' || quote.status === 'PENDING_REVIEW'}
        />
    );
}
