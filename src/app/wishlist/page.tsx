'use client';

import React from 'react';
import StoreLayout from '../store/layout';
import { WishlistClient } from '@/components/store/WishlistClient';

export default function WishlistPage() {
    return (
        <StoreLayout>
            <main className="page-container py-1 md:py-2 min-h-[70vh]">
                <WishlistClient />
            </main>
        </StoreLayout>
    );
}
