'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { useTenant } from '@/lib/tenant/tenantContext';
import LoginSidebar from '@/components/auth/LoginSidebar';
// AumsFooter removed for Dashboard

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { tenantType, userRole, activeRole, isSidebarExpanded, setIsSidebarExpanded, tenantConfig } = useTenant();
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    // BRANDING INJECTION
    const primaryColor = tenantConfig?.brand?.primaryColor;
    const displayName = tenantConfig?.brand?.displayName;

    // TODO: Dynamic Meta Tags (Title/Favicon) are harder in client components.
    // Ideally use generateMetadata in a Server Component layout, but context is client-side.
    // For now, we inject CSS variables.

    const handleSidebarHoverChange = (isHovered: boolean) => {
        if (!isSidebarPinned) {
            setIsSidebarExpanded(isHovered);
        }
    };

    const toggleSidebarPin = () => {
        setIsSidebarPinned(!isSidebarPinned);
        setIsSidebarExpanded(!isSidebarPinned);
    };

    // Intelligent Role Fallback
    const effectiveRole = activeRole || userRole || (() => {
        if (tenantType === 'MARKETPLACE') return 'MARKETPLACE_ADMIN';
        if (tenantType === 'BANK') return 'BANK_ADMIN';
        return 'TENANT_ADMIN';
    })();

    // SETUP ENFORCEMENT
    React.useEffect(() => {
        if (tenantConfig && tenantConfig.setup?.isComplete === false) {
            // Only force setup for Admins
            const isAdmin = effectiveRole?.includes('ADMIN') || effectiveRole?.includes('OWNER');
            if (isAdmin) {
                // Prevent loop if we are already redirected (though this layout is for /dashboard)
                window.location.href = '/setup';
            }
        }
    }, [tenantConfig, effectiveRole]);

    return (
        <div
            className="min-h-screen bg-slate-50 dark:bg-slate-950"
            style={{
                // @ts-ignore
                '--primary': primaryColor || '#4F46E5', // Indigo-600 default
            } as React.CSSProperties}
        >
            {/* Dedicated CRM Header */}
            <DashboardHeader
                onMenuClick={() => setIsMobileSidebarOpen(true)}
                showSearch={true}
            />

            <div className="flex pt-16"> {/* Reduced top padding for 64px header */}
                {/* Sidebar Component */}
                <Sidebar
                    role={effectiveRole as any}
                    isExpanded={isSidebarExpanded}
                    isPinned={isSidebarPinned}
                    onHoverChange={handleSidebarHoverChange}
                    onPinToggle={toggleSidebarPin}
                    isMobileOpen={isMobileSidebarOpen}
                    onMobileClose={() => setIsMobileSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div
                    className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}
                >
                    <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                        {children}
                    </main>
                    {/* Footer Removed for Dashboard */}
                </div>
            </div>

            <LoginSidebar
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                variant="TERMINAL"
            />
        </div>
    );
}


