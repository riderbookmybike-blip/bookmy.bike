'use client';

import React from 'react';
import StoreLayout from '@/app/store/layout';
import { M2Home } from '@/components/store/mobile/M2Home';

export default function M2Page() {
    return (
        <StoreLayout>
            <M2Home />
        </StoreLayout>
    );
}
