'use client';

import { useParams } from 'next/navigation';
import ReceiptsPage from '@/components/modules/receipts/ReceiptsPage';

export default function ReceiptDetailPage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
    return <ReceiptsPage initialReceiptId={id} />;
}
