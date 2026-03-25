'use client';

/**
 * PincodeGateModal — Mandatory, non-dismissable location gate.
 *
 * Flow (updated):
 * 1. Modal opens → auto-trigger GPS silently
 * 2a. GPS resolves + serviceable → auto-close, proceed
 * 2b. GPS resolves + NOT serviceable → show "We don't serve [State]" + manual pincode
 * 2c. GPS fails / denied → show manual pincode input
 * 3. Manual pincode → resolve → if serviceable → proceed
 *
 * Coverage callout: clearly shows Maharashtra cities we serve.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resolveLocation } from '@/utils/locationResolver';
import { setLocationCookie } from '@/actions/locationCookie';
import { updateSelfMemberLocation } from '@/actions/members';
import { createClient } from '@/lib/supabase/client';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import type { PincodeSourceConfidence } from './PincodeGateChip';
import { calculateDistance, HUB_LOCATION, MAX_SERVICEABLE_DISTANCE_KM } from '@/utils/geoUtils';

interface PincodeGateModalProps {
    isOpen: boolean;
    onResolved: (confidence: PincodeSourceConfidence, pincode: string) => void;
}

// Active covered districts — sourced from id_primary_dealer_districts (is_active = true)
const SERVED_CITIES = ['Pune', 'Mumbai', 'Thane', 'Nashik', 'Palghar', 'Raigad', 'Ratnagiri', 'Ahmednagar'];

type ModalState =
    | 'AUTO_GPS' // silently detecting GPS on mount
    | 'MANUAL' // show manual pincode input (GPS failed/denied or fallback)
    | 'NOT_SERVICEABLE' // GPS resolved but location not serviceable
    | 'LOADING' // manual pincode resolving
    | 'GPS_LOADING'; // GPS resolving after user click

const getCurrentMonthName = () => new Date().toLocaleString('en-IN', { month: 'long' });
const GPS_RESOLVE_TIMEOUT_MS = 12000;

const withTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> => {
    return await Promise.race<T>([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)),
    ]);
};

const normalizeStateCode = (value?: string | null) => {
    const upper = String(value || '')
        .trim()
        .toUpperCase();
    if (!upper) return '';
    if (/^[A-Z]{2}$/.test(upper)) return upper;
    const map: Record<string, string> = {
        MAHARASHTRA: 'MH',
        KARNATAKA: 'KA',
        GUJARAT: 'GJ',
        RAJASTHAN: 'RJ',
        DELHI: 'DL',
        KERALA: 'KL',
        GOA: 'GA',
        PUNJAB: 'PB',
        HARYANA: 'HR',
    };
    return map[upper] || upper.slice(0, 2);
};

export function PincodeGateModal({ isOpen, onResolved }: PincodeGateModalProps) {
    const { trackEvent } = useAnalytics();
    const [pincode, setPincode] = useState('');
    const [modalState, setModalState] = useState<ModalState>('AUTO_GPS');
    const [errorMsg, setErrorMsg] = useState('');
    const [detectedLocation, setDetectedLocation] = useState<string | null>(null); // e.g. "Price Strat, United States"
    const autoGpsFired = useRef(false);

    // Observability
    useEffect(() => {
        if (isOpen) {
            trackEvent('INTENT_SIGNAL', 'pincode_gate_shown', {
                source: 'PincodeGateModal',
                trigger: 'catalog_load',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Watchdog: avoid indefinite spinner on AUTO_GPS when browser/RPC hangs.
    useEffect(() => {
        if (!isOpen || modalState !== 'AUTO_GPS') return;
        const timer = setTimeout(() => {
            setErrorMsg('GPS is taking too long. Enter pincode manually.');
            setModalState('MANUAL');
        }, GPS_RESOLVE_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [isOpen, modalState]);

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    // Reset transient state when modal closes so auto-GPS runs on every re-open.
    useEffect(() => {
        if (isOpen) return;
        autoGpsFired.current = false;
        setModalState('AUTO_GPS');
        setPincode('');
        setErrorMsg('');
        setDetectedLocation(null);
    }, [isOpen]);

    // Auto-trigger GPS silently on open
    useEffect(() => {
        if (!isOpen || autoGpsFired.current) return;
        autoGpsFired.current = true;

        if (!navigator.geolocation) {
            setModalState('MANUAL');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async position => {
                try {
                    const supabase = createClient();
                    const rpcResult = (await withTimeout(
                        Promise.resolve(
                            supabase.rpc('get_nearest_pincode', {
                                p_lat: position.coords.latitude,
                                p_lon: position.coords.longitude,
                            })
                        ),
                        GPS_RESOLVE_TIMEOUT_MS
                    )) as { data: any[] | null };
                    const nearestData = rpcResult.data;

                    if (!nearestData || nearestData.length === 0) {
                        setModalState('MANUAL');
                        return;
                    }

                    const nearest = nearestData[0] as {
                        pincode: string;
                        district: string;
                        taluka: string;
                        state: string;
                        rto_code: string;
                        distance_km: number;
                        is_serviceable?: boolean;
                    };

                    // Coordinates + radius serviceability (200km from service hub, state-locked to MH)
                    const stateCode = normalizeStateCode(nearest.rto_code?.substring(0, 2) || nearest.state);
                    const geoDistance = calculateDistance(
                        position.coords.latitude,
                        position.coords.longitude,
                        HUB_LOCATION.lat,
                        HUB_LOCATION.lng
                    );
                    const distanceKm = Number.isFinite(Number(nearest.distance_km))
                        ? Number(nearest.distance_km)
                        : geoDistance;
                    const isServiceable = stateCode === 'MH' && distanceKm <= MAX_SERVICEABLE_DISTANCE_KM;

                    if (!isServiceable) {
                        // Show "we don't serve your location" with manual override
                        const locationLabel = [nearest.district, nearest.state].filter(Boolean).join(', ');
                        setDetectedLocation(locationLabel || 'your current location');
                        setModalState('NOT_SERVICEABLE');
                        trackEvent('INTENT_SIGNAL', 'gps_not_serviceable', {
                            district: nearest.district,
                            state: nearest.state,
                            source: 'PincodeGateModal',
                        });
                        return;
                    }

                    // Serviceable → auto-resolve and close
                    await persistAndFire(
                        {
                            pincode: nearest.pincode,
                            district: nearest.district,
                            taluka: nearest.taluka,
                            state: nearest.state,
                            stateCode: nearest.rto_code?.substring(0, 2) || null,
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        },
                        'GEO_RESOLVED'
                    );
                    trackEvent('INTENT_SIGNAL', 'gps_resolve_success', {
                        pincode: nearest.pincode,
                        district: nearest.district,
                        source: 'PincodeGateModal_auto',
                    });
                } catch {
                    setModalState('MANUAL');
                }
            },
            () => {
                // GPS denied or failed → show manual input silently
                setModalState('MANUAL');
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const persistAndFire = async (
        resolved: {
            pincode: string;
            district?: string | null;
            taluka?: string | null;
            state?: string | null;
            stateCode?: string | null;
            lat?: number | null;
            lng?: number | null;
        },
        confidence: PincodeSourceConfidence
    ) => {
        const payload = {
            pincode: resolved.pincode,
            district: resolved.district || resolved.taluka || null,
            taluka: resolved.taluka || null,
            state: resolved.state || null,
            stateCode: resolved.stateCode || null,
            lat: resolved.lat ?? null,
            lng: resolved.lng ?? null,
            source_confidence: confidence,
            manuallySet: confidence === 'USER_EXACT',
            source: confidence,
        };

        localStorage.setItem('bmb_user_pincode', JSON.stringify(payload));

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

        window.dispatchEvent(new Event('locationChanged'));
        window.dispatchEvent(new Event('storage'));
        onResolved(confidence, payload.pincode);
    };

    const handleManualSubmit = async () => {
        const clean = pincode.trim();
        if (!/^\d{6}$/.test(clean)) {
            setErrorMsg('Please enter a valid 6-digit pincode');
            return;
        }
        setModalState('LOADING');
        setErrorMsg('');

        try {
            const resolved = await resolveLocation(clean);
            if (!resolved) {
                setErrorMsg('Pincode not found. Please try another.');
                setModalState(detectedLocation ? 'NOT_SERVICEABLE' : 'MANUAL');
                return;
            }

            // Hard serviceability block: only allow Maharashtra
            const stateCode = normalizeStateCode(resolved.state);
            const hasCoords = Number.isFinite(Number(resolved.lat)) && Number.isFinite(Number(resolved.lng));
            const distanceKm = hasCoords
                ? calculateDistance(Number(resolved.lat), Number(resolved.lng), HUB_LOCATION.lat, HUB_LOCATION.lng)
                : null;
            const isServiceable =
                stateCode === 'MH' && (distanceKm == null || distanceKm <= MAX_SERVICEABLE_DISTANCE_KM);

            if (!isServiceable) {
                const locationLabel = [resolved.district, resolved.state].filter(Boolean).join(', ');
                setDetectedLocation(locationLabel || 'this location');
                setErrorMsg('');
                setModalState('NOT_SERVICEABLE');
                trackEvent('INTENT_SIGNAL', 'manual_not_serviceable', {
                    pincode: clean,
                    state: resolved.state,
                    source: 'PincodeGateModal',
                });
                return;
            }

            await persistAndFire(
                {
                    pincode: resolved.pincode || clean,
                    district: resolved.district,
                    taluka: resolved.taluka,
                    state: resolved.state,
                    stateCode: (resolved as any).stateCode || null,
                    lat: resolved.lat,
                    lng: resolved.lng,
                },
                'USER_EXACT'
            );
            trackEvent('INTENT_SIGNAL', 'pincode_resolved', {
                pincode: resolved.pincode || clean,
                source_confidence: 'USER_EXACT',
                district: resolved.district || null,
                source: 'PincodeGateModal',
            });
        } catch {
            setErrorMsg('Something went wrong. Please try again.');
            setModalState(detectedLocation ? 'NOT_SERVICEABLE' : 'MANUAL');
        }
    };

    const handleGpsClick = async () => {
        if (!navigator.geolocation) {
            setErrorMsg('GPS is not available on this device.');
            return;
        }
        setModalState('GPS_LOADING');
        setErrorMsg('');

        navigator.geolocation.getCurrentPosition(
            async position => {
                try {
                    const supabase = createClient();
                    const rpcResult = (await withTimeout(
                        Promise.resolve(
                            supabase.rpc('get_nearest_pincode', {
                                p_lat: position.coords.latitude,
                                p_lon: position.coords.longitude,
                            })
                        ),
                        GPS_RESOLVE_TIMEOUT_MS
                    )) as { data: any[] | null };
                    const nearestData = rpcResult.data;

                    if (!nearestData || nearestData.length === 0) {
                        setErrorMsg('Could not detect location. Enter pincode manually.');
                        setModalState('MANUAL');
                        return;
                    }

                    const nearest = nearestData[0] as {
                        pincode: string;
                        district: string;
                        taluka: string;
                        state: string;
                        rto_code: string;
                        distance_km: number;
                        is_serviceable?: boolean;
                    };

                    const stateCode = normalizeStateCode(nearest.rto_code?.substring(0, 2) || nearest.state);
                    const geoDistance = calculateDistance(
                        position.coords.latitude,
                        position.coords.longitude,
                        HUB_LOCATION.lat,
                        HUB_LOCATION.lng
                    );
                    const distanceKm = Number.isFinite(Number(nearest.distance_km))
                        ? Number(nearest.distance_km)
                        : geoDistance;
                    const isServiceable = stateCode === 'MH' && distanceKm <= MAX_SERVICEABLE_DISTANCE_KM;

                    if (!isServiceable) {
                        const locationLabel = [nearest.district, nearest.state].filter(Boolean).join(', ');
                        setDetectedLocation(locationLabel || 'your current location');
                        setModalState('NOT_SERVICEABLE');
                        return;
                    }

                    await persistAndFire(
                        {
                            pincode: nearest.pincode,
                            district: nearest.district,
                            taluka: nearest.taluka,
                            state: nearest.state,
                            stateCode: nearest.rto_code?.substring(0, 2) || null,
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        },
                        'GEO_RESOLVED'
                    );
                } catch {
                    setErrorMsg('GPS resolve failed. Enter pincode manually.');
                    setModalState('MANUAL');
                }
            },
            err => {
                setErrorMsg(
                    err.code === 1 ? 'GPS permission denied. Enter pincode below.' : 'GPS timeout. Enter pincode below.'
                );
                setModalState('MANUAL');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
    };

    const isLoading = modalState === 'LOADING' || modalState === 'GPS_LOADING';
    const monthName = getCurrentMonthName();

    // ── AUTO GPS STATE ── silently detecting, show spinner
    if (modalState === 'AUTO_GPS') {
        return (
            <div
                className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-6"
                data-testid="pincode-gate-modal"
            >
                <div className="absolute inset-0 bg-[#0b0d10]/95 backdrop-blur-3xl" />
                <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-500 flex flex-col items-center gap-5 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center">
                        <Navigation className="text-blue-500 animate-pulse" size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">
                            Detecting your location
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Getting the best offer for your area…</p>
                    </div>
                    <Loader2 className="animate-spin text-blue-400" size={24} />
                </div>
            </div>
        );
    }

    // ── NOT SERVICEABLE STATE ── GPS resolved but outside coverage
    if (modalState === 'NOT_SERVICEABLE') {
        return (
            <div
                className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-6"
                data-testid="pincode-gate-modal"
            >
                <div className="absolute inset-0 bg-[#0b0d10]/95 backdrop-blur-3xl" />
                <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-200 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                    {/* Not serviceable header */}
                    <div className="space-y-4 mb-7">
                        <div className="w-14 h-14 bg-amber-50 rounded-3xl flex items-center justify-center">
                            <AlertCircle className="text-amber-500" size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-tight mb-2">
                                We don&apos;t serve <span className="text-amber-500">{detectedLocation}</span> yet
                            </h2>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                If you&apos;re looking for a different delivery location, please enter the pincode
                                below.
                            </p>
                        </div>
                    </div>

                    {/* Coverage callout */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
                                Currently serving within {MAX_SERVICEABLE_DISTANCE_KM} km of Mumbai
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {SERVED_CITIES.map(city => (
                                <span
                                    key={city}
                                    className="text-[11px] font-bold bg-white text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5"
                                >
                                    {city}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Manual pincode input */}
                    <div className="space-y-3 mb-4">
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
                                placeholder="Enter delivery pincode"
                                disabled={isLoading}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 text-xl font-black tracking-[0.2em] outline-none focus:border-[#F4B000] transition-all text-slate-900 placeholder:text-slate-300 placeholder:text-sm placeholder:font-semibold placeholder:tracking-normal disabled:opacity-50"
                            />
                        </div>
                        {errorMsg && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-1">
                                {errorMsg}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => void handleManualSubmit()}
                        disabled={isLoading || pincode.length !== 6}
                        className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.14em] text-[11px] flex items-center justify-center gap-3 transition-all ${
                            pincode.length === 6 && !isLoading
                                ? 'bg-[#F4B000] text-black shadow-[0_16px_32px_rgba(244,176,0,0.25)] hover:shadow-[0_20px_40px_rgba(244,176,0,0.35)] hover:-translate-y-0.5'
                                : 'bg-slate-100 text-slate-400'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Checking…
                            </>
                        ) : (
                            <>
                                Check delivery availability
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ── MANUAL / GPS_LOADING STATE ── standard pincode input
    return (
        <div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-6"
            data-testid="pincode-gate-modal"
        >
            <div className="absolute inset-0 bg-[#0b0d10]/95 backdrop-blur-3xl" />

            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-200 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
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
                            Enter your delivery pincode to see {monthName} pricing and best dealer offer in your area.
                        </p>
                    </div>
                </div>

                {/* Coverage badge */}
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-5">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />
                    <span className="text-[11px] font-bold text-emerald-700">
                        Serving within {MAX_SERVICEABLE_DISTANCE_KM} km of Mumbai —{' '}
                        {SERVED_CITIES.slice(0, 4).join(', ')} &amp; more
                    </span>
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
                        {modalState === 'LOADING' && (
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
                            : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {modalState === 'LOADING' ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Resolving…
                        </>
                    ) : (
                        <>
                            Unlock Offer
                            <ArrowRight size={14} />
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
                    onClick={() => void handleGpsClick()}
                    disabled={isLoading}
                    className={`w-full h-12 rounded-2xl font-black uppercase tracking-[0.12em] text-[10px] flex items-center justify-center gap-2 border transition-all ${
                        modalState === 'GPS_LOADING'
                            ? 'border-blue-300 bg-blue-50 text-blue-500'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                    } disabled:opacity-50`}
                >
                    {modalState === 'GPS_LOADING' ? (
                        <>
                            <Loader2 size={13} className="animate-spin" />
                            Detecting location…
                        </>
                    ) : (
                        <>
                            <Navigation size={13} />
                            Use my current location
                        </>
                    )}
                </button>

                <p className="mt-5 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300">
                    Pincode needed to show dealer pricing in your area
                </p>
            </div>
        </div>
    );
}
