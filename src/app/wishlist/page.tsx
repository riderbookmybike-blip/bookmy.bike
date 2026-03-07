'use client';

import React from 'react';
import { WishlistClient } from '@/components/store/WishlistClient';

export default function WishlistPage() {
    return (
        <main className="min-h-[70vh]">
            <WishlistClient />
        </main>
    );
}
