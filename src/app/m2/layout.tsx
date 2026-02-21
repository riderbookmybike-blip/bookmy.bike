import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "BookMyBike — India's Smartest Bike Marketplace",
    description:
        'Compare on-road prices, get instant quotes, and book your motorcycle or scooter. Zero hidden charges. 130+ models. 4-hour delivery.',
    robots: {
        index: false,
        follow: true,
    },
};

export default function M2Layout({ children }: { children: React.ReactNode }) {
    return children;
}
