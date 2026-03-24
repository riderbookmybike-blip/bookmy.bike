'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
const LoginSidebar = dynamic(() => import('@/components/auth/LoginSidebar'), { ssr: false });
const ShopperBottomNav = dynamic(
    () => import('@/components/store/mobile/ShopperBottomNav').then(m => ({ default: m.ShopperBottomNav })),
    { ssr: false }
);
const VehicleSearchOverlay = dynamic(
    () => import('@/components/store/mobile/VehicleSearchOverlay').then(m => ({ default: m.VehicleSearchOverlay })),
    { ssr: false }
);
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { usePathname, useSearchParams } from 'next/navigation';
import { ColorProvider } from '@/contexts/ColorContext';
import { DiscoveryProvider } from '@/contexts/DiscoveryContext';
import { getSelfMemberLocation } from '@/actions/members';
import { setLocationCookie } from '@/actions/locationCookie';
import { resolveLocation } from '@/utils/locationResolver';
import { DealershipGate } from '@/components/store/DealershipGate';
import Script from 'next/script';
import { migrateLegacyStorageKeys } from '@/lib/constants/storage';
const MemberTrackerAuto = dynamic(
    () => import('@/components/store/MemberTrackerAuto').then(m => ({ default: m.MemberTrackerAuto })),
    { ssr: false }
);

interface StoreLayoutClientProps {
    children: React.ReactNode;
    initialDevice: 'phone' | 'desktop';
}

import { REFERRAL_STORAGE_KEY, extractReferralFromParams } from '@/lib/constants/referral';
import { emitMemberTrackingEvent } from '@/lib/tracking/emitMemberTrackingEvent';

const readLatLng = (value: any): { lat: number | null; lng: number | null } => {
    const latRaw = value?.lat ?? value?.latitude;
    const lngRaw = value?.lng ?? value?.longitude;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    return {
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
    };
};

