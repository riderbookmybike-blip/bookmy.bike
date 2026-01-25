'use client';

import React from 'react';
import StoreLayout from '../store/layout';
import { WishlistClient } from '@/components/store/WishlistClient';

export default function WishlistPage() {
    return (
        <StoreLayout>
            <main className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 py-1 md:py-2 min-h-[70vh]">
                <WishlistClient />
            </main>
        </StoreLayout>
    );
}
