'use client';

/**
 * PdpLocationGate — Full-page render block for PDP.
 *
 * Policy (locked 2026-03-20):
 * - If user has NO resolved location (pincode or GPS) → renders full-screen capture UI.
 * - Children (full PDP) are NOT rendered until location is confirmed.
 * - Non-dismissable. No skip. No close button.
 * - On resolve: writes localStorage + cookie + member profile + fires locationChanged.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Navigation, ArrowRight, CheckCircle2 } from 'lucide-react';
import { resolveLocation } from '@/utils/locationResolver';
import { setLocationCookie } from '@/actions/locationCookie';
import { updateSelfMemberLocation } from '@/actions/members';
import { createClient } from '@/lib/supabase/client';

type LocationGatePhase = 'CHECKING' | 'GATE' | 'RESOLVED';

interface PdpLocationGateProps {
    /** Location resolved server-side (from cookie/member profile). If truthy, gate skips. */
    initialLocation?: { pincode?: string; lat?: number; lng?: number } | null;
    children: React.ReactNode;
}

function hasResolvedLocationSignal(value: any): boolean {
    if (!value || typeof value !== 'object') return false;
    const lat = Number(value?.lat ?? value?.latitude);
    const lng = Number(value?.lng ?? value?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return true;
    const pincode = String(value?.pincode || '').trim();
    return /^\d{6}$/.test(pincode);
}

function readCachedLocation(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const cached = localStorage.getItem('bmb_user_pincode');
        if (!cached) return false;
        return hasResolvedLocationSignal(JSON.parse(cached));
    } catch {
        return false;
    }
}

function getCurrentMonthName() {
    return new Date().toLocaleString('en-IN', { month: 'long' });
}

