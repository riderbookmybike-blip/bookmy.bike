'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { useTenant } from '@/lib/tenant/tenantContext';
import LoginSidebar from '@/components/auth/LoginSidebar';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { tenantType, userRole, activeRole, isSidebarExpanded, setIsSidebarExpanded, tenantConfig } = useTenant();
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Prevent hydration mismatch

    // BRANDING INJECTION
    const primaryColor = tenantConfig?.brand?.primaryColor;
    const displayName = tenantConfig?.brand?.displayName;

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
        if (tenantType === 'MARKETPLACE') return 'OWNER';
        return 'DEALERSHIP_ADMIN';
    })();

    // DETECT REGULAR USER (BMB Visitors)
    const isPowerRole = ['OWNER', 'DEALERSHIP_ADMIN', 'DEALERSHIP_STAFF', 'BANK_STAFF'].includes(activeRole || '');
    const isRegularUser = activeRole === 'BMB_USER' || (!isPowerRole && activeRole !== undefined);

    // SETUP ENFORCEMENT
    React.useEffect(() => {
        // Regular users have nothing to "setup", so ignore them
        if (isRegularUser) return;

        if (tenantConfig && tenantConfig.setup?.isComplete === false) {
            // Only force setup for Admins
            const isAdmin = effectiveRole === 'OWNER' || effectiveRole === 'DEALERSHIP_ADMIN';
            if (isAdmin) {
                window.location.href = '/setup';
            }
        }
    }, [tenantConfig, effectiveRole, isRegularUser]);

    // --- REGULAR USER LAYOUT ---
    if (isRegularUser) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />
                <main className="pt-20 p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </main>
                <LoginSidebar
                    isOpen={isLoginOpen}
                    onClose={() => setIsLoginOpen(false)}
                    variant="RETAIL"
                />
            </div>
        );
    }

    // --- ADMIN / ENTERPRISE LAYOUT ---
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

            <div className="flex pt-16">
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
