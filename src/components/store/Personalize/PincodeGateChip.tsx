'use client';

/**
 * PincodeGateChip — Inline pincode unlock gate for PDP/Catalog.
 *
 * Policy (locked 2026-03-15):
 * - Pincode is the gate. Login is NOT required to unlock personalized offer.
 * - GPS enrichment is the fallback when user has no pincode (no prefix/suffix guessing).
 * - Source confidence: USER_EXACT | GEO_RESOLVED
 * - On resolve: writes localStorage + cookie + fires locationChanged event.
 * - Data writes: id_members + loc_pincodes (via syncMemberLocation server action for logged-in users).
 *
 * Observability events (all INTENT_SIGNAL type):
 * - pincode_gate_shown      : chip mounted with no cached pincode (gate is active)
 * - pincode_gate_gps_prompt : user clicked GPS button
 * - gps_resolve_success     : GPS + get_nearest_pincode succeeded
 * - gps_resolve_fail        : GPS or RPC failed
 * - pincode_resolved        : manual/GPS pincode successfully applied
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, Navigation, X, Check, Pencil } from 'lucide-react';
import { resolveLocation } from '@/utils/locationResolver';
import { setLocationCookie } from '@/actions/locationCookie';
import { updateSelfMemberLocation } from '@/actions/members';
import { createClient } from '@/lib/supabase/client';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';

export type PincodeSourceConfidence = 'USER_EXACT' | 'GEO_RESOLVED';

interface PincodeGateChipProps {
    /** Pincode from bkmb_user_pincode localStorage cache */
    cachedPincode?: string;
    /** Called after a successful pincode resolve — triggers locationChanged + dealer re-fetch */
    onResolved: (confidence: PincodeSourceConfidence, pincode: string) => void;
    /** Compact mode: catalog chip vs PDP chip */
    compact?: boolean;
    /** bCoin nudge copy — shown when user has no login (optional) */
    showBCoinNudge?: boolean;
    onLoginNudge?: () => void;
}

const BCOIN_PREVIEW_COUNT = 13;
const BCOIN_VALUE_INR = 1000;