export function PdpLocationGate({ initialLocation, children }: PdpLocationGateProps) {
    const [phase, setPhase] = useState<LocationGatePhase>('CHECKING');
    const [pincode, setPincode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'GPS_LOADING' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    // Determine gate state on mount — server location OR cached localStorage
    useEffect(() => {
        if (hasResolvedLocationSignal(initialLocation) || readCachedLocation()) {
            setPhase('RESOLVED');
        } else {
            setPhase('GATE');
        }

        // Also listen for external location resolution (e.g., from parent StoreLayout)
        const onLocationChanged = () => {
            if (readCachedLocation()) setPhase('RESOLVED');
        };
        window.addEventListener('locationChanged', onLocationChanged);
        window.addEventListener('storage', onLocationChanged);
        return () => {
            window.removeEventListener('locationChanged', onLocationChanged);
            window.removeEventListener('storage', onLocationChanged);
        };
    }, [initialLocation]);

    // Prevent body scroll while gate is showing
    useEffect(() => {
        if (phase === 'GATE') {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [phase]);

    // ── Resolved or Checking ───────────────────────────────────────────────
    if (phase === 'CHECKING') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#F4B000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading…</p>
                </div>
            </div>
        );
    }

    if (phase === 'RESOLVED') {
        return <>{children}</>;
    }

    // ── Full-Screen Location Gate ──────────────────────────────────────────

    const persistAndResolve = async (resolved: {
        pincode: string;
        district?: string | null;
        taluka?: string | null;
        state?: string | null;
        stateCode?: string | null;
        lat?: number | null;
        lng?: number | null;
    }) => {
        const payload = {
            pincode: resolved.pincode,
            district: resolved.district || null,
            taluka: resolved.taluka || null,
            state: resolved.state || null,
            stateCode: resolved.stateCode || null,
            lat: resolved.lat ?? null,
            lng: resolved.lng ?? null,
            manuallySet: true,
        };

        // 1. localStorage
        localStorage.setItem('bmb_user_pincode', JSON.stringify(payload));

        // 2. Cookie (best-effort)
        try {
            await setLocationCookie({
                pincode: payload.pincode,
                taluka: payload.taluka ?? undefined,
                state: payload.state ?? undefined,
                stateCode: payload.stateCode ?? undefined,
                lat: payload.lat,
                lng: payload.lng,
            });
        } catch {
            /* non-fatal */
        }

        // 3. Member profile (best-effort)
        try {
            await updateSelfMemberLocation({
                pincode: payload.pincode,
                district: payload.district || null,
                taluka: payload.taluka || null,
                area: payload.taluka || payload.district || null,
                state: payload.state || null,
                latitude: payload.lat ?? null,
                longitude: payload.lng ?? null,
            });
        } catch {
            /* non-fatal */
        }

        // 4. Broadcast
        window.dispatchEvent(new Event('locationChanged'));
        window.dispatchEvent(new Event('storage'));

        setPhase('RESOLVED');
    };

    const handleManualSubmit = async () => {
        const clean = pincode.trim();
        if (!/^\d{6}$/.test(clean)) {
            setErrorMsg('Valid 6-digit pincode enter karo');
            return;
        }
        setStatus('LOADING');
        setErrorMsg('');
        try {
            const resolved = await resolveLocation(clean);
            if (!resolved) {
                setErrorMsg('Pincode resolve nahi hua. Doosra try karo.');
                setStatus('ERROR');
                return;
            }
            await persistAndResolve({
                pincode: resolved.pincode || clean,
                district: resolved.district,
                taluka: resolved.taluka,
                state: resolved.state,
                stateCode: (resolved as any).stateCode || null,
                lat: resolved.lat,
                lng: resolved.lng,
            });
            setStatus('IDLE');
        } catch {
            setErrorMsg('Something went wrong. Dobara try karo.');
            setStatus('ERROR');
        }
    };

    const handleGps = async () => {
        if (!navigator.geolocation) {
            setErrorMsg('GPS is not available on this device.');
            return;
        }
        setStatus('GPS_LOADING');
        setErrorMsg('');

        navigator.geolocation.getCurrentPosition(
            async position => {
                try {
                    const supabase = createClient();
                    const { data: nearestData } = await supabase.rpc('get_nearest_pincode', {
                        p_lat: position.coords.latitude,
                        p_lon: position.coords.longitude,
                    });
                    if (!nearestData || nearestData.length === 0) {
                        setErrorMsg('Location se pincode resolve nahi hua. Manually enter karo.');
                        setStatus('ERROR');
                        return;
                    }
                    const nearest = nearestData[0] as {
                        pincode: string;
                        district: string;
                        taluka: string;
                        state: string;
                        rto_code: string;
                        distance_km: number;
                    };
                    await persistAndResolve({
                        pincode: nearest.pincode,
                        district: nearest.district,
                        taluka: nearest.taluka,
                        state: nearest.state,
                        stateCode: nearest.rto_code?.substring(0, 2) || null,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setStatus('IDLE');
                } catch {
                    setErrorMsg('GPS se resolve fail. Manually enter karo.');
                    setStatus('ERROR');
                }
            },
            err => {
                setErrorMsg(
                    err.code === 1
                        ? 'GPS permission denied. Enter pincode manually.'
                        : 'GPS timeout. Enter pincode manually.'
                );
                setStatus('ERROR');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
    };

    const isLoading = status === 'LOADING' || status === 'GPS_LOADING';
    const monthName = getCurrentMonthName();

    return (
        // Full-screen replacement — PDP is NOT rendered behind this
        <div className="fixed inset-0 z-[9999] bg-[#0b0d10] flex items-center justify-center p-4 md:p-6">
            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#F4B000]/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100">
                {/* Header */}
                <div className="space-y-5 mb-8">
                    <div className="w-14 h-14 bg-[#F4B000]/10 rounded-3xl flex items-center justify-center">
                        <MapPin className="text-[#F4B000]" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 leading-tight mb-2">
                            Unlock <span className="text-[#F4B000]">{monthName} Offer</span>
                        </h2>
                        <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                            Apne area ka best price dekhne ke liye pincode enter karo.
                        </p>
                    </div>
                </div>

                {/* Benefit pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {['Exact On-Road Price', 'Nearest Dealer', 'EMI Options', 'Exclusive Offer'].map(label => (
                        <span
                            key={label}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600"
                        >
                            <CheckCircle2 size={9} className="text-[#F4B000]" />
                            {label}
                        </span>
                    ))}
                </div>

                {/* Pincode Input */}
                <div className="space-y-3 mb-5">
                    <div className="relative">
                        <input
                            autoFocus
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={pincode}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setPincode(val);
                                if (errorMsg) setErrorMsg('');
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') void handleManualSubmit();
                            }}
                            placeholder="Enter 6-digit pincode"
                            disabled={isLoading}
                            className="w-full h-16 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 text-xl font-black tracking-[0.2em] outline-none focus:border-[#F4B000] transition-all text-slate-900 placeholder:text-slate-300 placeholder:text-base placeholder:font-semibold placeholder:tracking-normal disabled:opacity-50"
                        />
                        {status === 'LOADING' && (
                            <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                <Loader2 className="animate-spin text-[#F4B000]" size={20} />
                            </div>
                        )}
                    </div>
                    {errorMsg && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-1">
                            {errorMsg}
                        </p>
                    )}
                </div>

                {/* Primary CTA */}
                <button
                    type="button"
                    onClick={() => void handleManualSubmit()}
                    disabled={isLoading || pincode.length !== 6}
                    className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.14em] text-[11px] flex items-center justify-center gap-3 transition-all mb-3 ${
                        pincode.length === 6 && !isLoading
                            ? 'bg-[#F4B000] text-black shadow-[0_16px_32px_rgba(244,176,0,0.25)] hover:shadow-[0_20px_40px_rgba(244,176,0,0.35)] hover:-translate-y-0.5'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    {status === 'LOADING' ? (
                        <>
                            <Loader2 size={14} className="animate-spin" /> Resolving…
                        </>
                    ) : (
                        <>
                            Unlock Offer <ArrowRight size={14} />
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* GPS CTA */}
                <button
                    type="button"
                    onClick={() => void handleGps()}
                    disabled={isLoading}
                    className={`w-full h-12 rounded-2xl font-black uppercase tracking-[0.12em] text-[10px] flex items-center justify-center gap-2 border transition-all ${
                        status === 'GPS_LOADING'
                            ? 'border-blue-300 bg-blue-50 text-blue-500'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                    } disabled:opacity-50`}
                >
                    {status === 'GPS_LOADING' ? (
                        <>
                            <Loader2 size={13} className="animate-spin" /> Detecting location…
                        </>
                    ) : (
                        <>
                            <Navigation size={13} /> Use my location
                        </>
                    )}
                </button>

                {/* Footer */}
                <p className="mt-5 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300">
                    Pincode needed to show dealer pricing in your area
                </p>
            </div>
        </div>
    );
}
