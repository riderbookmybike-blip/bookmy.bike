import React from 'react';
import { OCircleClient } from './OCircleClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "O'Circle — Zero Downpayment Membership | BookMyBike",
    description:
        "Join O'Circle for zero downpayment, zero processing fee, and zero documentation. Instant digital eKYC. Earn B-Coins rewards on every purchase.",
    openGraph: {
        title: "O'Circle — Zero Downpayment Membership | BookMyBike",
        description:
            'Own your dream ride with zero barriers. Instant digital verification, no paperwork, no hidden fees.',
        type: 'website',
    },
};

export default function OCirclePage() {
    return <OCircleClient />;
}
