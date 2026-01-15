'use client';

import React from 'react';
import { DeviceLayout } from '@/components/layout/DeviceLayout';
import { StoreMobile } from '@/components/store/StoreMobile';
import { StoreTablet } from '@/components/store/StoreTablet';
import { StoreDesktop } from '@/components/store/StoreDesktop';

export default function StorePage() {
    return (
        <DeviceLayout
            mobile={<StoreMobile />}
            tablet={<StoreTablet />}
            desktop={<StoreDesktop />}
            tv={<StoreDesktop variant="tv" />}
        />
    );
}
