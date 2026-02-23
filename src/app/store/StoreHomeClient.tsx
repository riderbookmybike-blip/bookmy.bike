'use client';

import React from 'react';
import { M2Home } from '@/components/store/mobile/M2Home';

interface StoreHomeClientProps {
    initialItems?: any[];
}

export default function StoreHomeClient({ initialItems }: StoreHomeClientProps) {
    return <M2Home heroImage="/images/hero_d8.jpg" initialItems={initialItems} />;
}
