'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { useTenant } from '@/lib/tenant/tenantContext';
import LoginSidebar from '@/components/auth/LoginSidebar';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { UserRole } from '@/config/permissions';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { CrmReadOnlyGuard } from '@/components/layout/CrmReadOnlyGuard';
import { MobileViewBanner } from '@/components/layout/MobileViewBanner';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
    const { userRole, activeRole, isSidebarExpanded, setIsSidebarExpanded, tenantConfig } = useTenant();
    const pathname = usePathname();
    const { device, hydrated: breakpointHydrated } = useBreakpoint();
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const isPhone = device === 'phone';
    const isTablet = device === 'tablet';
    const isMobileDevice = isPhone || isTablet;
    const isMobileEnabled = !!tenantConfig?.features?.CRM_MOBILE_ENABLED;

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAppRoute = (pathname || '').startsWith('/app/');

    // BRANDING INJECTION
    const primaryColor = tenantConfig?.brand?.primaryColor;

    // Intelligent Role Fallback (Only fallback within safe boundaries)
    const effectiveRole = activeRole || userRole || (isAppRoute ? undefined : 'BMB_USER');

    // DETECT REGULAR USER (BMB Visitors)
    // Fix: check based on effectiveRole to avoid flicker during initial undefined state
    const isRegularUser =
        !isAppRoute &&
        (effectiveRole === 'BMB_USER' ||
            ![
                'OWNER',
                'DEALERSHIP_ADMIN',
                'DEALERSHIP_STAFF',
                'BANK_STAFF',
                'SUPER_ADMIN',
                'MARKETPLACE_ADMIN',
            ].includes(effectiveRole || ''));

    // SETUP ENFORCEMENT
    useEffect(() => {
        if (!mounted) return;
        // Regular users have nothing to "setup", so ignore them
        if (isRegularUser) return;

        if (tenantConfig && tenantConfig.setup?.isComplete === false) {
            // Only force setup for Admins
            const isAdmin =
                effectiveRole === 'OWNER' ||
                effectiveRole === 'DEALERSHIP_ADMIN' ||
                effectiveRole === 'SUPER_ADMIN' ||
                effectiveRole === 'MARKETPLACE_ADMIN';
            if (isAdmin) {
                window.location.href = '/setup';
            }
        }
    }, [tenantConfig, effectiveRole, isRegularUser, mounted]);

    // 2. Redirect authenticated users away from /login (Unified Guardrail)
    useEffect(() => {
        if (!mounted || pathname !== '/login') return;

        // Check if user is authenticated (activeRole or userRole is set)
        const isAuthenticated = !!(activeRole || userRole);
        if (!isAuthenticated) return;

        // We ARE authenticated and on /login -> Time to bounce
        const searchParams = new URLSearchParams(window.location.search);
        const nextPath = searchParams.get('next');

        // Logic matched with LoginSidebar for consistency
        const target = nextPath || (effectiveRole && effectiveRole !== 'BMB_USER' ? '/app/aums/dashboard' : '/');

        // Safety: Only redirect if destination is different
        if (pathname !== target) {
            window.location.href = target;
        }
    }, [mounted, pathname, effectiveRole, activeRole, userRole]);

    // 1. Hydration Guard & Early Loading State
    // Crucial: Server and Client Initial Render must match.
    // Since activeRole/userRole are client-side only (Populated in useEffect of TenantProvider),
    // we must render the same loading state on both server and client initial render for APP routes.
    let content: React.ReactNode = null;
    if (!mounted) {
        if (isAppRoute) {
            content = (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Loading workspace...
                        </p>
                    </div>
                </div>
            );
        }
        return <FavoritesProvider>{content}</FavoritesProvider>;
    }

    const handleSidebarHoverChange = (isHovered: boolean) => {
        if (!isSidebarPinned) {
            setIsSidebarExpanded(isHovered);
        }
    };

    const toggleSidebarPin = () => {
        setIsSidebarPinned(!isSidebarPinned);
        setIsSidebarExpanded(!isSidebarPinned);
    };

    // Avoid marketplace shell on /app/* while role is still loading
    if (isAppRoute && !activeRole && !userRole) {
        content = (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Loading workspace...
                    </p>
                </div>
            </div>
        );
        return <FavoritesProvider>{content}</FavoritesProvider>;
    }

    // --- REGULAR USER LAYOUT ---
    if (isRegularUser) {
        content = (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />
                <main className="pt-20 p-8 md:p-10 max-w-7xl mx-auto">{children}</main>
                <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
            </div>
        );
        return <FavoritesProvider>{content}</FavoritesProvider>;
    }

    // --- ADMIN / ENTERPRISE LAYOUT ---

    // GATE: If CRM_MOBILE_ENABLED is OFF and device is phone/tablet → block CRM entirely
    if (breakpointHydrated && !isMobileEnabled && isMobileDevice) {
        content = (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <div className="text-center space-y-4 max-w-xs">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                        <svg
                            className="w-7 h-7 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                            />
                        </svg>
                    </div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Desktop Required</h2>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">
                        The CRM workspace is optimized for desktop browsers. Please switch to a laptop or desktop for
                        the best experience.
                    </p>
                </div>
            </div>
        );
        return <FavoritesProvider>{content}</FavoritesProvider>;
    }

    // Responsive padding: phone=p-3, tablet=p-5, desktop=p-6/p-8
    const mainPadding = isPhone ? 'p-3' : isTablet ? 'p-5' : 'p-6 md:p-8';
    // On phone: no sidebar margin. On tablet: always collapsed (md:ml-20). On desktop: dynamic.
    const contentMargin = isPhone ? '' : isTablet ? 'md:ml-20' : isSidebarExpanded ? 'md:ml-64' : 'md:ml-20';

    content = (
        <div
            className="min-h-screen bg-slate-50 dark:bg-slate-950"
            style={
                {
                    '--primary': primaryColor || '#4F46E5', // Indigo-600 default
                } as React.CSSProperties
            }
        >
            {/* Dedicated CRM Header */}
            <DashboardHeader onMenuClick={() => setIsMobileSidebarOpen(true)} showSearch={true} />

            <div className="flex pt-14 h-screen overflow-hidden">
                {/* Sidebar: hidden on phone (hamburger-only), collapsed on tablet */}
                {!isPhone && (
                    <Sidebar
                        role={effectiveRole as UserRole}
                        isExpanded={isTablet ? false : isSidebarExpanded}
                        isPinned={isTablet ? false : isSidebarPinned}
                        onHoverChange={isTablet ? () => {} : handleSidebarHoverChange}
                        onPinToggle={isTablet ? () => {} : toggleSidebarPin}
                        isMobileOpen={false}
                        onMobileClose={() => {}}
                    />
                )}

                {/* Mobile sidebar overlay (phone + tablet hamburger) */}
                {(isPhone || isTablet) && (
                    <Sidebar
                        role={effectiveRole as UserRole}
                        isExpanded={true}
                        isPinned={false}
                        onHoverChange={() => {}}
                        onPinToggle={() => {}}
                        isMobileOpen={isMobileSidebarOpen}
                        onMobileClose={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col h-full transition-all duration-300 ease-in-out ${contentMargin}`}>
                    <main
                        className={`flex-1 h-full overflow-y-auto ${mainPadding} bg-slate-50 dark:bg-slate-950 relative`}
                    >
                        <CrmReadOnlyGuard>{children}</CrmReadOnlyGuard>
                    </main>
                </div>
            </div>

            {/* Mobile View Banner (only renders on phone/tablet) */}
            <MobileViewBanner />
            <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="TERMINAL" />
        </div>
    );
    return <FavoritesProvider>{content}</FavoritesProvider>;
}
