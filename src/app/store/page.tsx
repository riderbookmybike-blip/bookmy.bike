import React from 'react';
import { isMobileDevice } from '@/lib/utils/device';
import StoreHomeClient from './StoreHomeClient';

export default async function StorePage() {
    const isPhone = await isMobileDevice();
    const initialDevice = isPhone ? 'phone' : 'desktop';

    return <StoreHomeClient initialDevice={initialDevice} />;
}
