import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant } from '@/types/productMaster';
import { IDV_DEPRECIATION_RATE } from '@/lib/constants/pricingConstants';
import { getDeliveryChargeByDistance } from '@/lib/pricing/deliveryCharge';
import { OfferMode, rankCandidates, type CandidateOffer } from '@/lib/marketplace/winnerEngine';
import { calculateDistance } from '@/utils/geoUtils';
import { normalizeLatLng } from '@/lib/location/coordinates';

interface UseDealerContextProps {
    product: any;
    initialAccessories: any[];
    hasTouchedAccessories?: boolean;
    initialLocation?: any;
    selectedColor?: string;
    overrideDealerId?: string | null;
    disabled?: boolean;
    prefetchedPricing?: ServerPricing | null;
    prefetchedLocation?: any;
    offerMode?: OfferMode;
    retrySignal?: number;
    /** Observability callbacks — fired on dealer fetch failure (called from ProductClient via trackEvent) */
    onDealerFetchTimeout?: (payload: { product_id: string; retry_count: number; timeout_ms: number }) => void;
    onDealerFetchError?: (payload: { product_id: string; error: string }) => void;
}

const DEALER_FETCH_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_DEALER_FETCH_TIMEOUT_MS || 8000);
const DEALER_FETCH_MAX_RETRIES = Number(process.env.NEXT_PUBLIC_DEALER_FETCH_MAX_RETRIES || 2);
const DEALER_FETCH_RETRY_BASE_DELAY_MS = Number(process.env.NEXT_PUBLIC_DEALER_FETCH_RETRY_DELAY_MS || 350);

class DealerFetchTimeoutError extends Error {
    code = 'DEALER_FETCH_TIMEOUT';
    constructor() {
        super('DEALER_FETCH_TIMEOUT');
        this.name = 'DealerFetchTimeoutError';
    }
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new DealerFetchTimeoutError()), ms);
    });
    return Promise.race([promise, timeout]).finally(() => {
        if (timer) clearTimeout(timer);
    });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isTransientDealerFetchError = (err: unknown): boolean => {
    const code = String((err as any)?.code || '').toUpperCase();
    const msg = String((err as any)?.message || '').toUpperCase();
    return (
        code === 'DEALER_FETCH_TIMEOUT' ||
        msg.includes('DEALER_FETCH_TIMEOUT') ||
        msg.includes('FETCH FAILED') ||
        msg.includes('CONNECT TIMEOUT') ||
        msg.includes('NETWORK')
    );
};

const fetchMarketBestOffersWithRetry = async (
    supabase: any,
    params: { p_user_lat: number; p_user_lng: number; p_state_code: string; p_radius_km: number }
): Promise<any[]> => {
    let lastErr: unknown = null;

    for (let attempt = 0; attempt <= DEALER_FETCH_MAX_RETRIES; attempt += 1) {
        try {
            const { data, error } = (await withTimeout(
                supabase.rpc('get_market_best_offers', params),
                DEALER_FETCH_TIMEOUT_MS
            )) as { data: any[] | null; error: any };

            if (error) throw error;
            return Array.isArray(data) ? data : [];
        } catch (err) {
            lastErr = err;
            if (attempt === DEALER_FETCH_MAX_RETRIES || !isTransientDealerFetchError(err)) {
                throw err;
            }
            const backoffMs = DEALER_FETCH_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            await sleep(backoffMs);
        }
    }

    if (lastErr) throw lastErr;
    return [];
};

