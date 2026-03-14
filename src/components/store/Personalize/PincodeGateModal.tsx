'use client';

/**
 * PincodeGateModal — Mandatory, non-dismissable pincode gate for PDP.
 *
 * Policy (locked 2026-03-15):
 * - Auto-opens on PDP load if no cached pincode exists.
 * - NO dismiss/close without resolving pincode (X button and backdrop click are intentionally omitted).
 * - Supports manual 6-digit pincode entry AND GPS via get_nearest_pincode RPC.
 * - On resolve: writes localStorage + cookie + id_members + fires locationChanged.
 * - Analytics events: pincode_gate_shown, pincode_gate_gps_prompt, gps_resolve_success,
 *   gps_resolve_fail, pincode_resolved (same names as PincodeGateChip for unified funnel).
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Navigation, ArrowRight } from 'lucide-react';
import { resolveLocation } from '@/utils/locationResolver';
import { setLocationCookie } from '@/actions/locationCookie';
import { updateSelfMemberLocation } from '@/actions/members';
import { createClient } from '@/lib/supabase/client';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import type { PincodeSourceConfidence } from './PincodeGateChip';

interface PincodeGateModalProps {
    /** Auto-open when true. Controlled by ProductClient (opens when !hasResolvedLocation). */
    isOpen: boolean;
    /** Called on successful pincode resolve with confidence tag. */
    onResolved: (confidence: PincodeSourceConfidence, pincode: string) => void;
}

/**
 * Current month name helper for the offer copy.
 */
const getCurrentMonthName = () => new Date().toLocaleString('en-IN', { month: 'long' });

export function PincodeGateModal({ isOpen, onResolved }: PincodeGateModalProps) {
    const { trackEvent } = useAnalytics();
    const [pincode, setPincode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'GPS_LOADING' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    // Observability: fire gate_shown once modal opens
    useEffect(() => {
        if (isOpen) {
            trackEvent('INTENT_SIGNAL', 'pincode_gate_shown', {
                source: 'PincodeGateModal',
                trigger: 'pdp_load',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Prevent body scroll while modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
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
            district: resolved.district || null,
            taluka: resolved.taluka || null,
            state: resolved.state || null,
            stateCode: resolved.stateCode || null,
            lat: resolved.lat ?? null,
            lng: resolved.lng ?? null,
            source_confidence: confidence,
            manuallySet: confidence === 'USER_EXACT',
            source: confidence,
        };

        // 1. LocalStorage (sync, always first)
        localStorage.setItem('bkmb_user_pincode', JSON.stringify(payload));

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

        // 3. Profile update (best-effort, anonymous-safe)
        try {
            await updateSelfMemberLocation({
                pincode: payload.pincode,
                district: payload.district || null,
                taluka: payload.taluka || null,
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

        // 5. Notify parent → closes modal + unlocks PDP
        onResolved(confidence, payload.pincode);
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
            setStatus('IDLE');
        } catch {
            setErrorMsg('Something went wrong. Dobara try karo.');
            setStatus('ERROR');
        }
    };

    const handleGpsResolve = async () => {
        if (!navigator.geolocation) {
            setErrorMsg('GPS is not available on this device.');
            return;
        }
        setStatus('GPS_LOADING');
        setErrorMsg('');
        trackEvent('INTENT_SIGNAL', 'pincode_gate_gps_prompt', {
            source: 'PincodeGateModal',
        });

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
                        source_confidence: 'GEO_RESOLVED',
                        distance_km: nearest.distance_km,
                        district: nearest.district || null,
                        source: 'PincodeGateModal',
                    });
                    trackEvent('INTENT_SIGNAL', 'pincode_resolved', {
                        pincode: nearest.pincode,
                        source_confidence: 'GEO_RESOLVED',
                        district: nearest.district || null,
                        source: 'PincodeGateModal',
                    });
                    setStatus('IDLE');
                } catch {
                    trackEvent('INTENT_SIGNAL', 'gps_resolve_fail', {
                        reason: 'rpc_error',
                        source: 'PincodeGateModal',
                    });
                    setErrorMsg('GPS se resolve fail. Manually enter karo.');
                    setStatus('ERROR');
                }
            },
            err => {
                trackEvent('INTENT_SIGNAL', 'gps_resolve_fail', {
                    reason: err.code === 1 ? 'permission_denied' : err.code === 3 ? 'gps_timeout' : 'gps_unavailable',
                    error_code: err.code,
                    source: 'PincodeGateModal',
                });
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
        // Intentionally no onClick on backdrop — modal is non-dismissable
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-6">
            {/* Dark backdrop — no click handler (gate enforced) */}
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
                            To get {monthName} Month Current Offer in your area, please provide pincode.
                        </p>
                    </div>
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
                            : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {status === 'LOADING' ? (
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
                    onClick={() => void handleGpsResolve()}
                    disabled={isLoading}
                    className={`w-full h-12 rounded-2xl font-black uppercase tracking-[0.12em] text-[10px] flex items-center justify-center gap-2 border transition-all ${
                        status === 'GPS_LOADING'
                            ? 'border-blue-300 bg-blue-50 text-blue-500'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                    } disabled:opacity-50`}
                >
                    {status === 'GPS_LOADING' ? (
                        <>
                            <Loader2 size={13} className="animate-spin" />
                            Detecting location…
                        </>
                    ) : (
                        <>
                            <Navigation size={13} />
                            Use my location
                        </>
                    )}
                </button>

                {/* Footer note — no skip/close option */}
                <p className="mt-5 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300">
                    Pincode needed to show dealer pricing in your area
                </p>
            </div>
        </div>
    );
}
