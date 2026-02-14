'use client';

import { useParams } from 'next/navigation';
import ReceiptEditorWrapper from '@/components/modules/receipts/ReceiptEditorWrapper';

export default function ReceiptDetailPage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
    return <ReceiptEditorWrapper receiptId={id} />;
}
