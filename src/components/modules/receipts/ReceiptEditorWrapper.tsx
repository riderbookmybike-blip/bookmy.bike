'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QuoteEditorTable, { QuoteData } from '@/components/modules/quotes/QuoteEditorTable';
import {
    getReceiptById,
    getBookingById,
    getQuoteById,
    getQuotesForLead,
    getQuotesForMember,
    getReceiptsForEntity,
    getBookingsForLead,
    getBookingsForMember,
} from '@/actions/crm';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';

export default function ReceiptEditorWrapper({ receiptId }: { receiptId: string }) {
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [receipt, setReceipt] = useState<any | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    useEffect(() => {
        loadReceipt();
    }, [receiptId]);

    const loadReceipt = async () => {
        setLoading(true);
        setError(null);

        const receiptRes = await getReceiptById(receiptId);
        if (!receiptRes.success || !receiptRes.receipt) {
            setError(receiptRes.error || 'Receipt not found');
            setLoading(false);
            return;
        }

        const receiptRow = receiptRes.receipt as any;
        setReceipt(receiptRow);

        let quoteId: string | null = null;
        if (receiptRow.booking_id) {
            const bookingRes = await getBookingById(receiptRow.booking_id);
            if (bookingRes.success && bookingRes.booking?.quote_id) {
                quoteId = bookingRes.booking.quote_id;
            }
        }

        if (!quoteId && receiptRow.lead_id) {
            const quotes = await getQuotesForLead(receiptRow.lead_id);
            quoteId = quotes?.[0]?.id || null;
        }

        if (!quoteId && receiptRow.member_id) {
            const quotes = await getQuotesForMember(receiptRow.member_id);
            quoteId = quotes?.[0]?.id || null;
        }

        if (!quoteId) {
            setError('No linked quote found for this receipt');
            setLoading(false);
            return;
        }

        const quoteRes = await getQuoteById(quoteId);
        if (!quoteRes.success || !quoteRes.data) {
            setError(quoteRes.error || 'Failed to load quote');
            setLoading(false);
            return;
        }

        setQuote(quoteRes.data as unknown as QuoteData);

        // related data for Transactions tab
        if (receiptRow.member_id) {
            const [bookingsData, receiptsData] = await Promise.all([
                getBookingsForMember(receiptRow.member_id),
                getReceiptsForEntity(receiptRow.lead_id || null, receiptRow.member_id),
            ]);
            setBookings(bookingsData || []);
            setReceipts(receiptsData || []);
        } else if (receiptRow.lead_id) {
            const [bookingsData, receiptsData] = await Promise.all([
                getBookingsForLead(receiptRow.lead_id),
                getReceiptsForEntity(receiptRow.lead_id, null),
            ]);
            setBookings(bookingsData || []);
            setReceipts(receiptsData || []);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-sm text-slate-400">Loading receipt...</div>
        );
    }

    if (error || !quote) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-sm text-rose-500">
                {error || 'Receipt not found'}
            </div>
        );
    }

    return (
        <QuoteEditorTable
            quote={quote}
            tasks={[]}
            relatedQuotes={[]}
            bookings={bookings}
            payments={receipts}
            onSave={async () => {
                toast.info('Receipt view is locked for quote edits');
            }}
            onSendToCustomer={async () => {}}
            onConfirmBooking={async () => {}}
            isEditable={false}
            mode="receipt"
            dynamicTabLabel="RECEIPT"
            defaultTab="DYNAMIC"
            receipt={receipt}
            onRefresh={loadReceipt}
        />
    );
}
