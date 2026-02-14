'use client';

import { useParams } from 'next/navigation';
import SalesOrdersPage from '@/components/modules/sales-orders/SalesOrdersPage';

export default function SalesOrderDetailPage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

    return <SalesOrdersPage initialOrderId={id} />;
}
