import React from 'react';
import { ComparePageClient } from './ComparePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Compare Bikes | BookMyBike',
    description: 'Compare bikes, scooters and EVs side by side — pricing, specs, performance and more.',
};

export default function ComparePage() {
    return <ComparePageClient />;
}
