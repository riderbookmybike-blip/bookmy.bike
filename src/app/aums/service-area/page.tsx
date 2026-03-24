import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const ServiceAreaPage = dynamic(() => import('@/app/app/[slug]/superadmin/service-area/page'), {
    ssr: false,
});

export const metadata: Metadata = {
    title: 'Service Areas — AUMS',
};

export default function AumsServiceAreaRoute() {
    return <ServiceAreaPage />;
}
