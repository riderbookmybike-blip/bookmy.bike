'use client';

import { useParams, useSearchParams } from 'next/navigation';
import BookingEditorWrapper from '@/components/modules/bookings/BookingEditorWrapper';

export default function SalesOrderDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
    const stage = (searchParams?.get('stage') || '').toUpperCase();
    const tabMap: Record<string, any> = {
        BOOKING: 'DYNAMIC',
        PAYMENT: 'TRANSACTIONS',
        FINANCE: 'FINANCE',
        ALLOTMENT: 'TASKS',
        COMPLIANCE: 'DOCUMENTS',
        PDI: 'TASKS',
        INSURANCE: 'DOCUMENTS',
        REGISTRATION: 'DOCUMENTS',
        DELIVERED: 'TIMELINE',
        FEEDBACK: 'NOTES',
    };
    const defaultTab = tabMap[stage] || 'DYNAMIC';
    return <BookingEditorWrapper bookingId={id} defaultTab={defaultTab} />;
}
