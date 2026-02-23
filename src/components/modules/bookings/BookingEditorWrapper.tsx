'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import type { QuoteData } from '@/components/modules/quotes/QuoteEditorTable';

const QuoteEditorTable = dynamic(() => import('@/components/modules/quotes/QuoteEditorTable'), {
    loading: () => (
        <div className="flex items-center justify-center h-[60vh] text-sm text-slate-400">Loading editor...</div>
    ),
});
import {
    getBookingById,
    getQuoteById,
    getTasksForEntity,
    getQuotesForMember,
    getQuotesForLead,
    getBookingsForMember,
    getBookingsForLead,
    getReceiptsForEntity,
    confirmSalesOrder,
} from '@/actions/crm';
import { getFinanceApplications } from '@/actions/finance';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';

interface BookingEditorWrapperProps {
    bookingId: string;
    onClose?: () => void;
    onRefresh?: () => void;
    defaultTab?: 'DYNAMIC' | 'FINANCE' | 'MEMBER' | 'TASKS' | 'DOCUMENTS' | 'TIMELINE' | 'NOTES' | 'HISTORY';
}

export default function BookingEditorWrapper({
    bookingId,
    onClose,
    onRefresh,
    defaultTab = 'DYNAMIC',
}: BookingEditorWrapperProps) {
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [booking, setBooking] = useState<any | null>(null);
    const [financeApps, setFinanceApps] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [relatedQuotes, setRelatedQuotes] = useState<
        {
            id: string;
            displayId: string;
            status?: string | null;
            createdAt?: string | null;
            onRoadPrice?: string | number | null;
            createdBy?: string | null;
            vehicleName?: string | null;
            vehicleColor?: string | null;
        }[]
    >([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    useEffect(() => {
        loadBooking();
    }, [bookingId]);

    const loadBooking = async () => {
        setLoading(true);
        setError(null);

        const bookingRes = await getBookingById(bookingId);
        if (!bookingRes.success || !bookingRes.booking) {
            setError(bookingRes.error || 'Failed to load booking');
            setLoading(false);
            return;
        }

        const bookingRow = bookingRes.booking as any;
        setBooking(bookingRow);

        if (!bookingRow.quote_id) {
            setError('Booking missing quote link');
            setLoading(false);
            return;
        }

        const quoteRes = await getQuoteById(bookingRow.quote_id);
        if (!quoteRes.success || !quoteRes.data) {
            setError(quoteRes.error || 'Failed to load quote');
            setLoading(false);
            return;
        }

        setQuote(quoteRes.data as unknown as QuoteData);

        const taskData = await getTasksForEntity('BOOKING', bookingId);
        setTasks(taskData || []);

        const memberId = quoteRes.data.customerProfile?.memberId;
        const leadId = quoteRes.data.leadId;

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

        if (memberId) {
            const [bookingsData, paymentsData, financeData] = await Promise.all([
                getBookingsForMember(memberId),
                getReceiptsForEntity(leadId || null, memberId),
                getFinanceApplications(bookingId),
            ]);
            setBookings(bookingsData || []);
            setPayments(paymentsData || []);
            setFinanceApps(financeData || []);
        } else if (leadId) {
            const [bookingsData, paymentsData, financeData] = await Promise.all([
                getBookingsForLead(leadId),
                getReceiptsForEntity(leadId, null),
                getFinanceApplications(bookingId),
            ]);
            setBookings(bookingsData || []);
            setPayments(paymentsData || []);
            setFinanceApps(financeData || []);
        } else {
            setFinanceApps(await getFinanceApplications(bookingId));
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-sm text-slate-400">Loading booking...</div>
        );
    }

    if (error || !quote) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-sm text-rose-500">
                {error || 'Booking not found'}
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
            onSave={async () => {
                toast.info('Sales Order is locked. No edits allowed.');
            }}
            onSendToCustomer={async () => {}}
            onConfirmBooking={async () => {
                if (!booking?.id) return;
                const res = await confirmSalesOrder(booking.id);
                if (res.success) {
                    toast.success('Sales order confirmed');
                    await loadBooking();
                    onRefresh?.();
                } else {
                    toast.error(res.message || 'Failed to confirm sales order');
                }
            }}
            onRefresh={onRefresh}
            isEditable={false}
            mode="booking"
            dynamicTabLabel="BOOKING DETAILS"
            defaultTab={defaultTab}
            booking={booking}
            bookingFinanceApps={financeApps}
        />
    );
}
