import React from 'react';
import { SystemCompareRouter } from '../../SystemCompareRouter';
import { isMobileDevice } from '@/lib/utils/device';

export default async function ComparePage() {
    const isMobile = await isMobileDevice();
    return <SystemCompareRouter initialDevice={isMobile ? 'phone' : 'desktop'} />;
}
