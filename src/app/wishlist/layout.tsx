import React from 'react';
import StoreLayoutClient from '../store/StoreLayoutClient';
import { isMobileDevice } from '@/lib/utils/device';

export default async function WishlistLayout({ children }: { children: React.ReactNode }) {
    const isMobile = await isMobileDevice();
    const initialDevice = isMobile ? 'phone' : 'desktop';

    return <StoreLayoutClient initialDevice={initialDevice}>{children}</StoreLayoutClient>;
}
