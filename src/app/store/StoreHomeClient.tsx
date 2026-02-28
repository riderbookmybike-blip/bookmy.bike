'use client';

import React from 'react';
import { M2Home } from '@/components/store/mobile/M2Home';

interface StoreHomeClientProps {
    initialItems?: any[];
    initialDevice?: 'phone' | 'desktop';
}

export default function StoreHomeClient({ initialItems, initialDevice = 'desktop' }: StoreHomeClientProps) {
    return <M2Home heroImage="/images/hero_d8.jpg" initialItems={initialItems} initialDevice={initialDevice} />;
}