const fetchFallbackOffersFromTables = async (input: {
    supabase: any;
    skuIds: string[];
    stateCode: string;
    userLat: number;
    userLng: number;
    radiusKm: number;
}): Promise<any[]> => {
    const { supabase, skuIds, stateCode, userLat, userLng, radiusKm } = input;
    if (!skuIds.length) return [];

    const { data: rules, error: rulesError } = await supabase
        .from('cat_price_dealer')
        .select('tenant_id, vehicle_color_id, offer_amount, tat_days, tat_effective_hours')
        .in('vehicle_color_id', skuIds)
        .eq('state_code', stateCode)
        .eq('is_active', true);

    if (rulesError || !rules?.length) return [];

    const dealerIds = Array.from(new Set(rules.map((r: any) => String(r.tenant_id || '')).filter(Boolean)));
    if (!dealerIds.length) return [];

    const [{ data: locations }, { data: dealers }] = await Promise.all([
        supabase.from('id_locations').select('tenant_id, lat, lng').in('tenant_id', dealerIds).eq('is_active', true),
        supabase.from('id_tenants').select('id, name, studio_id, location').in('id', dealerIds),
    ]);

    const locByDealer = new Map<string, { lat: number; lng: number }>();
    (locations || []).forEach((row: any) => {
        const lat = Number(row?.lat);
        const lng = Number(row?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        locByDealer.set(String(row.tenant_id), { lat, lng });
    });

    const dealerMeta = new Map<string, any>();
    (dealers || []).forEach((d: any) => dealerMeta.set(String(d.id), d));

    const offers: any[] = [];
    for (const r of rules || []) {
        const dealerId = String((r as any)?.tenant_id || '');
        if (!dealerId) continue;
        const loc = locByDealer.get(dealerId);
        if (!loc) continue;
        const distanceKm = calculateDistance(userLat, userLng, loc.lat, loc.lng);
        if (!Number.isFinite(distanceKm) || distanceKm > radiusKm) continue;

        const dealer = dealerMeta.get(dealerId);
        offers.push({
            vehicle_color_id: (r as any).vehicle_color_id,
            dealer_id: dealerId,
            dealer_name: dealer?.name || 'Dealer',
            studio_id: dealer?.studio_id || null,
            district: dealer?.location || null,
            is_serviceable: true,
            offer_amount: Number((r as any).offer_amount || 0),
            best_offer: Number((r as any).offer_amount || 0),
            bundle_ids: [],
            bundle_value: 0,
            bundle_price: 0,
            tat_effective_hours: (r as any).tat_effective_hours ?? null,
            delivery_tat_days: (r as any).tat_days ?? null,
            distance_km: distanceKm,
            delivery_charge: getDeliveryChargeByDistance(distanceKm),
        });
    }

    return offers;
};

const DEFAULT_PRICING_DEALER_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_PRICING_DEALER_TENANT_ID || '';

const CLIENT_STATE_MAP: Record<string, string> = {
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

const normalizeClientStateCode = (value?: string | null) => {
    if (!value) return 'MH';
    const key = String(value).toUpperCase().trim();
    const normalizedKey = key.replace(/[\s-]+/g, '_');
    if (CLIENT_STATE_MAP[key]) return CLIENT_STATE_MAP[key];
    if (CLIENT_STATE_MAP[normalizedKey]) return CLIENT_STATE_MAP[normalizedKey];
    if (/^[A-Z]{2}$/.test(key)) return key;
    return 'MH';
};

const readLatLng = (value: any): { lat: number | null; lng: number | null } => {
    return normalizeLatLng(value);
};

type RankedOffer = {
    vehicle_color_id?: string | null;
    dealer_id: string;
    dealer_name: string;
    studio_id?: string | null;
    best_offer: number;
    bundle_ids?: string[];
    distance_km?: number | null;
    delivery_charge?: number;
    delivery_tat_days?: number | null;
    updated_at?: string | null;
};

type OtherOffer = {
    dealer_id: string;
    dealer_name: string;
    studio_id?: string | null;
    best_offer: number;
    distance_km?: number | null;
    delivery_tat_days?: number | null;
    delivery_charge: number;
};

const rankOffers = (offers: RankedOffer[]) => {
    return [...offers].sort((a, b) => Number(a.best_offer || 0) - Number(b.best_offer || 0));
};

// SSPP v2: Server-side calculated pricing structure (SOT JSON)
interface ServerPricing {
    success: boolean;
    ex_showroom: number;
    rto: {
        STATE: any;
        BH: any;
        COMPANY: any;
        default: string;
    };
    insurance: {
        od: number;
        tp: number;
        gst_rate: number;
        base_total: number;
        addons: { id: string; label: string; price: number; gst: number; total: number; default: boolean }[];
    };
    dealer: {
        offer: number;
        name: string | null;
        id: string | null;
        studio_id?: string | null;
        distance_km?: number | null;
        is_serviceable: boolean;
        tat_effective_hours?: number | null;
        delivery_tat_days?: number | null;
    };
    final_on_road: number;
    location: {
        district: string | null;
        state_code: string;
    };
    meta: {
        vehicle_color_id: string;
        engine_cc: number;
        idv: number;
        calculated_at: string;
    };
    // Legacy fallback (deprecated)
    rto_breakdown?: { label: string; amount: number }[];
    insurance_breakdown?: { label: string; amount: number }[];
    error?: string;
    message?: string;
}

export function useSystemDealerContext({
    product,
    initialAccessories = [],
    hasTouchedAccessories = false,
    initialLocation,
    selectedColor,
    overrideDealerId,
    disabled = false,
    prefetchedPricing,
    prefetchedLocation,
    offerMode,
    retrySignal = 0,
    onDealerFetchTimeout,
    onDealerFetchError,
}: UseDealerContextProps) {
    // These states hold the "Hydrated" versions of data implies Dealer-specific overrides
    const [dealerColors, setDealerColors] = useState<any[]>(product.colors || []);
    const [dealerAccessories, setDealerAccessories] = useState<any[]>(initialAccessories);

    // The "Best Offer" object to be passed to UI (ProductCard)
    const [bestOffer, setBestOffer] = useState<
        | {
              price: number;
              dealer: string;
              dealerId?: string;
              isServiceable: boolean;
              dealerLocation?: string;
              studio_id?: string;
              distance_km?: number | null;
              bundleValue?: number;
              bundlePrice?: number;
              delivery_tat_days?: number | null;
              tat_effective_hours?: number | null;
          }
        | undefined
    >(() => {
        if (!prefetchedPricing?.dealer) return undefined;
        return {
            price: Number(prefetchedPricing.dealer.offer || 0),
            dealer: prefetchedPricing.dealer.name || 'Studio',
            dealerId: prefetchedPricing.dealer.id || undefined,
            isServiceable: true,
            dealerLocation: prefetchedPricing.location?.district || prefetchedLocation?.district || undefined,
            studio_id: prefetchedPricing.dealer?.studio_id || undefined,
            distance_km: Number.isFinite(Number((prefetchedPricing.dealer as any)?.distance_km))
                ? Number((prefetchedPricing.dealer as any)?.distance_km)
                : null,
            bundleValue: 0,
            bundlePrice: 0,
            delivery_tat_days: Number.isFinite(Number((prefetchedPricing.dealer as any)?.delivery_tat_days))
                ? Number((prefetchedPricing.dealer as any)?.delivery_tat_days)
                : null,
            tat_effective_hours: Number.isFinite(Number((prefetchedPricing.dealer as any)?.tat_effective_hours))
                ? Number((prefetchedPricing.dealer as any)?.tat_effective_hours)
                : null,
        };
    });

    const [resolvedLocation, setResolvedLocation] = useState<any>(prefetchedLocation || initialLocation);
    const [otherOffers, setOtherOffers] = useState<OtherOffer[]>([]);
    const [mode, setMode] = useState<OfferMode>(offerMode || 'BEST_OFFER');

    // SSPP v1: Server-Side Calculated Pricing (Single Source of Truth!)
    const [serverPricing, setServerPricing] = useState<ServerPricing | null>(prefetchedPricing || null);
    const [dealerFetchState, setDealerFetchState] = useState<'IDLE' | 'GATED' | 'READY' | 'TIMEOUT' | 'ERROR'>('IDLE');
    const [dealerFetchNotice, setDealerFetchNotice] = useState<string | null>(null);

    const [isHydrating, setIsHydrating] = useState(!disabled);

    useEffect(() => {
        if (offerMode && offerMode !== mode) {
            setMode(offerMode);
        }
    }, [offerMode]);

    useEffect(() => {
        const hydrate = async () => {
            if (typeof window === 'undefined') {
                setIsHydrating(false);
                return;
            }

            try {
                const supabase = createClient();
                setDealerFetchState('READY');
                setDealerFetchNotice(null);
                // 1. Resolve Location (Prop > LocalStorage)
                let district = initialLocation?.district || initialLocation?.city;
                let stateCode = initialLocation?.stateCode;
                let pincode = initialLocation?.pincode;
                // Prefer coords from initialLocation (from cookie/SSR) — already resolved from GPS or profile
                const initialCoords = readLatLng(initialLocation);
                let userLat: number | null = initialCoords.lat;
                let userLng: number | null = initialCoords.lng;

                if (!district || !Number.isFinite(userLat) || !Number.isFinite(userLng)) {
                    const cached = localStorage.getItem('bkmb_user_pincode');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        district = district || parsed?.district || parsed?.taluka || parsed?.city;
                        stateCode = stateCode || parsed?.stateCode;
                        pincode = pincode || parsed?.pincode;
                        // Read cached coords regardless of key naming (`lat/lng` OR `latitude/longitude`).
                        const cachedCoords = readLatLng(parsed);
                        userLat = cachedCoords.lat ?? userLat;
                        userLng = cachedCoords.lng ?? userLng;
                        // Fallback for State Code if missing in cache but state name exists
                        if (!stateCode && parsed?.state) {
                            stateCode = normalizeClientStateCode(parsed.state);
                        }
                    }
                }

                // Normalize coords from pincode centroid for deterministic cross-device winner resolution.
                // Same pincode => same lat/lng baseline, regardless of device GPS precision.
                if (pincode) {
                    const pin = String(pincode).trim();
                    if (/^\d{6}$/.test(pin)) {
                        const { data: pinRow } = await supabase
                            .from('loc_pincodes')
                            .select('latitude, longitude, district, state_code')
                            .eq('pincode', pin)
                            .maybeSingle();
                        const pinLat = Number((pinRow as any)?.latitude);
                        const pinLng = Number((pinRow as any)?.longitude);
                        if (Number.isFinite(pinLat) && Number.isFinite(pinLng)) {
                            userLat = pinLat;
                            userLng = pinLng;
                            district = (pinRow as any).district || district;
                            stateCode = (pinRow as any).state_code || stateCode;
                        }
                    }
                }

                // Gate: need lat/lng to proceed
                if (disabled || !Number.isFinite(userLat) || !Number.isFinite(userLng)) {
                    if (!overrideDealerId) {
                        setDealerFetchState('GATED');
                        // Note: We don't return here anymore, because we still need to resolve base pricing for the SKU
                    }
                }

                // Update Resolved Location for UI
                if (district) {
                    setResolvedLocation({
                        district,
                        stateCode,
                        pincode,
                    });
                }

                // 2. SSPP v1: Call Server-Side Pricing RPC (Single Source of Truth!)
                // selectedColor might be color NAME (e.g. 'pearl-igneous-black') or color ID
                // We need the actual skuId (UUID) from product.colors array
                let activeSku: string | undefined;
                let currentBasePricing: any = serverPricing; // Use local variable to avoid stale state issues in this effect

                if (selectedColor) {
                    // Try to find the color by id or name and get its skuId
                    const matchedColor = product.colors?.find(
                        (c: any) => c.id === selectedColor || c.name === selectedColor || c.skuId === selectedColor
                    );
                    activeSku = matchedColor?.skuId || product.colors?.[0]?.skuId;
                } else {
                    activeSku = product.colors?.[0]?.skuId;
                }

                const applyPricing = (pricingData: any) => {
                    setServerPricing(pricingData as ServerPricing);
                    setOtherOffers([]);

                    const dealerOffer = Number(pricingData?.dealer?.offer || 0);
                    const dealerTatDays = Number.isFinite(Number(pricingData?.dealer?.delivery_tat_days))
                        ? Number(pricingData.dealer.delivery_tat_days)
                        : null;
                    setBestOffer({
                        price: dealerOffer,
                        dealer: pricingData.dealer?.name || 'Studio',
                        dealerId: pricingData.dealer?.id || undefined,
                        isServiceable: pricingData.dealer?.is_serviceable ?? true,
                        dealerLocation: pricingData.location?.district || undefined,
                        studio_id: pricingData.dealer?.studio_id || undefined,
                        bundleValue: 0,
                        bundlePrice: 0,
                        tat_effective_hours: null,
                        delivery_tat_days: dealerTatDays,
                    });

                    // Sync all colors if pricing data provides it, otherwise just the active one
                    setDealerColors(prev =>
                        prev.map((c: any) => {
                            if (c.skuId === activeSku) {
                                return {
                                    ...c,
                                    pricingOverride: {
                                        ...c.pricingOverride,
                                        exShowroom: pricingData.ex_showroom,
                                    },
                                    dealerOffer: pricingData.dealer?.offer || 0,
                                };
                            }
                            return c;
                        })
                    );
                };

                if (activeSku) {
                    // SOT: Skip base pricing re-fetch if server already provided it
                    // (prefetchedPricing is authoritative — client only resolves dealer delta)
                    const prefetchCoversActiveSku =
                        prefetchedPricing &&
                        Number(prefetchedPricing.ex_showroom) > 0 &&
                        String(prefetchedPricing.meta?.vehicle_color_id || '') === String(activeSku);

                    if (!prefetchCoversActiveSku) {
                        const activeStateCode = normalizeClientStateCode(stateCode);
                        let { data: priceRow } = await supabase
                            .from('cat_price_state_mh')
                            .select(
                                `
                            sku_id,
                            ex_showroom,
                            on_road_price,
                            rto_default_type,
                            rto_total_state,
                            rto_registration_fee_state,
                            rto_smartcard_charges_state,
                            rto_postal_charges_state,
                            rto_roadtax_amount_state,
                            rto_roadtax_cess_amount_state,
                            rto_total_bh,
                            rto_registration_fee_bh,
                            rto_smartcard_charges_bh,
                            rto_postal_charges_bh,
                            rto_roadtax_amount_bh,
                            rto_roadtax_cess_amount_bh,
                            rto_total_company,
                            rto_registration_fee_company,
                            rto_smartcard_charges_company,
                            rto_postal_charges_company,
                            rto_roadtax_amount_company,
                            rto_roadtax_cess_amount_company,
                            ins_gst_rate,
                            ins_sum_mandatory_insurance,
                            ins_sum_mandatory_insurance_gst_amount,
                            ins_gross_premium,
                            ins_own_damage_premium_amount,
                            ins_liability_only_premium_amount,
                            addon_zero_depreciation_amount,
                            addon_zero_depreciation_gst_amount,
                            addon_zero_depreciation_total_amount,
                            addon_zero_depreciation_default,
                            addon_engine_protector_amount,
                            addon_engine_protector_gst_amount,
                            addon_engine_protector_total_amount,
                            addon_engine_protector_default,
                            addon_return_to_invoice_amount,
                            addon_return_to_invoice_gst_amount,
                            addon_return_to_invoice_total_amount,
                            addon_return_to_invoice_default,
                            addon_consumables_cover_amount,
                            addon_consumables_cover_gst_amount,
                            addon_consumables_cover_total_amount,
                            addon_consumables_cover_default,
                            addon_roadside_assistance_amount,
                            addon_roadside_assistance_gst_amount,
                            addon_roadside_assistance_total_amount,
                            addon_roadside_assistance_default,
                            addon_personal_accident_cover_amount,
                            addon_personal_accident_cover_gst_amount,
                            addon_personal_accident_cover_total_amount,
                            addon_personal_accident_cover_default
                            `
                            )
                            .eq('sku_id', activeSku)
                            .eq('state_code', activeStateCode)
                            .eq('publish_stage', 'PUBLISHED')
                            .maybeSingle();

                        if (!priceRow && activeStateCode !== 'MH') {
                            const { data: fallbackPriceRow } = await supabase
                                .from('cat_price_state_mh')
                                .select(
                                    `
                            sku_id,
                            ex_showroom,
                            on_road_price,
                            rto_default_type,
                            rto_total_state,
                            rto_registration_fee_state,
                            rto_smartcard_charges_state,
                            rto_postal_charges_state,
                            rto_roadtax_amount_state,
                            rto_roadtax_cess_amount_state,
                            rto_total_bh,
                            rto_registration_fee_bh,
                            rto_smartcard_charges_bh,
                            rto_postal_charges_bh,
                            rto_roadtax_amount_bh,
                            rto_roadtax_cess_amount_bh,
                            rto_total_company,
                            rto_registration_fee_company,
                            rto_smartcard_charges_company,
                            rto_postal_charges_company,
                            rto_roadtax_amount_company,
                            rto_roadtax_cess_amount_company,
                            ins_gst_rate,
                            ins_sum_mandatory_insurance,
                            ins_sum_mandatory_insurance_gst_amount,
                            ins_gross_premium,
                            ins_own_damage_premium_amount,
                            ins_liability_only_premium_amount,
                            addon_zero_depreciation_amount,
                            addon_zero_depreciation_gst_amount,
                            addon_zero_depreciation_total_amount,
                            addon_zero_depreciation_default,
                            addon_engine_protector_amount,
                            addon_engine_protector_gst_amount,
                            addon_engine_protector_total_amount,
                            addon_engine_protector_default,
                            addon_return_to_invoice_amount,
                            addon_return_to_invoice_gst_amount,
                            addon_return_to_invoice_total_amount,
                            addon_return_to_invoice_default,
                            addon_consumables_cover_amount,
                            addon_consumables_cover_gst_amount,
                            addon_consumables_cover_total_amount,
                            addon_consumables_cover_default,
                            addon_roadside_assistance_amount,
                            addon_roadside_assistance_gst_amount,
                            addon_roadside_assistance_total_amount,
                            addon_roadside_assistance_default,
                            addon_personal_accident_cover_amount,
                            addon_personal_accident_cover_gst_amount,
                            addon_personal_accident_cover_total_amount,
                            addon_personal_accident_cover_default
                            `
                                )
                                .eq('sku_id', activeSku)
                                .eq('state_code', 'MH')
                                .eq('publish_stage', 'PUBLISHED')
                                .maybeSingle();
                            priceRow = fallbackPriceRow;
                        }

                        if (priceRow && Number(priceRow.rto_total_state) > 0) {
                            const pricingSnap = {
                                success: true,
                                ex_showroom: Number(priceRow.ex_showroom),
                                rto: {
                                    STATE: {
                                        total: Number((priceRow as any).rto_total_state || 0),
                                        roadTax: Number((priceRow as any).rto_roadtax_amount_state || 0),
                                        registrationFee: Number((priceRow as any).rto_registration_fee_state || 0),
                                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_state || 0),
                                        postalCharges: Number((priceRow as any).rto_postal_charges_state || 0),
                                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_state || 0),
                                    },
                                    BH: {
                                        total: Number((priceRow as any).rto_total_bh || 0),
                                        roadTax: Number((priceRow as any).rto_roadtax_amount_bh || 0),
                                        registrationFee: Number((priceRow as any).rto_registration_fee_bh || 0),
                                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_bh || 0),
                                        postalCharges: Number((priceRow as any).rto_postal_charges_bh || 0),
                                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_bh || 0),
                                    },
                                    COMPANY: {
                                        total: Number((priceRow as any).rto_total_company || 0),
                                        roadTax: Number((priceRow as any).rto_roadtax_amount_company || 0),
                                        registrationFee: Number((priceRow as any).rto_registration_fee_company || 0),
                                        smartCardCharges: Number((priceRow as any).rto_smartcard_charges_company || 0),
                                        postalCharges: Number((priceRow as any).rto_postal_charges_company || 0),
                                        cessAmount: Number((priceRow as any).rto_roadtax_cess_amount_company || 0),
                                    },
                                    default: priceRow.rto_default_type || 'STATE',
                                },
                                insurance: {
                                    od: Number(priceRow.ins_own_damage_premium_amount || 0),
                                    tp: Number(priceRow.ins_liability_only_premium_amount || 0),
                                    gst_rate: Number(priceRow.ins_gst_rate || 18),
                                    base_total:
                                        Number(priceRow.ins_sum_mandatory_insurance || 0) +
                                        Number(priceRow.ins_sum_mandatory_insurance_gst_amount || 0),
                                    addons: [
                                        {
                                            id: 'zero_depreciation',
                                            label: 'Zero Depreciation',
                                            price: Number((priceRow as any).addon_zero_depreciation_amount || 0),
                                            gst: Number((priceRow as any).addon_zero_depreciation_gst_amount || 0),
                                            total: Number((priceRow as any).addon_zero_depreciation_total_amount || 0),
                                            default: Boolean((priceRow as any).addon_zero_depreciation_default),
                                        },
                                        {
                                            id: 'engine_protector',
                                            label: 'Engine Protector',
                                            price: Number((priceRow as any).addon_engine_protector_amount || 0),
                                            gst: Number((priceRow as any).addon_engine_protector_gst_amount || 0),
                                            total: Number((priceRow as any).addon_engine_protector_total_amount || 0),
                                            default: Boolean((priceRow as any).addon_engine_protector_default),
                                        },
                                        {
                                            id: 'return_to_invoice',
                                            label: 'Return to Invoice',
                                            price: Number((priceRow as any).addon_return_to_invoice_amount || 0),
                                            gst: Number((priceRow as any).addon_return_to_invoice_gst_amount || 0),
                                            total: Number((priceRow as any).addon_return_to_invoice_total_amount || 0),
                                            default: Boolean((priceRow as any).addon_return_to_invoice_default),
                                        },
                                        {
                                            id: 'consumables_cover',
                                            label: 'Consumables Cover',
                                            price: Number((priceRow as any).addon_consumables_cover_amount || 0),
                                            gst: Number((priceRow as any).addon_consumables_cover_gst_amount || 0),
                                            total: Number((priceRow as any).addon_consumables_cover_total_amount || 0),
                                            default: Boolean((priceRow as any).addon_consumables_cover_default),
                                        },
                                        {
                                            id: 'roadside_assistance',
                                            label: 'Roadside Assistance',
                                            price: Number((priceRow as any).addon_roadside_assistance_amount || 0),
                                            gst: Number((priceRow as any).addon_roadside_assistance_gst_amount || 0),
                                            total: Number(
                                                (priceRow as any).addon_roadside_assistance_total_amount || 0
                                            ),
                                            default: Boolean((priceRow as any).addon_roadside_assistance_default),
                                        },
                                        {
                                            id: 'personal_accident_cover',
                                            label: 'Personal Accident Cover',
                                            price: Number((priceRow as any).addon_personal_accident_cover_amount || 0),
                                            gst: Number(
                                                (priceRow as any).addon_personal_accident_cover_gst_amount || 0
                                            ),
                                            total: Number(
                                                (priceRow as any).addon_personal_accident_cover_total_amount || 0
                                            ),
                                            default: Boolean((priceRow as any).addon_personal_accident_cover_default),
                                        },
                                    ].filter(a => a.total > 0),
                                },
                                dealer: {
                                    offer: 0,
                                    name: null,
                                    id: null,
                                    studio_id: null,
                                    is_serviceable: true,
                                },
                                final_on_road: Number(priceRow.on_road_price || priceRow.ex_showroom || 0),
                                location: {
                                    district: district || 'ALL',
                                    state_code: activeStateCode,
                                },
                                meta: {
                                    vehicle_color_id: activeSku,
                                    engine_cc: (product.specs as any)?.engine_cc || 110,
                                    idv: Math.round(Number(priceRow.ex_showroom || 0) * IDV_DEPRECIATION_RATE),
                                    calculated_at: new Date().toISOString(),
                                },
                                rto_breakdown: [],
                                insurance_breakdown: [],
                            };
                            applyPricing(pricingSnap);
                            currentBasePricing = pricingSnap; // Update local tracker for later steps
                        }
                    } else {
                        currentBasePricing = prefetchedPricing;
                    }
                } // end: if (!prefetchCoversActiveSku)

                // 3. Resolve Market Best Offers OR Specific Dealer Offers
                // If gated and no override, skip dealer resolution but we still resolved base pricing!
                if (dealerFetchState === 'GATED' && !overrideDealerId) {
                    setBestOffer(undefined);
                    setOtherOffers([]);
                    setIsHydrating(false);
                    return;
                }
                const useCandidateRpc = process.env.NEXT_PUBLIC_USE_CANDIDATE_RPC === 'true';
                let relevantOffers: any[] = [];

                if (overrideDealerId) {
                    // DIRECT DEALER RESOLUTION (Quote Context)
                    // Skip market RPC, fetch rules specifically for this dealer
                    // We need to construct 'offer' objects compatible with the logic below
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    const skuIds = (product.colors || [])
                        .map((c: any) => c.skuId)
                        .filter((id: string) => id && uuidRegex.test(id));

                    // Always fetch dealer info for consistent context
                    const { data: dealerInfo } = await supabase
                        .from('id_tenants')
                        .select('id, name, studio_id')
                        .eq('id', overrideDealerId)
                        .single();
                    const { data: dealerLoc } = await supabase
                        .from('id_locations')
                        .select('lat, lng')
                        .eq('tenant_id', overrideDealerId)
                        .eq('is_active', true)
                        .limit(1)
                        .maybeSingle();

                    const overrideDistanceKm =
                        Number.isFinite(Number(userLat)) &&
                        Number.isFinite(Number(userLng)) &&
                        Number.isFinite(Number((dealerLoc as any)?.lat)) &&
                        Number.isFinite(Number((dealerLoc as any)?.lng))
                            ? calculateDistance(
                                  Number(userLat),
                                  Number(userLng),
                                  Number((dealerLoc as any).lat),
                                  Number((dealerLoc as any).lng)
                              )
                            : null;

                    if (skuIds.length > 0) {
                        const normalizedStateCode = normalizeClientStateCode(stateCode);
                        const { data: dealerRules } = await supabase
                            .from('cat_price_dealer')
                            .select('vehicle_color_id, offer_amount, tat_days, tat_effective_hours')
                            .in('vehicle_color_id', skuIds)
                            .eq('tenant_id', overrideDealerId)
                            .eq('state_code', normalizedStateCode)
                            .eq('is_active', true);

                        if (dealerRules && dealerRules.length > 0) {
                            relevantOffers = dealerRules.map((r: any) => ({
                                vehicle_color_id: r.vehicle_color_id,
                                dealer_id: overrideDealerId,
                                dealer_name: dealerInfo?.name || 'Assigned Dealer',
                                studio_id: dealerInfo?.studio_id || null,
                                offer_amount: Number(r.offer_amount), // for useCandidateRpc=true
                                best_offer: Number(r.offer_amount), // for useCandidateRpc=false
                                distance_km: overrideDistanceKm,
                                delivery_charge: getDeliveryChargeByDistance(overrideDistanceKm),
                                bundle_ids: [],
                                tat_effective_hours: r.tat_effective_hours ?? null,
                                delivery_tat_days: r.tat_days ?? null,
                            }));
                        } else {
                            // Valid SKUs but no rules -> Dummy offer to lock dealer
                            relevantOffers = [
                                {
                                    vehicle_color_id: skuIds[0],
                                    dealer_id: overrideDealerId,
                                    dealer_name: dealerInfo?.name || 'Assigned Dealer',
                                    studio_id: dealerInfo?.studio_id || null,
                                    best_offer: 0,
                                    distance_km: overrideDistanceKm,
                                    delivery_charge: getDeliveryChargeByDistance(overrideDistanceKm),
                                    bundle_ids: [],
                                },
                            ];
                        }
                    } else {
                        // No valid SKUs (e.g. missing/invalid color mapping) -> keep dealer lock without synthetic SKU.
                        const safeSku = activeSku && uuidRegex.test(activeSku) ? activeSku : null;
                        relevantOffers = [
                            {
                                vehicle_color_id: safeSku,
                                dealer_id: overrideDealerId,
                                dealer_name: dealerInfo?.name || 'Assigned Dealer',
                                studio_id: dealerInfo?.studio_id || null,
                                best_offer: 0,
                                distance_km: overrideDistanceKm,
                                delivery_charge: getDeliveryChargeByDistance(overrideDistanceKm),
                                bundle_ids: [],
                            },
                        ];
                    }
                } else {
                    // MARKET BEST RESOLUTION — lat/lng 200km radius, best offer
                    const activeStateCode2 = normalizeClientStateCode(stateCode);
                    if (userLat && userLng) {
                        let offers: any[] = [];
                        const skuIds = (product.colors || []).map((c: any) => c.skuId).filter(Boolean);
                        try {
                            offers = await fetchMarketBestOffersWithRetry(supabase as any, {
                                p_user_lat: userLat,
                                p_user_lng: userLng,
                                p_state_code: activeStateCode2,
                                p_radius_km: 200,
                            });
                        } catch (rpcErr) {
                            offers = await fetchFallbackOffersFromTables({
                                supabase,
                                skuIds,
                                stateCode: activeStateCode2,
                                userLat,
                                userLng,
                                radiusKm: 200,
                            });
                            if (offers.length > 0) {
                                setDealerFetchNotice('Using fallback dealer pricing.');
                                setDealerFetchState('READY');
                            } else {
                                throw rpcErr;
                            }
                        }

                        if (offers && offers.length > 0) {
                            relevantOffers = offers
                                .filter((o: any) => skuIds.includes(o.vehicle_color_id))
                                .map((o: any) => ({
                                    ...o,
                                    distance_km: Number.isFinite(Number(o?.distance_km)) ? Number(o.distance_km) : null,
                                    delivery_charge: getDeliveryChargeByDistance(
                                        Number.isFinite(Number(o?.distance_km)) ? Number(o.distance_km) : null
                                    ),
                                }));
                        }
                    }
                }

                if (relevantOffers.length === 0) {
                    setIsHydrating(false);
                    return;
                }

                // 5. Filter for Active SKU and Identify Winning Dealer
                const activeSkuOffers = relevantOffers.filter(o => o.vehicle_color_id === activeSku);

                let rankedOffers: any[] = [];
                const bp =
                    Number(currentBasePricing?.ex_showroom || 0) +
                    Number(currentBasePricing?.rto?.STATE || 0) +
                    Number(currentBasePricing?.insurance?.base_total || 0);

                if (useCandidateRpc) {
                    rankedOffers = rankCandidates(
                        activeSkuOffers as CandidateOffer[],
                        mode,
                        bp,
                        getDeliveryChargeByDistance
                    );
                } else {
                    rankedOffers = rankOffers(activeSkuOffers as RankedOffer[]);
                }

                // If no rules for active SKU, but we have rules for others, winner for UI is STILL active SKU (with 0 offer)
                // unless we want to fallback to the absolute best across all SKUs? (User says NO, separate per SKU)
                const winningOffer = rankedOffers[0] || {
                    vehicle_color_id: activeSku,
                    dealer_id: relevantOffers[0].dealer_id,
                    dealer_name: relevantOffers[0].dealer_name,
                    studio_id: relevantOffers[0].studio_id,
                    best_offer: 0,
                    offer_amount: 0,
                    distance_km: relevantOffers[0].distance_km,
                    delivery_tat_days: relevantOffers[0].delivery_tat_days,
                };

                const winningDealerId = winningOffer.dealer_id;
                const winningDealerName = winningOffer.dealer_name;
                const winningOfferAmount = useCandidateRpc
                    ? Number((winningOffer as any).offer_amount ?? (winningOffer as any).best_offer ?? 0)
                    : Number(winningOffer.best_offer || 0);

                const finalPricing: any = {
                    ...currentBasePricing,
                    success: true,
                    dealer: {
                        id: winningDealerId,
                        name: winningDealerName,
                        studio_id: winningOffer.studio_id,
                        distance_km: Number.isFinite(Number((winningOffer as any).distance_km))
                            ? Number((winningOffer as any).distance_km)
                            : null,
                        offer: winningOfferAmount,
                        is_serviceable: true,
                        tat_effective_hours: null,
                        delivery_tat_days: Number.isFinite(Number((winningOffer as any).delivery_tat_days))
                            ? Number((winningOffer as any).delivery_tat_days)
                            : null,
                    },
                    location: {
                        district: district || 'ALL',
                        state_code: stateCode || 'MH',
                    },
                };

                // Add in final_on_road calculation
                finalPricing.final_on_road =
                    (finalPricing.ex_showroom || 0) +
                    (typeof finalPricing.rto?.STATE === 'object'
                        ? Number(finalPricing.rto.STATE.total || 0)
                        : Number(finalPricing.rto?.STATE || 0)) +
                    (finalPricing.insurance?.base_total || 0) +
                    winningOfferAmount;

                setServerPricing(finalPricing);

                setBestOffer({
                    price: winningOfferAmount,
                    dealer: winningDealerName,
                    dealerId: winningDealerId,
                    isServiceable: true,
                    dealerLocation: finalPricing.location?.district || undefined,
                    studio_id: winningOffer.studio_id || undefined,
                    distance_km: Number.isFinite(Number((winningOffer as any).distance_km))
                        ? Number((winningOffer as any).distance_km)
                        : null,
                    bundleValue: 0,
                    bundlePrice: 0,
                    delivery_tat_days: Number.isFinite(Number(winningOffer.delivery_tat_days))
                        ? Number(winningOffer.delivery_tat_days)
                        : null,
                    tat_effective_hours: null,
                });

                // Update ALL color offers at once from the RPC results
                setDealerColors(prev =>
                    prev.map((c: any) => {
                        const bestSkuOffer = relevantOffers.find((o: any) => o.vehicle_color_id === c.skuId);
                        return {
                            ...c,
                            pricingOverride: {
                                ...c.pricingOverride,
                                exShowroom: finalPricing.ex_showroom, // Use current active ex-showroom as fallback
                            },
                            dealerOffer: bestSkuOffer
                                ? Number(bestSkuOffer.offer_amount || bestSkuOffer.best_offer || 0)
                                : 0,
                        };
                    })
                );

                // Deduplicate by dealer_id — RPC returns one row per SKU/color,
                // so same dealer can appear N times (once per color variant).
                // Keep only the best (lowest) offer per unique dealer, exclude winner.
                const seenDealers = new Set<string>([winningDealerId]);
                const dedupedOtherOffers: OtherOffer[] = [];
                for (const offer of rankedOffers.slice(1)) {
                    if (seenDealers.has(offer.dealer_id)) continue;
                    seenDealers.add(offer.dealer_id);
                    dedupedOtherOffers.push({
                        dealer_id: offer.dealer_id,
                        dealer_name: offer.dealer_name,
                        studio_id: offer.studio_id || null,
                        best_offer: useCandidateRpc
                            ? Number((offer as any).offer_amount || 0)
                            : Number(offer.best_offer || 0),
                        distance_km: Number.isFinite(Number(offer.distance_km)) ? Number(offer.distance_km) : null,
                        delivery_tat_days: Number.isFinite(Number(offer.delivery_tat_days))
                            ? Number(offer.delivery_tat_days)
                            : null,
                        delivery_charge: Number(offer.delivery_charge || 0),
                    });
                }
                setOtherOffers(dedupedOtherOffers);

                setDealerColors(prev =>
                    prev.map((c: any) => {
                        // Find the absolute best offer for THIS specific color SKU in the relevantOffers pool
                        const skuOffers = relevantOffers.filter(o => o.vehicle_color_id === c.skuId);
                        if (skuOffers.length === 0) return c;

                        const skuRanked = useCandidateRpc
                            ? rankCandidates(skuOffers as CandidateOffer[], mode, bp, getDeliveryChargeByDistance)
                            : rankOffers(skuOffers as RankedOffer[]);

                        const bestSkuOffer = skuRanked[0];
                        const bestSkuOfferAmount = useCandidateRpc
                            ? Number((bestSkuOffer as any).offer_amount ?? (bestSkuOffer as any).best_offer ?? 0)
                            : Number((bestSkuOffer as any).best_offer || 0);

                        return {
                            ...c,
                            dealerOffer: bestSkuOfferAmount,
                        };
                    })
                );

                // 6. Update Accessories with Dealer Pricing Rules
                if ((initialAccessories || []).length > 0 && winningDealerId) {
                    const accessoryIds = initialAccessories.map((a: any) => a.id);
                    const { data: rules } = await supabase
                        .from('cat_price_dealer')
                        .select('vehicle_color_id, offer_amount, is_active')
                        .in('vehicle_color_id', accessoryIds)
                        .eq('tenant_id', winningDealerId)
                        .eq('state_code', stateCode || 'MH');

                    const ruleMap = new Map<string, any>();
                    rules?.forEach((r: any) => ruleMap.set(r.vehicle_color_id, r));

                    const updatedAccessories = initialAccessories.map((a: any) => {
                        const rule = ruleMap.get(a.id);

                        // If dealer has explicitly disabled this accessory, hide it
                        if (rule && rule.is_active === false) {
                            return null;
                        }

                        const offer = rule ? Number(rule.offer_amount) : 0;
                        const discountPrice = Math.max(0, Number(a.price) + offer);
                        const isInclusive = discountPrice === 0;

                        return {
                            ...a,
                            inclusionType: isInclusive ? 'INCLUSIVE' : 'EXCLUSIVE',
                            isMandatory: isInclusive,
                            discountPrice,
                        };
                    });

                    setDealerAccessories(updatedAccessories.filter(Boolean));
                }
            } catch (err) {
                if (
                    (err as any)?.code === 'DEALER_FETCH_TIMEOUT' ||
                    String((err as any)?.message || '') === 'DEALER_FETCH_TIMEOUT'
                ) {
                    setDealerFetchState('TIMEOUT');
                    setDealerFetchNotice('Dealer price unavailable. Try again.');
                    setOtherOffers([]);
                    setIsHydrating(false);
                    // Observability: fire timeout callback (trackEvent called in ProductClient)
                    onDealerFetchTimeout?.({
                        product_id: product?.id || '',
                        retry_count: retrySignal,
                        timeout_ms: DEALER_FETCH_TIMEOUT_MS,
                    });
                    return;
                }
                setDealerFetchState('ERROR');
                console.error('Failed to hydrate dealer context:', err);
                // Observability: fire error callback
                onDealerFetchError?.({
                    product_id: product?.id || '',
                    error: String((err as any)?.message || 'unknown'),
                });
            } finally {
                setIsHydrating(false);
            }
        };

        hydrate();
    }, [
        product.id,
        initialLocation?.district,
        initialLocation?.stateCode,
        // Include coords so effect re-runs when GPS resolves (rounded to 3dp to avoid float churn)
        initialLocation?.lat != null ? Math.round(Number(initialLocation.lat) * 1000) : null,
        initialLocation?.lng != null ? Math.round(Number(initialLocation.lng) * 1000) : null,
        initialLocation?.latitude != null ? Math.round(Number(initialLocation.latitude) * 1000) : null,
        initialLocation?.longitude != null ? Math.round(Number(initialLocation.longitude) * 1000) : null,
        selectedColor,
        overrideDealerId,
        disabled,
        mode,
        retrySignal,
    ]);

    return {
        dealerColors,
        dealerAccessories,
        bestOffer,
        otherOffers,
        isHydrating,
        resolvedLocation,
        serverPricing, // SSPP v1: Single Source of Truth pricing breakdown
        dealerFetchState,
        dealerFetchNotice,
        offerMode: mode,
        setOfferMode: setMode,
    };
}