export default function StoreLayoutClient({ children }: StoreLayoutClientProps) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleOpenLogin = () => setIsLoginOpen(true);
        const handleOpenSearch = () => setIsSearchOpen(true);
        window.addEventListener('openLogin', handleOpenLogin);
        window.addEventListener('openMobileSearch', handleOpenSearch);
        return () => {
            window.removeEventListener('openLogin', handleOpenLogin);
            window.removeEventListener('openMobileSearch', handleOpenSearch);
        };
    }, []);

    useEffect(() => {
        migrateLegacyStorageKeys();
    }, []);

    useEffect(() => {
        const bootstrapLocation = async () => {
            if (typeof window === 'undefined') return;
            try {
                let cachedData: any = null;
                const cached = localStorage.getItem('bmb_user_pincode');
                if (cached) {
                    try {
                        cachedData = JSON.parse(cached);
                    } catch {
                        localStorage.removeItem('bmb_user_pincode');
                    }
                }

                // If user manually set location, just sync cookie for SSR
                if (cachedData?.manuallySet && cachedData?.pincode) {
                    const cachedCoords = readLatLng(cachedData);
                    // Backfill missing coordinates from pincode if legacy cache payload lacks lat/lng.
                    if (
                        (!Number.isFinite(cachedCoords.lat) || !Number.isFinite(cachedCoords.lng)) &&
                        /^\d{6}$/.test(String(cachedData.pincode || ''))
                    ) {
                        const resolved = await resolveLocation(String(cachedData.pincode));
                        if (resolved?.lat !== undefined && resolved?.lng !== undefined) {
                            cachedData = {
                                ...cachedData,
                                district: cachedData.district || resolved.district,
                                taluka: cachedData.taluka || resolved.taluka,
                                state: cachedData.state || resolved.state,
                                lat: resolved.lat,
                                lng: resolved.lng,
                            };
                            localStorage.setItem('bmb_user_pincode', JSON.stringify(cachedData));
                            window.dispatchEvent(new Event('locationChanged'));
                        }
                    }
                    await setLocationCookie({
                        pincode: cachedData.pincode,
                        taluka: cachedData.taluka,
                        district: cachedData.district,
                        state: cachedData.state,
                        stateCode: cachedData.stateCode,
                        lat: readLatLng(cachedData).lat,
                        lng: readLatLng(cachedData).lng,
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

                    localStorage.setItem('bmb_user_pincode', JSON.stringify(payload));
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
                    const cachedCoords = readLatLng(cachedData);
                    if (
                        (!Number.isFinite(cachedCoords.lat) || !Number.isFinite(cachedCoords.lng)) &&
                        /^\d{6}$/.test(String(cachedData.pincode || ''))
                    ) {
                        const resolved = await resolveLocation(String(cachedData.pincode));
                        if (resolved?.lat !== undefined && resolved?.lng !== undefined) {
                            cachedData = {
                                ...cachedData,
                                district: cachedData.district || resolved.district,
                                taluka: cachedData.taluka || resolved.taluka,
                                state: cachedData.state || resolved.state,
                                lat: resolved.lat,
                                lng: resolved.lng,
                            };
                            localStorage.setItem('bmb_user_pincode', JSON.stringify(cachedData));
                            window.dispatchEvent(new Event('locationChanged'));
                        }
                    }
                    await setLocationCookie({
                        pincode: cachedData.pincode,
                        taluka: cachedData.taluka,
                        district: cachedData.district,
                        state: cachedData.state,
                        stateCode: cachedData.stateCode,
                        lat: readLatLng(cachedData).lat,
                        lng: readLatLng(cachedData).lng,
                    });
                }
            } catch (err) {
                console.error('[Location] Store bootstrap failed:', err);
            }
        };

        bootstrapLocation();
    }, []);

    // Global referral capture for all /store pages.
    // This ensures links like /store?ref=XXXX persist referral into localStorage
    // before user navigates deeper to PDP or opens LoginSidebar.
    useEffect(() => {
        if (!searchParams) return;
        try {
            const referral = extractReferralFromParams(searchParams);
            if (referral) {
                localStorage.setItem(REFERRAL_STORAGE_KEY, referral);
                emitMemberTrackingEvent('REFERRAL_CAPTURED', {
                    referral_code: referral,
                    source_path: window.location.pathname,
                });
            }
        } catch {
            // Ignore storage failures (private mode policies, etc.)
        }
    }, [searchParams]);

    const pathname = usePathname();
    const isLandingPage = pathname === '/store' || pathname === '/' || pathname?.match(/^\/d[2-8]$/);

    return (
        <FavoritesProvider>
            <ColorProvider>
                <DiscoveryProvider>
                    <div
                        className={`marketplace min-h-screen flex flex-col ${
                            isLandingPage ? 'bg-white text-black' : 'bg-slate-50 text-slate-900'
                        } font-sans selection:bg-red-500/30 transition-colors duration-300`}
                    >
                        <Script
                            src="https://cdn.scaleflex.it/plugins/js-cloudimage-360-view/3.0.3/js-cloudimage-360-view.min.js"
                            strategy="afterInteractive"
                        />
                        <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />

                        {/* Member Activity Tracker — invisible, marketplace-level */}
                        <MemberTrackerAuto />

                        {/* Dealership Gate — blocks marketplace for staff without active dealership */}
                        <DealershipGate />

                        <main className="flex-1 pb-[60px] lg:pb-0" style={{ paddingTop: 'var(--header-h)' }}>
                            {children}
                        </main>

                        {/* Mobile Bottom Nav — hidden on desktop */}
                        <div className="lg:hidden">
                            <ShopperBottomNav />
                        </div>

                        {/* Footer: always on desktop, only on landing page on mobile */}
                        <div className={isLandingPage ? '' : 'hidden lg:block'}>
                            <MarketplaceFooter />
                        </div>

                        {/* Global mobile search portal — triggered by header Search icon */}
                        <div className="lg:hidden">
                            <VehicleSearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
                        </div>

                        {/* Global Login Sidebar */}
                        <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
                    </div>
                </DiscoveryProvider>
            </ColorProvider>
        </FavoritesProvider>
    );
}