export function PincodeGateChip({
    cachedPincode,
    onResolved,
    compact = false,
    showBCoinNudge = false,
    onLoginNudge,
}: PincodeGateChipProps) {
    const { trackEvent } = useAnalytics();
    const [isEditing, setIsEditing] = useState(!cachedPincode);
    const [pincode, setPincode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'GPS_LOADING' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Observability: fire gate_shown once when chip mounts with no cached pincode (gate is active)
    useEffect(() => {
        if (!cachedPincode) {
            trackEvent('INTENT_SIGNAL', 'pincode_gate_shown', {
                compact,
                source: 'PincodeGateChip',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

        // 2. Cookie (best-effort, server action)
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
            // cookie failure is non-fatal
        }

        // 3. Profile update (best-effort, logged-in users only)
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
            // non-fatal for anonymous users
        }

        // 4. Broadcast to all components listening for location changes
        window.dispatchEvent(new Event('locationChanged'));
        window.dispatchEvent(new Event('storage'));

        // 5. Notify parent
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
                setErrorMsg('Pincode city/area resolve nahi hua. Doosra try karo.');
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
            });
            setIsEditing(false);
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

        // Observability: GPS button clicked
        trackEvent('INTENT_SIGNAL', 'pincode_gate_gps_prompt', {
            source: 'PincodeGateChip',
            compact,
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
                    // Observability: GPS resolve success
                    trackEvent('INTENT_SIGNAL', 'gps_resolve_success', {
                        pincode: nearest.pincode,
                        source_confidence: 'GEO_RESOLVED',
                        distance_km: nearest.distance_km,
                        district: nearest.district || null,
                    });
                    trackEvent('INTENT_SIGNAL', 'pincode_resolved', {
                        pincode: nearest.pincode,
                        source_confidence: 'GEO_RESOLVED',
                        district: nearest.district || null,
                    });
                    setIsEditing(false);
                    setStatus('IDLE');
                } catch {
                    // Observability: GPS resolve failed (RPC error)
                    trackEvent('INTENT_SIGNAL', 'gps_resolve_fail', {
                        reason: 'rpc_error',
                        source: 'PincodeGateChip',
                    });
                    setErrorMsg('GPS se resolve fail. Manually enter karo.');
                    setStatus('ERROR');
                }
            },
            err => {
                console.warn('[PincodeGateChip] GPS error:', err.code);
                // Observability: GPS permission denied or timeout
                trackEvent('INTENT_SIGNAL', 'gps_resolve_fail', {
                    reason: err.code === 1 ? 'permission_denied' : err.code === 3 ? 'gps_timeout' : 'gps_unavailable',
                    error_code: err.code,
                    source: 'PincodeGateChip',
                });
                setErrorMsg('GPS permission denied. Enter pincode manually.');
                setStatus('ERROR');
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        );
    };

    const isLoading = status === 'LOADING' || status === 'GPS_LOADING';

    // ── COMPACT: Has pincode — show pill with [Change] ──
    if (!isEditing && cachedPincode) {
        return (
            <div className={`flex flex-col gap-1.5 ${compact ? '' : 'mb-2'}`}>
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 w-fit">
                    <MapPin size={12} className="text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-800">
                        Offers for PIN {cachedPincode}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setPincode('');
                            setIsEditing(true);
                            setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 hover:text-emerald-900 transition-colors ml-1 border-l border-emerald-200 pl-2"
                    >
                        <Pencil size={10} />
                        Change
                    </button>
                </div>

                {showBCoinNudge && onLoginNudge && (
                    <button
                        type="button"
                        onClick={onLoginNudge}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 w-fit text-[10px] font-black uppercase tracking-[0.12em] text-amber-800 hover:bg-amber-100 transition-colors"
                    >
                        <span>🪙</span>
                        Sign in for {BCOIN_PREVIEW_COUNT} bCoins · ₹{BCOIN_VALUE_INR.toLocaleString('en-IN')} value
                    </button>
                )}
            </div>
        );
    }

    // ── INPUT: No pincode or editing ──
    return (
        <div className={`flex flex-col gap-2 ${compact ? '' : 'mb-2'}`}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin size={12} className="text-brand-primary shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">
                        Enter Pincode → Unlock Offers
                    </span>
                    {cachedPincode && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        autoFocus={!cachedPincode}
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
                        placeholder="400 001"
                        disabled={isLoading}
                        className="flex-1 h-9 bg-white border border-slate-200 rounded-xl px-3 text-sm font-black tracking-[0.18em] text-slate-900 placeholder:text-slate-300 outline-none focus:border-brand-primary transition-all disabled:opacity-50"
                    />

                    <button
                        type="button"
                        onClick={() => void handleManualSubmit()}
                        disabled={isLoading || pincode.length !== 6}
                        className={`h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all flex items-center gap-1.5 shrink-0 ${
                            pincode.length === 6 && !isLoading
                                ? 'bg-brand-primary text-black shadow-[0_4px_12px_rgba(244,176,0,0.25)] hover:shadow-[0_6px_16px_rgba(244,176,0,0.35)] hover:-translate-y-0.5'
                                : 'bg-slate-100 text-slate-400'
                        }`}
                    >
                        {status === 'LOADING' ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : pincode.length === 6 ? (
                            <>
                                <Check size={12} />
                                Unlock
                            </>
                        ) : (
                            'Unlock'
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleGpsResolve()}
                        disabled={isLoading}
                        title="Use my location"
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all border ${
                            status === 'GPS_LOADING'
                                ? 'border-blue-300 bg-blue-50 text-blue-500'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50'
                        }`}
                    >
                        {status === 'GPS_LOADING' ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Navigation size={12} />
                        )}
                    </button>
                </div>

                {errorMsg && (
                    <p className="mt-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-[0.1em]">{errorMsg}</p>
                )}

                {status === 'GPS_LOADING' && (
                    <p className="mt-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-[0.1em]">
                        Location resolve ho raha hai…
                    </p>
                )}
            </div>

            {showBCoinNudge && onLoginNudge && (
                <button
                    type="button"
                    onClick={onLoginNudge}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 w-fit text-[10px] font-black uppercase tracking-[0.12em] text-amber-800 hover:bg-amber-100 transition-colors"
                >
                    <span>🪙</span>
                    Sign in for {BCOIN_PREVIEW_COUNT} bCoins · ₹{BCOIN_VALUE_INR.toLocaleString('en-IN')} value
                </button>
            )}
        </div>
    );
}
