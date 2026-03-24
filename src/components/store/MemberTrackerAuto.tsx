'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MemberTracker } from './MemberTracker';
import { mergeAnonSession, updateMemberLocation, type GeoPayload } from '@/actions/member-tracker';
import { ANON_SESSION_KEY } from '@/lib/constants/storage';
import { GEO_LAST_SAVED_KEY, GEO_SAVE_INTERVAL_MS } from '@/lib/constants/member-fields';
import { REFERRAL_STORAGE_KEY } from '@/lib/constants/referral';
import { emitMemberTrackingEvent } from '@/lib/tracking/emitMemberTrackingEvent';

function getOrCreateAnonSessionId(): string {
    if (typeof window === 'undefined') return crypto.randomUUID();
    let id = localStorage.getItem(ANON_SESSION_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(ANON_SESSION_KEY, id);
    }
    return id;
}

// ── Reverse geocoding via Nominatim (free, no key) ────────────────────────────
async function reverseGeocode(lat: number, lon: number): Promise<Omit<GeoPayload, 'latitude' | 'longitude'>> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        if (!res.ok) return { state: null, district: null, taluka: null, area: null, pincode: null };
        const data = await res.json();
        const a = data?.address ?? {};
        return {
            state: a.state ?? null,
            // India: district is usually under county, state_district, or district
            district: a.county ?? a.state_district ?? a.district ?? null,
            // Taluka / tehsil level
            taluka: a.suburb ?? a.town ?? a.village ?? null,
            // Locality / area — finest-grained label
            area: a.neighbourhood ?? a.quarter ?? a.hamlet ?? a.village ?? a.suburb ?? a.town ?? null,
            pincode: a.postcode ?? null,
        };
    } catch {
        return { state: null, district: null, taluka: null, area: null, pincode: null };
    }
}

function shouldSaveLocation(): boolean {
    const last = localStorage.getItem(GEO_LAST_SAVED_KEY);
    if (!last) return true;
    return Date.now() - new Date(last).getTime() > GEO_SAVE_INTERVAL_MS;
}

async function captureAndSaveLocation(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    if (!shouldSaveLocation()) return;

    navigator.geolocation.getCurrentPosition(
        async pos => {
            const { latitude, longitude } = pos.coords;
            const geoFields = await reverseGeocode(latitude, longitude);
            const result = await updateMemberLocation({ latitude, longitude, ...geoFields });
            if (result.ok) {
                localStorage.setItem(GEO_LAST_SAVED_KEY, new Date().toISOString());
            }
        },
        () => {
            /* Permission denied or unavailable — silent */
        },
        { timeout: 8000, maximumAge: 300_000 }
    );
}

/**
 * Always-on tracker:
 * - Anonymous visitors tracked via anon_session_id from localStorage
 * - On login, merges anon events into the member's record (only rotates key on confirmed success)
 * - On login, captures geolocation if allowed (at most once per 24h)
 */
export function MemberTrackerAuto() {
    const [memberId, setMemberId] = useState<string | null>(null);
    const [anonSessionId, setAnonSessionId] = useState<string>('');
    const mergedRef = useRef(false);

    useEffect(() => {
        // Init anon session ID once on client
        setAnonSessionId(getOrCreateAnonSessionId());

        const supabase = createClient();

        // Seed from existing session (already logged in on mount)
        supabase.auth.getSession().then(({ data }) => {
            const userId = data.session?.user?.id ?? null;
            setMemberId(userId);
            // If already logged in, try location capture
            if (userId) captureAndSaveLocation();
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            const userId = session?.user?.id ?? null;
            setMemberId(userId);

            // On sign-in: merge anon session + capture location
            if (event === 'SIGNED_IN' && userId && !mergedRef.current) {
                mergedRef.current = true;

                // Merge anon events
                const currentAnonId = localStorage.getItem(ANON_SESSION_KEY);
                if (currentAnonId) {
                    mergeAnonSession(currentAnonId).then(result => {
                        if (result.ok) {
                            localStorage.removeItem(ANON_SESSION_KEY);
                            const freshId = crypto.randomUUID();
                            localStorage.setItem(ANON_SESSION_KEY, freshId);
                            setAnonSessionId(freshId);
                        }
                    });
                }

                // Capture geolocation (debounced by GEO_SAVE_INTERVAL_MS)
                captureAndSaveLocation();

                emitMemberTrackingEvent('AUTH_SIGNED_IN', {
                    auth_event: event,
                });
                const referralCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
                if (referralCode) {
                    emitMemberTrackingEvent('REFERRAL_ATTRIBUTED_SIGNUP', {
                        referral_code: referralCode,
                    });
                }
            }

            // On sign-out: reset merge guard & refresh anon ID
            if (event === 'SIGNED_OUT') {
                mergedRef.current = false;
                setAnonSessionId(getOrCreateAnonSessionId());
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (!anonSessionId) return null;

    return <MemberTracker memberId={memberId} anonSessionId={anonSessionId} />;
}
