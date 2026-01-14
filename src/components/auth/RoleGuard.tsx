'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import { useTenant } from '@/lib/tenant/tenantContext';
import { Resource, Action } from '@/config/permissions';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
    resource: Resource;
    action?: Action;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export default function RoleGuard({
    resource,
    action = 'view',
    fallback,
    children
}: RoleGuardProps) {
    const { can, role } = usePermission();
    const { tenantSlug } = useTenant();
    const router = useRouter();

    if (!can(resource, action)) {
        if (fallback) return <>{fallback}</>;

        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[50vh]">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🚫</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Access Denied</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                    You do not have permission to {action} {resource}.<br />
                    Current Role: <span className="font-mono font-bold">{role}</span>
                </p>
                <button
                    onClick={() => router.push(tenantSlug ? `/app/${tenantSlug}/dashboard` : '/dashboard')}
                    className="mt-6 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
