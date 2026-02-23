'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { useTenant } from '@/lib/tenant/tenantContext';
const LoginSidebar = dynamic(() => import('@/components/auth/LoginSidebar'), { ssr: false });
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { UserRole } from '@/config/permissions';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { CrmReadOnlyGuard } from '@/components/layout/CrmReadOnlyGuard';
import { MobileViewBanner } from '@/components/layout/MobileViewBanner';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

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
    const isHome = pathname === '/' || pathname === '/store';

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
            <div className="min-h-screen bg-white dark:bg-slate-950">
                <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />
                <main className={`${isHome ? 'pt-0' : 'pt-20'} p-0 md:p-0 max-w-none mx-auto overflow-x-hidden`}>
                    {children}
                </main>
                <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
            </div>
        );
        return <FavoritesProvider>{content}</FavoritesProvider>;
    }

    // --- ADMIN / ENTERPRISE LAYOUT ---

    // Mobile CRM: responsive views handle phone/tablet layout via Phase 0–2.
    // No gate needed — MobileViewBanner shows a dismissible "best on desktop" hint instead.

    // Responsive padding: phone=p-3, tablet=p-5, desktop=p-6/p-8
    const mainPadding = isPhone ? 'pb-[84px]' : isTablet ? 'p-5' : 'p-6 md:p-8';
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
                <div
                    className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out ${contentMargin}`}
                >
                    <main
                        className={`flex-1 h-full min-w-0 w-full ${isPhone ? 'overflow-hidden' : 'overflow-y-auto'} ${mainPadding} bg-slate-50 dark:bg-slate-950 relative`}
                    >
                        <CrmReadOnlyGuard>{children}</CrmReadOnlyGuard>
                    </main>
                </div>
            </div>

            {/* Phone: Bottom Nav replaces sidebar */}
            {isPhone && <MobileBottomNav onMoreClick={() => setIsMobileSidebarOpen(true)} />}

            {/* Mobile View Banner (only tablet — phone has bottom nav) */}
            {!isPhone && <MobileViewBanner />}
            <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="TERMINAL" />
        </div>
    );
    return <FavoritesProvider>{content}</FavoritesProvider>;
}
