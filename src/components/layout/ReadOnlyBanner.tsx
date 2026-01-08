'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';

export default function ReadOnlyBanner() {
    const { isReadOnly, status } = useTenant();

    if (!isReadOnly) return null;

    const msg = status === 'TRIAL_EXPIRED'
        ? 'Your trial has expired. Account is in Read-Only mode.'
        : 'Account is past due. Functionality is limited.';

    return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-sm text-center font-medium" role="alert">
            <span>{msg}</span>
            <span className="ml-4 underline cursor-pointer hover:text-yellow-800">Upgrade Now</span>
        </div>
    );
}
