'use client';

import React, { useEffect, useState } from 'react';
import QuoteEditorTable, { QuoteData } from './QuoteEditorTable';
import { getQuoteById, updateQuotePricing, sendQuoteToCustomer, confirmQuoteAction } from '@/actions/crm';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface QuoteEditorWrapperProps {
    quoteId: string;
}

export default function QuoteEditorWrapper({ quoteId }: QuoteEditorWrapperProps) {
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadQuote();
    }, [quoteId]);

    const loadQuote = async () => {
        setLoading(true);
        setError(null);

        const result = await getQuoteById(quoteId);

        if (result.success && result.data) {
            // Map QuoteEditorData to QuoteData
            setQuote(result.data as unknown as QuoteData);
        } else {
            setError(result.error || 'Failed to load quote');
        }

        setLoading(false);
    };

    const handleSave = async (data: Partial<QuoteData>) => {
        if (!quote) return;

        const result = await updateQuotePricing(quoteId, {
            rtoType: data.pricing?.rtoType,
            insuranceAddons: data.pricing?.insuranceAddons?.filter(a => a.selected).map(a => a.id),
            accessories: data.pricing?.accessories?.filter(a => a.selected).map(a => a.id),
            managerDiscount: data.pricing?.managerDiscount,
            managerDiscountNote: data.pricing?.managerDiscountNote || undefined,
        });

        if (result.success) {
            await loadQuote(); // Reload to get updated data
        } else {
            throw new Error(result.error);
        }
    };

    const handleSendToCustomer = async () => {
        const result = await sendQuoteToCustomer(quoteId);

        if (result.success) {
            toast.success('Quote sent to customer');
            await loadQuote();
        } else {
            toast.error(result.error || 'Failed to send quote');
        }
    };

    const handleConfirmBooking = async () => {
        const result = await confirmQuoteAction(quoteId);

        if (result.success) {
            toast.success('Booking confirmed!');
            await loadQuote();
        } else {
            toast.error(result.message || 'Failed to confirm booking');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    <p className="text-white/60 text-sm">Loading quote...</p>
                </div>
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="text-center">
                    <p className="text-red-400 text-lg font-medium">Error Loading Quote</p>
                    <p className="text-white/40 text-sm mt-2">{error || 'Quote not found'}</p>
                    <button
                        onClick={loadQuote}
                        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
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
            onSave={handleSave}
            onSendToCustomer={handleSendToCustomer}
            onConfirmBooking={handleConfirmBooking}
            isEditable={quote.status === 'DRAFT' || quote.status === 'PENDING_REVIEW'}
        />
    );
}
