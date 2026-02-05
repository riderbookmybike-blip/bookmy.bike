'use client';

import React, { useState, useEffect } from 'react';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import LoginSidebar from '@/components/auth/LoginSidebar';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { usePathname } from 'next/navigation';
import { PhoneHeader } from '@/components/phone/layout/PhoneHeader';
import { PhoneBottomNav } from '@/components/phone/layout/PhoneBottomNav';
import { ColorProvider } from '@/contexts/ColorContext';
import { getSelfMemberLocation } from '@/actions/members';
import { setLocationCookie } from '@/actions/locationCookie';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    useEffect(() => {
        const handleOpenLogin = () => setIsLoginOpen(true);
        window.addEventListener('openLogin', handleOpenLogin);
        return () => window.removeEventListener('openLogin', handleOpenLogin);
    }, []);

    useEffect(() => {
        const bootstrapLocation = async () => {
            if (typeof window === 'undefined') return;
            try {
                let cachedData: any = null;
                const cached = localStorage.getItem('bkmb_user_pincode');
                if (cached) {
                    try {
                        cachedData = JSON.parse(cached);
                    } catch {
                        localStorage.removeItem('bkmb_user_pincode');
                    }
                }

                // If user manually set location, just sync cookie for SSR
                if (cachedData?.manuallySet && cachedData?.pincode) {
                    await setLocationCookie({
                        pincode: cachedData.pincode,
                        taluka: cachedData.taluka,
                        district: cachedData.district,
                        state: cachedData.state,
                        stateCode: cachedData.stateCode,
                        lat: cachedData.lat,
                        lng: cachedData.lng,
                    });
                    return;
                }

                const member = await getSelfMemberLocation();
                if (member?.pincode) {
                    const stateMap: Record<string, string> = {
                        MAHARASHTRA: 'MH',
                        KARNATAKA: 'KA',
                        DELHI: 'DL',
                        GUJARAT: 'GJ',
                        TAMIL_NADU: 'TN',
                        TELANGANA: 'TS',
                        UTTAR_PRADESH: 'UP',
                        WEST_BENGAL: 'WB',
                        RAJASTHAN: 'RJ',
                    };
                    const resolvedState = member.state || undefined;
                    const derivedStateCode = resolvedState
                        ? stateMap[resolvedState.toUpperCase()] || resolvedState.substring(0, 2).toUpperCase()
                        : undefined;
                    const payload = {
                        pincode: member.pincode,
                        taluka: member.taluka || undefined,
                        district: member.district || undefined,
                        state: resolvedState,
                        stateCode: derivedStateCode,
                        lat: member.latitude ?? null,
                        lng: member.longitude ?? null,
                        manuallySet: false,
                        source: 'PROFILE',
                    };

                    localStorage.setItem('bkmb_user_pincode', JSON.stringify(payload));
                    await setLocationCookie({
                        pincode: payload.pincode,
                        taluka: payload.taluka,
                        district: payload.district,
                        state: payload.state,
                        stateCode: payload.stateCode,
                        lat: payload.lat,
                        lng: payload.lng,
                    });
                    window.dispatchEvent(new Event('locationChanged'));
                    return;
                }

                // Fallback: sync cookie from cache (if any) to keep SSR aligned
                if (cachedData?.pincode) {
                    await setLocationCookie({
                        pincode: cachedData.pincode,
                        taluka: cachedData.taluka,
                        district: cachedData.district,
                        state: cachedData.state,
                        stateCode: cachedData.stateCode,
                        lat: cachedData.lat,
                        lng: cachedData.lng,
                    });
                }
            } catch (err) {
                console.error('[Location] Store bootstrap failed:', err);
            }
        };

        bootstrapLocation();
    }, []);

    const pathname = usePathname();
    const isLandingPage = pathname === '/store' || pathname === '/';

    return (
        <FavoritesProvider>
            <ColorProvider>
                <div className="marketplace min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-red-500/30 transition-colors duration-300 pb-20 md:pb-0">
                    {/* Desktop Header */}
                    <div className="hidden md:block">
                        <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />
                    </div>

                    {/* Mobile Header */}
                    <div className="block md:hidden">
                        <PhoneHeader />
                    </div>

                    <main className="flex-1 pt-0">{children}</main>

                    {!isLandingPage && <MarketplaceFooter />}

                    {/* Mobile Bottom Nav */}
                    <div className="block md:hidden">
                        <PhoneBottomNav />
                    </div>

                    {/* Global Login Sidebar */}
                    <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
                </div>
            </ColorProvider>
        </FavoritesProvider>
    );
}
