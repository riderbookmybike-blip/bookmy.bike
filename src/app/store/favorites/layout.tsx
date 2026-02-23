import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Your Garage — Saved Vehicles | BookMyBike',
    description: 'View your shortlisted bikes and scooters. Compare them side-by-side or proceed to booking.',
    robots: {
        index: false,
        follow: true,
    },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
    return children;
}
