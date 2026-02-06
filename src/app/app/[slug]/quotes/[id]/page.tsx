'use client';

import { useParams } from 'next/navigation';
import QuotesPage from '@/components/modules/quotes/QuotesPage';

export default function QuoteDetailPage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
    return <QuotesPage initialQuoteId={id} />;
}
