'use client';

import dynamic from 'next/dynamic';

const ServiceAreaPage = dynamic(() => import('@/app/app/[slug]/superadmin/service-area/page'), {
    ssr: false,
});

export default function ClientServiceArea() {
    return <ServiceAreaPage />;
}
