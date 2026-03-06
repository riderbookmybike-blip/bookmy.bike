import type { Metadata } from 'next';
import AppsPageClient from './AppsPageClient';

export const metadata: Metadata = {
    title: 'Download BookMyBike App | iOS & Android',
    description:
        'Download the BookMyBike app on iOS or Android. Discover, compare and book your next motorcycle — faster, smarter, anywhere.',
};

export default function AppsPage() {
    return <AppsPageClient />;
}
