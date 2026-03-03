'use client';

import React from 'react';
import { StoreHomePage } from '@/components/store/mobile/StoreHomePage';

interface StoreHomeClientProps {
    initialItems?: any[];
    initialDevice?: 'phone' | 'desktop' | 'tv';
}

export default function StoreHomeClient({ initialItems, initialDevice = 'desktop' }: StoreHomeClientProps) {
    return <StoreHomePage heroImage="/images/hero_d8.jpg" initialItems={initialItems} initialDevice={initialDevice} />;
}
