import React from 'react';
import { isMobileDevice } from '@/lib/utils/device';
import { DesktopHome } from '@/components/store/DesktopHome';
import { M2Home } from '@/components/store/mobile/M2Home';

export default async function StorePage() {
    const isPhone = await isMobileDevice();

    return isPhone ? <M2Home /> : <DesktopHome />;
}
