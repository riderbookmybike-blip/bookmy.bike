import type { Metadata } from 'next';
import ClientServiceArea from './ClientServiceArea';

export const metadata: Metadata = {
    title: 'Service Areas — AUMS',
};

export default function AumsServiceAreaRoute() {
    return <ClientServiceArea />;
}
