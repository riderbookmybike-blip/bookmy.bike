'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import DetailPanel from '@/components/templates/DetailPanel';
import ContextSidePanel from '@/components/templates/ContextSidePanel';
import { RegistrationRule } from '@/types/registration';
import PricingLedgerTable from '@/components/modules/products/PricingLedgerTable';
import {
    Landmark,
    Filter,
    ShieldCheck,
    FileCheck,
    Layers,
    Car,
    Zap,
    Loader2,
    Save,
    ExternalLink,
    Activity,
    Target,
    ClipboardCheck,
    Package,
    TrendingUp,
    Sparkles,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';
import { KPIItem } from '@/components/layout/KPIBar';
import { calculatePricingBySkuIds } from '@/actions/pricingLedger';
import { savePrices } from '@/actions/savePrices';
import { formatCurrencyCompact } from '@/utils/formatVehicleSpec';
import { getErrorMessage } from '@/lib/utils/errorMessage';

interface SKUPriceRow {
    id: string; // vehicle_color_id
    brand: string;
    brandId?: string;
    model: string;
    modelId?: string;
    variant: string;
    color: string;
    engineCc: number;
    suitableFor?: string;
    exShowroom: number;
    exFactory?: number;
    exFactoryGst?: number;
    offerAmount: number; // New Field (-ve Discount, +ve Surge)
    originalExShowroom?: number;
    originalOfferAmount?: number; // For History Diff
    originalInclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    hsnCode?: string;
    gstRate?: number;
    updatedAt?: string;
    brandLogo?: string;
    stockCount?: number;
    inclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    type?: 'vehicles' | 'accessories' | 'service';
    category: string;
    subCategory: string;
    status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'RELAUNCH'; // Added Status
    originalStatus: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'RELAUNCH'; // For Diff
    localIsActive: boolean; // Dealer Local Status
    originalLocalIsActive: boolean; // For Diff
    rto?: number; // RTO from RPC
    insurance?: number; // Insurance from RPC
    onRoad?: number; // On-Road from RPC
    publishedAt?: string; // Latest publish timestamp
    displayState?: 'Draft' | 'In Review' | 'Published' | 'Live' | 'Inactive';
    publishStage?: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'LIVE' | 'INACTIVE';
    originalPublishStage?: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'LIVE' | 'INACTIVE'; // For diff detection
    insurance_data?: any;
    position?: number;
    variantPosition?: number;
    isPopular?: boolean;
    originalIsPopular?: boolean;
    updatedByName?: string;
}

const DELTA_MIN = -25000;
const DELTA_MAX = 25000;
const clampOfferDelta = (value: number) => {
    const n = Number.isFinite(value) ? Math.trunc(value) : 0;
    return Math.max(DELTA_MIN, Math.min(DELTA_MAX, n));
};

export default function PricingPage() {
    const supabase = createClient();
    const { tenantId, tenantSlug } = useTenant();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [states, setStates] = useState<RegistrationRule[]>([]);
    // Read initial filter values from URL (persist on reload)
    const [selectedStateId, setSelectedStateId] = useState<string>(searchParams.get('state') || '');
    const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get('brand') || 'ALL');
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'VEHICLE');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>(searchParams.get('subCategory') || 'ALL');
    const [selectedModel, setSelectedModel] = useState<string>(searchParams.get('model') || 'ALL');
    const [selectedVariant, setSelectedVariant] = useState<string>(searchParams.get('variant') || 'ALL');
    const [skus, setSkus] = useState<SKUPriceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastEditTime, setLastEditTime] = useState<number | null>(null);
    const [tableSummary, setTableSummary] = useState<{ count: number; value: number }>({ count: 0, value: 0 });
    const [quickFilter, setQuickFilter] = useState<'inventory' | 'market_ready' | 'pipeline' | 'critical' | null>(null);
    const toggleQuickFilter = (value: 'inventory' | 'market_ready' | 'pipeline' | 'critical') => {
        const next = quickFilter === value ? null : value;
        setQuickFilter(next);
        // Critical fix: reset all filters to show ALL zero-price SKUs cleanly
        if (next === 'critical') {
            setSelectedBrand('ALL');
            setSelectedCategory('ALL');
            setSelectedSubCategory('ALL');
            setSelectedModel('ALL');
            setSelectedVariant('ALL');
        }
    };
    const realtimeCalcTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const realtimeCalcSeqRef = useRef<Record<string, number>>({});

    // Sync filters to URL when they change (persist across reloads)
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedStateId) params.set('state', selectedStateId);
        if (selectedBrand !== 'ALL') params.set('brand', selectedBrand);
        else params.delete('brand');
        if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
        else params.delete('category');
        if (selectedSubCategory !== 'ALL') params.set('subCategory', selectedSubCategory);
        else params.delete('subCategory');
        if (selectedModel !== 'ALL') params.set('model', selectedModel);
        else params.delete('model');
        if (selectedVariant !== 'ALL') params.set('variant', selectedVariant);
        else params.delete('variant');
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [selectedStateId, selectedBrand, selectedCategory, selectedSubCategory, selectedModel, selectedVariant]);

    // Initial Load - Fetch Rules
    useEffect(() => {
        fetchRules();
    }, []);

    // Fetch Data when Filters Change
    useEffect(() => {
        if (selectedStateId) {
            fetchSKUsAndPrices();
        }
    }, [selectedStateId]);

    useEffect(() => {
        return () => {
            Object.values(realtimeCalcTimersRef.current).forEach(timer => clearTimeout(timer));
            realtimeCalcTimersRef.current = {};
        };
    }, []);

    // Auto-Save Logic (5 seconds debounce)
    useEffect(() => {
        if (hasUnsavedChanges && lastEditTime) {
            const timer = setTimeout(() => {
                handleSaveAll();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [lastEditTime, hasUnsavedChanges]);

    const fetchRules = async () => {
        const { data, error } = await supabase
            .from('cat_reg_rules')
            .select('*')
            .eq('status', 'ACTIVE')
            .order('state_code');

        if (error) {
            console.error('Fetch Rules Error:', error);
            if (getErrorMessage(error)) console.error('Fetch Rules Message:', getErrorMessage(error));
            return;
        }

        if (data && data.length > 0) {
            const mappedRules = data.map((r: any) => ({
                ...r,
                displayId: r.display_id,
                ruleName: r.rule_name,
                stateCode: r.state_code,
                vehicleType: r.vehicle_type,
            }));
            setStates(mappedRules);
            // Only default to first rule if no state was restored from URL
            if (!selectedStateId) {
                setSelectedStateId(mappedRules[0].id);
            }
        }
    };

    const fetchSKUsAndPrices = async () => {
        setLoading(true);
        try {
            // V2 Catalog Fetch: SKU -> Variant -> Model -> Brand
            const { data: skuData, error: skuError } = await supabase
                .from('cat_skus')
                .select(
                    `
                    id, name, slug, position, status,
                    hex_primary, hex_secondary, color_name, finish,
                    model:cat_models!model_id (
                        id, name, slug, position, status, product_type,
                        brand:cat_brands!brand_id (id, name, logo_svg)
                    ),
                    vehicle_variant:cat_variants_vehicle!vehicle_variant_id (id, name, slug, position, displacement, max_power),
                    accessory_variant:cat_variants_accessory!accessory_variant_id (id, name, slug, position),
                    service_variant:cat_variants_service!service_variant_id (id, name, slug, position)
                `
                )
                .order('position', { ascending: true, nullsFirst: false });

            if (skuError) throw skuError;

            const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode ?? 'MH';

            const [priceRes, offerRes] = await Promise.all([
                // Authoritative SOT for pricing: State specific table
                supabase
                    .from(
                        activeStateCode.toUpperCase() === 'MH'
                            ? 'cat_price_state_mh'
                            : `cat_price_${activeStateCode.toLowerCase()}`
                    )
                    .select(
                        `
                        sku_id, state_code,
                        ex_showroom, ex_showroom_basic:ex_factory, ex_showroom_gst_amount:ex_factory_gst_amount, ex_showroom_total:ex_showroom, gst_rate, hsn_code,
                        on_road_price,
                        rto_default_type,
                        rto_registration_fee_state, rto_registration_fee_bh, rto_registration_fee_company,
                        rto_smartcard_charges_state, rto_smartcard_charges_bh, rto_smartcard_charges_company,
                        rto_postal_charges_state, rto_postal_charges_bh, rto_postal_charges_company,
                        rto_roadtax_rate_state, rto_roadtax_rate_bh, rto_roadtax_rate_company,
                        rto_roadtax_amount_state, rto_roadtax_amount_bh, rto_roadtax_amount_company,
                        rto_roadtaxcess_rate_state:rto_roadtax_cess_rate_state, rto_roadtaxcess_rate_bh:rto_roadtax_cess_rate_bh, rto_roadtaxcess_rate_company:rto_roadtax_cess_rate_company,
                        rto_roadtaxcessamount_state:rto_roadtax_cess_amount_state, rto_roadtaxcessamount_bh:rto_roadtax_cess_amount_bh, rto_roadtaxcessamount_company:rto_roadtax_cess_amount_company,
                        rto_total_state, rto_total_bh, rto_total_company,
                        ins_od_base:ins_own_damage_premium_amount, ins_od_total:ins_own_damage_total_amount, ins_tp_base:ins_liability_only_premium_amount, ins_tp_total:ins_liability_only_total_amount,
                        ins_sum_mandatory_insurance, ins_sum_mandatory_insurance_gst_amount, ins_total:ins_gross_premium, ins_gst_rate,
                        addon_pa_amount:addon_personal_accident_cover_amount, addon_pa_gst:addon_personal_accident_cover_gst_amount, addon_pa_total:addon_personal_accident_cover_total_amount,
                        addon_zerodep_amount:addon_zero_depreciation_amount, addon_zerodep_gst:addon_zero_depreciation_gst_amount, addon_zerodep_total:addon_zero_depreciation_total_amount,
                        addon_rti_amount:addon_return_to_invoice_amount, addon_rti_gst:addon_return_to_invoice_gst_amount, addon_rti_total:addon_return_to_invoice_total_amount,
                        addon_consumables_amount:addon_consumables_cover_amount, addon_consumables_gst:addon_consumables_cover_gst_amount, addon_consumables_total:addon_consumables_cover_total_amount,
                        addon_engine_amount:addon_engine_protector_amount, addon_engine_gst:addon_engine_protector_gst_amount, addon_engine_total:addon_engine_protector_total_amount,
                        addon_rsa_amount:addon_roadside_assistance_amount, addon_rsa_gst:addon_roadside_assistance_gst_amount, addon_rsa_total:addon_roadside_assistance_total_amount,
                        addon_keyprotect_amount:addon_key_protect_amount, addon_keyprotect_gst:addon_key_protect_gst_amount, addon_keyprotect_total:addon_key_protect_total_amount,
                        addon_tyreprotect_amount:addon_tyre_protect_amount, addon_tyreprotect_gst:addon_tyre_protect_gst_amount, addon_tyreprotect_total:addon_tyre_protect_total_amount,
                        addon_pillion_amount:addon_pillion_cover_amount, addon_pillion_gst:addon_pillion_cover_gst_amount, addon_pillion_total:addon_pillion_cover_total_amount,
                        publish_stage, is_popular, published_at, published_by, updated_at
                        `
                    )
                    .eq('state_code', activeStateCode),
                tenantSlug !== 'aums'
                    ? supabase
                          .from('cat_price_dealer')
                          .select('vehicle_color_id, offer_amount, inclusion_type, is_active')
                          .eq('state_code', activeStateCode)
                          .eq('tenant_id', tenantId as string)
                    : Promise.resolve({ data: [] as any, error: null as any }),
            ]);

            const { data: priceData, error: priceError } = priceRes;
            if (priceError) throw priceError;

            const { data: offerData, error: offerError } = offerRes as any;
            if (offerError) console.error('Offer Fetch Error:', offerError);

            const priceMap = new Map<
                string,
                {
                    price: number;
                    exFactory: number;
                    exFactoryGst: number;
                    rto: number;
                    rto_data?: any;
                    insurance: number;
                    insurance_data?: any;
                    onRoad: number;
                    district?: string | null;
                    publishedAt?: string;
                    publishStage?: string;
                    updatedAt?: string;
                    isPopular?: boolean;
                    updatedByName?: string;
                }
            >();
            // Resolve published_by UUIDs to display names
            const publisherIds = [...new Set((priceData || []).map((r: any) => r.published_by).filter(Boolean))];
            const publisherNameMap = new Map<string, string>();
            if (publisherIds.length > 0) {
                const { data: memberRows } = await supabase
                    .from('id_members')
                    .select('id, full_name')
                    .in('id', publisherIds);
                (memberRows || []).forEach((m: any) => {
                    if (m.id && m.full_name) publisherNameMap.set(m.id, m.full_name);
                });
            }

            (priceData || []).forEach((row: any) => {
                const skuId = row.sku_id;
                if (!skuId) return;
                priceMap.set(skuId, {
                    price: Number(row.ex_showroom) || 0,
                    exFactory: Number(row.ex_showroom_basic) || 0,
                    exFactoryGst: Number(row.ex_showroom_gst_amount) || 0,
                    rto: Number(row.rto_total_state) || 0,
                    rto_data: {
                        STATE: Number(row.rto_total_state || 0),
                        BH: Number(row.rto_total_bh || 0),
                        COMPANY: Number(row.rto_total_company || 0),
                        default: row.rto_default_type || 'STATE',
                    },
                    insurance: Number(row.ins_total) || 0,
                    insurance_data: (() => {
                        const odBase = Number(row.ins_od_base || 0);
                        const odGst = Number(row.ins_od_total || 0) - odBase;
                        const tpBase = Number(row.ins_tp_base || 0);
                        const tpGst = Number(row.ins_tp_total || 0) - tpBase;
                        const ADDON_MAP = [
                            { key: 'pa', label: 'Personal Accident (PA)' },
                            { key: 'zerodep', label: 'Zero Depreciation' },
                            { key: 'rti', label: 'Return to Invoice' },
                            { key: 'consumables', label: 'Consumables Cover' },
                            { key: 'engine', label: 'Engine Protector' },
                            { key: 'rsa', label: 'Roadside Assistance' },
                            { key: 'keyprotect', label: 'Key Protect' },
                            { key: 'tyreprotect', label: 'Tyre Protect' },
                            { key: 'pillion', label: 'Pillion Cover' },
                        ];
                        const addons = ADDON_MAP.map(a => {
                            const total = Number(row[`addon_${a.key}_total`] ?? 0);
                            if (total <= 0) return null;
                            return {
                                id: a.key,
                                label: a.label,
                                amount: Number(row[`addon_${a.key}_amount`] ?? 0),
                                gst: Number(row[`addon_${a.key}_gst`] ?? 0),
                                total,
                            };
                        }).filter(Boolean);
                        return {
                            base_total:
                                Number(row.ins_total || 0) ||
                                Number(row.ins_sum_mandatory_insurance || 0) +
                                    Number(row.ins_sum_mandatory_insurance_gst_amount || 0),
                            gst_rate: Number(row.ins_gst_rate || 18),
                            od: { base: odBase, gst: Math.max(0, odGst), total: Number(row.ins_od_total || 0) },
                            tp: { base: tpBase, gst: Math.max(0, tpGst), total: Number(row.ins_tp_total || 0) },
                            addons,
                        };
                    })(),
                    onRoad: Number(row.on_road_price) || 0,
                    district: 'ALL',
                    publishedAt: row.published_at,
                    publishStage: row.publish_stage || 'DRAFT',
                    updatedAt: row.updated_at,
                    isPopular: row.is_popular || false,
                    updatedByName: row.published_by ? publisherNameMap.get(row.published_by) || undefined : undefined,
                });
            });

            const offerMap = new Map();
            offerData?.forEach((o: any) => {
                offerMap.set(o.vehicle_color_id, o.offer_amount);
            });

            const activeMap = new Map();
            offerData?.forEach((o: any) => {
                activeMap.set(o.vehicle_color_id, o.is_active);
            });

            const formattedSkus: SKUPriceRow[] = (skuData || []).map((sku: any) => {
                const model = sku.model;
                const variant = sku.vehicle_variant || sku.accessory_variant || sku.service_variant;
                const brand = model?.brand;
                const productType = model?.product_type || 'VEHICLE';

                const priceRecord = priceMap.get(sku.id);
                const statePrice = priceRecord?.price;
                const pricingRule = (offerData || []).find((o: any) => o.vehicle_color_id === sku.id);
                const stateOffer = clampOfferDelta(Number(pricingRule?.offer_amount ?? offerMap.get(sku.id) ?? -1));
                const stateInclusion = pricingRule?.inclusion_type || 'OPTIONAL';
                const localIsActive = activeMap.has(sku.id) ? activeMap.get(sku.id) : false;

                const publishedAt = priceRecord?.publishedAt;
                const updatedAt = priceRecord?.updatedAt;
                const publishStage = (priceRecord?.publishStage || 'DRAFT') as SKUPriceRow['publishStage'];
                const resolvedStatus = (sku.status || 'INACTIVE') as any;

                let displayState: SKUPriceRow['displayState'] = 'Draft';
                if (tenantSlug !== 'aums') {
                    displayState = resolvedStatus === 'ACTIVE' && localIsActive ? 'Live' : 'Inactive';
                } else {
                    if (publishStage === 'PUBLISHED') displayState = 'Published';
                    else if (publishStage === 'UNDER_REVIEW') displayState = 'In Review';
                    else if (publishStage === 'LIVE') displayState = 'Live';
                    else if (publishStage === 'INACTIVE') displayState = 'Inactive';
                    else displayState = 'Draft';
                }

                const finalPrice = statePrice !== undefined ? statePrice : 0;
                const finalInclusionType = stateInclusion as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';

                // Determine item type from model product_type
                let itemType: 'vehicles' | 'accessories' | 'service' = 'vehicles';
                if (productType === 'ACCESSORY') itemType = 'accessories';
                else if (productType === 'SERVICE') itemType = 'service';

                return {
                    id: sku.id,
                    brand: brand?.name || (itemType === 'vehicles' ? 'UNKNOWN' : 'GENERAL'),
                    brandId: brand?.id,
                    brandLogo: brand?.logo_svg,
                    category: productType,
                    subCategory: 'General',
                    model: model?.name || 'UNKNOWN',
                    modelId: model?.id,
                    variant: variant?.name || '',
                    color: sku.color_name || sku.name,
                    finish: sku.finish || '',
                    hex_primary: sku.hex_primary,
                    hex_secondary: sku.hex_secondary,
                    engineCc: variant?.displacement || 0,
                    suitableFor: '',
                    exShowroom: finalPrice,
                    exFactory: priceRecord?.exFactory || 0,
                    exFactoryGst: priceRecord?.exFactoryGst || 0,
                    offerAmount: stateOffer,
                    inclusionType: finalInclusionType,
                    type: itemType,
                    originalExShowroom: finalPrice,
                    originalOfferAmount: stateOffer,
                    originalInclusionType: finalInclusionType,
                    stockCount: 0,
                    status: resolvedStatus as any,
                    originalStatus: resolvedStatus as any,
                    localIsActive: localIsActive,
                    position: sku.position || 0,
                    variantPosition: variant?.position || 0,
                    originalLocalIsActive: localIsActive,
                    publishedAt: publishedAt,
                    updatedAt: updatedAt,
                    rto: priceRecord?.rto || 0,
                    rto_data: priceRecord?.rto_data,
                    insurance: priceRecord?.insurance || 0,
                    insurance_data: priceRecord?.insurance_data,
                    onRoad: priceRecord?.onRoad || finalPrice,
                    publishStage: publishStage,
                    originalPublishStage: publishStage,
                    displayState: displayState,
                    isPopular: priceRecord?.isPopular || false,
                    originalIsPopular: priceRecord?.isPopular || false,
                    updatedByName: priceRecord?.updatedByName,
                };
            });

            formattedSkus.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

            setSkus(formattedSkus);
        } catch (error: unknown) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setHasUnsavedChanges(false);
        }
    };

    const syncPricingSnapshotForSku = useCallback(
        async (skuId: string, stateCode: string) => {
            const { data } = await supabase
                .from(stateCode.toUpperCase() === 'MH' ? 'cat_price_state_mh' : `cat_price_${stateCode.toLowerCase()}`)
                .select(
                    `
                    sku_id,
                    on_road_price,
                    rto_default_type,
                    rto_total_state, rto_total_bh, rto_total_company,
                    ins_od_base:ins_own_damage_premium_amount, ins_od_total:ins_own_damage_total_amount,
                    ins_tp_base:ins_liability_only_premium_amount, ins_tp_total:ins_liability_only_total_amount,
                    ins_total:ins_gross_premium, ins_gst_rate,
                    addon_pa_amount:addon_personal_accident_cover_amount, addon_pa_gst:addon_personal_accident_cover_gst_amount, addon_pa_total:addon_personal_accident_cover_total_amount,
                    addon_zerodep_amount:addon_zero_depreciation_amount, addon_zerodep_gst:addon_zero_depreciation_gst_amount, addon_zerodep_total:addon_zero_depreciation_total_amount,
                    addon_rti_amount:addon_return_to_invoice_amount, addon_rti_gst:addon_return_to_invoice_gst_amount, addon_rti_total:addon_return_to_invoice_total_amount,
                    addon_consumables_amount:addon_consumables_cover_amount, addon_consumables_gst:addon_consumables_cover_gst_amount, addon_consumables_total:addon_consumables_cover_total_amount,
                    addon_engine_amount:addon_engine_protector_amount, addon_engine_gst:addon_engine_protector_gst_amount, addon_engine_total:addon_engine_protector_total_amount,
                    addon_rsa_amount:addon_roadside_assistance_amount, addon_rsa_gst:addon_roadside_assistance_gst_amount, addon_rsa_total:addon_roadside_assistance_total_amount,
                    addon_keyprotect_amount:addon_key_protect_amount, addon_keyprotect_gst:addon_key_protect_gst_amount, addon_keyprotect_total:addon_key_protect_total_amount,
                    addon_tyreprotect_amount:addon_tyre_protect_amount, addon_tyreprotect_gst:addon_tyre_protect_gst_amount, addon_tyreprotect_total:addon_tyre_protect_total_amount,
                    addon_pillion_amount:addon_pillion_cover_amount, addon_pillion_gst:addon_pillion_cover_gst_amount, addon_pillion_total:addon_pillion_cover_total_amount
                    `
                )
                .eq('sku_id', skuId)
                .eq('state_code', stateCode)
                .maybeSingle();

            if (!data) return;
            const d = data as any;
            const ADDON_MAP_RT = [
                { key: 'pa', label: 'Personal Accident (PA)' },
                { key: 'zerodep', label: 'Zero Depreciation' },
                { key: 'rti', label: 'Return to Invoice' },
                { key: 'consumables', label: 'Consumables Cover' },
                { key: 'engine', label: 'Engine Protector' },
                { key: 'rsa', label: 'Roadside Assistance' },
                { key: 'keyprotect', label: 'Key Protect' },
                { key: 'tyreprotect', label: 'Tyre Protect' },
                { key: 'pillion', label: 'Pillion Cover' },
            ];
            const rtAddons = ADDON_MAP_RT.map(a => {
                const total = Number(d[`addon_${a.key}_total`] ?? 0);
                if (total <= 0) return null;
                return {
                    id: a.key,
                    label: a.label,
                    amount: Number(d[`addon_${a.key}_amount`] ?? 0),
                    gst: Number(d[`addon_${a.key}_gst`] ?? 0),
                    total,
                };
            }).filter(Boolean);
            const odBase = Number(d.ins_od_base || 0);
            const odTotal = Number(d.ins_od_total || 0);
            const tpBase = Number(d.ins_tp_base || 0);
            const tpTotal = Number(d.ins_tp_total || 0);

            setSkus(prev =>
                prev.map(s =>
                    s.id === skuId
                        ? {
                              ...s,
                              rto: Number(d.rto_total_state || 0),
                              insurance: Number(d.ins_total || 0),
                              onRoad: Number(d.on_road_price || s.exShowroom || 0),
                              rto_data: {
                                  STATE: Number(d.rto_total_state || 0),
                                  BH: Number(d.rto_total_bh || 0),
                                  COMPANY: Number(d.rto_total_company || 0),
                                  default: d.rto_default_type || 'STATE',
                              },
                              insurance_data: {
                                  base_total: Number(d.ins_total || 0),
                                  gst_rate: Number(d.ins_gst_rate || 18),
                                  od: { base: odBase, gst: Math.max(0, odTotal - odBase), total: odTotal },
                                  tp: { base: tpBase, gst: Math.max(0, tpTotal - tpBase), total: tpTotal },
                                  addons: rtAddons,
                              },
                          }
                        : s
                )
            );
        },
        [supabase]
    );

    const runPriceEngineCalculation = useCallback(
        async (inputs: Array<{ skuId: string; exShowroom: number }>, stateCode: string): Promise<boolean> => {
            if (tenantSlug !== 'aums') return true;

            const normalized = inputs
                .filter(item => !!item?.skuId && Number(item.exShowroom) > 0)
                .map(item => ({ skuId: item.skuId, exShowroom: Number(item.exShowroom) }));
            const deduped = Array.from(new Map(normalized.map(i => [i.skuId, i])).values());

            if (deduped.length === 0) return true;

            const result = await calculatePricingBySkuIds(deduped, stateCode);
            if (!result.success) {
                console.error('[Pricing Realtime] Engine failed:', result.errors.join(' | '));
                return false;
            }

            await Promise.all(deduped.map(item => syncPricingSnapshotForSku(item.skuId, stateCode)));
            return true;
        },
        [tenantSlug, syncPricingSnapshotForSku]
    );

    const scheduleRealtimePriceEngine = useCallback(
        (skuId: string, exShowroom: number) => {
            if (tenantSlug !== 'aums') return;
            const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode;
            if (!activeStateCode) return;

            if (realtimeCalcTimersRef.current[skuId]) {
                clearTimeout(realtimeCalcTimersRef.current[skuId]);
            }

            if (!(exShowroom > 0)) {
                setSkus(prev =>
                    prev.map(s =>
                        s.id === skuId
                            ? {
                                  ...s,
                                  rto: 0,
                                  insurance: 0,
                                  onRoad: Number(s.exShowroom || 0),
                                  rto_data: {
                                      STATE: 0,
                                      BH: 0,
                                      COMPANY: 0,
                                      default: 'STATE',
                                  },
                                  insurance_data: {
                                      base_total: 0,
                                      gst_rate: 18,
                                      od: { base: 0, gst: 0, total: 0 },
                                      tp: { base: 0, gst: 0, total: 0 },
                                      addons: [],
                                  },
                              }
                            : s
                    )
                );
                return;
            }

            realtimeCalcTimersRef.current[skuId] = setTimeout(async () => {
                const seq = (realtimeCalcSeqRef.current[skuId] || 0) + 1;
                realtimeCalcSeqRef.current[skuId] = seq;

                try {
                    const result = await calculatePricingBySkuIds([{ skuId, exShowroom }], activeStateCode);
                    if (!result.success) {
                        console.error('[Pricing Realtime] Engine failed:', result.errors.join(' | '));
                        return;
                    }
                    if (realtimeCalcSeqRef.current[skuId] !== seq) return;
                    await syncPricingSnapshotForSku(skuId, activeStateCode);
                } catch (err) {
                    console.error('[Pricing Realtime] Unexpected failure:', err);
                } finally {
                    delete realtimeCalcTimersRef.current[skuId];
                }
            }, 600);
        },
        [selectedStateId, states, tenantSlug, syncPricingSnapshotForSku]
    );

    const handleUpdatePrice = (skuId: string, price: number) => {
        const safePrice = Number.isFinite(price) && price > 0 ? Math.round(price) : 0;
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, exShowroom: safePrice } : s)));
        scheduleRealtimePriceEngine(skuId, safePrice);
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateOffer = (skuId: string, offer: number) => {
        const normalized = clampOfferDelta(offer);
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, offerAmount: normalized } : s)));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateInclusion = (skuId: string, type: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') => {
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, inclusionType: type } : s)));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateStatus = (skuId: string, status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'RELAUNCH') => {
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, status: status } : s)));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    // AUMS: Update publish_stage in canonical pricing state table flow
    const handleUpdatePublishStage = (skuId: string, stage: string) => {
        const displayStateMap: Record<string, SKUPriceRow['displayState']> = {
            DRAFT: 'Draft',
            UNDER_REVIEW: 'In Review',
            PUBLISHED: 'Published',
            LIVE: 'Live',
            INACTIVE: 'Inactive',
        };
        setSkus(prev =>
            prev.map(s =>
                s.id === skuId
                    ? {
                          ...s,
                          publishStage: stage as SKUPriceRow['publishStage'],
                          displayState: displayStateMap[stage] || 'Draft',
                      }
                    : s
            )
        );
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateLocalStatus = (skuId: string, isActive: boolean) => {
        setSkus(prev =>
            prev.map(s =>
                s.id === skuId
                    ? {
                          ...s,
                          localIsActive: isActive,
                          displayState: isActive ? 'Live' : 'Inactive',
                      }
                    : s
            )
        );
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdatePopular = (skuId: string, isPopular: boolean) => {
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, isPopular: isPopular } : s)));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleBulkUpdate = (ids: string[], price: number) => {
        const safePrice = Number.isFinite(price) && price > 0 ? Math.round(price) : 0;
        setSkus(prev => prev.map(s => (ids.includes(s.id) ? { ...s, exShowroom: safePrice } : s)));
        ids.forEach(id => scheduleRealtimePriceEngine(id, safePrice));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleSaveAll = async () => {
        const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode;
        if (!activeStateCode) return;

        const isAums = tenantSlug === 'aums';

        if (isAums) {
            // Safety: save only rows that actually changed; prevents accidental zero-overwrite on untouched rows.
            const changedPriceRows = skus.filter(
                s =>
                    s.exShowroom !== s.originalExShowroom ||
                    s.isPopular !== s.originalIsPopular ||
                    s.publishStage !== s.originalPublishStage
            );

            const changedExShowroomInputs = changedPriceRows
                .filter(s => s.exShowroom !== s.originalExShowroom && Number(s.exShowroom) > 0)
                .map(s => ({ skuId: s.id, exShowroom: Number(s.exShowroom) }));

            if (changedExShowroomInputs.length > 0) {
                for (const item of changedExShowroomInputs) {
                    const timer = realtimeCalcTimersRef.current[item.skuId];
                    if (timer) {
                        clearTimeout(timer);
                        delete realtimeCalcTimersRef.current[item.skuId];
                    }
                }
                const engineOk = await runPriceEngineCalculation(changedExShowroomInputs, activeStateCode);
                if (!engineOk) {
                    alert('Price engine calculation failed for one or more edited SKUs. Save aborted.');
                    return;
                }
            }

            const pricePayload = changedPriceRows
                .map(s => {
                    const exShowroomSafe =
                        Number(s.exShowroom) > 0
                            ? Number(s.exShowroom)
                            : Number(s.originalExShowroom) > 0
                              ? Number(s.originalExShowroom)
                              : 0;

                    return {
                        vehicle_color_id: s.id,
                        state_code: activeStateCode,
                        district: 'ALL',
                        ex_showroom_price: exShowroomSafe,
                        is_active: true,
                        is_popular: s.isPopular || false,
                        ...(s.publishStage !== s.originalPublishStage && { publish_stage: s.publishStage }),
                    };
                })
                .filter(row => row.ex_showroom_price > 0);

            const modifiedStatusSkus = skus.filter(s => s.status !== s.originalStatus);
            const statusPayload = modifiedStatusSkus.map(sku => ({
                id: sku.id,
                status: sku.status,
            }));

            const result = await savePrices(pricePayload, statusPayload);

            if (result.error) {
                alert(`Failed to save changes: ${result.error}`);
            } else {
                setHasUnsavedChanges(false);
                setSkus(prev =>
                    prev.map(s => ({
                        ...s,
                        originalExShowroom: s.exShowroom,
                        originalOfferAmount: s.offerAmount,
                        originalStatus: s.status,
                        originalIsPopular: s.isPopular,
                    }))
                );
                try {
                    const {
                        data: { user },
                    } = await supabase.auth.getUser();
                    if (user?.id && tenantId) {
                        await supabase.from('audit_logs').insert({
                            tenant_id: tenantId,
                            actor_id: user.id,
                            action: 'PRICING_PUBLISH_STAGE_UPDATED',
                            entity_type: 'PRICING_LEDGER',
                            entity_id: activeStateCode,
                            metadata: {
                                state_code: activeStateCode,
                                updated_rows: skus.length,
                            },
                        });
                    }
                } catch (e) {
                    console.warn('Audit log failed:', e);
                }
            }
        } else {
            const offerPayload = skus.map(s => ({
                tenant_id: tenantId,
                vehicle_color_id: s.id,
                state_code: activeStateCode,
                offer_amount: clampOfferDelta(s.offerAmount),
                inclusion_type: s.inclusionType,
                is_active: s.localIsActive,
                is_popular: s.isPopular || false,
            }));

            const { error } = await supabase.rpc('upsert_dealer_offers', { offers: offerPayload });

            if (error) {
                alert(`Failed to save changes: ${getErrorMessage(error)}`);
            } else {
                setHasUnsavedChanges(false);
                setSkus(prev =>
                    prev.map(s => ({
                        ...s,
                        originalExShowroom: s.exShowroom,
                        originalOfferAmount: s.offerAmount,
                        originalStatus: s.status,
                        originalIsPopular: s.isPopular,
                    }))
                );
                try {
                    const {
                        data: { user },
                    } = await supabase.auth.getUser();
                    if (user?.id && tenantId) {
                        await supabase.from('audit_logs').insert({
                            tenant_id: tenantId,
                            actor_id: user.id,
                            action: 'DEALER_PRICING_UPDATED',
                            entity_type: 'PRICING_LEDGER',
                            entity_id: activeStateCode,
                            metadata: {
                                state_code: activeStateCode,
                                updated_rows: skus.length,
                            },
                        });
                    }
                } catch (e) {
                    console.warn('Audit log failed:', e);
                }
            }
        }
    };

    const { uniqueBrands, uniqueCategories, uniqueSubCategories, uniqueModels, uniqueVariants } = useMemo(() => {
        const bMap = new Set<string>();
        const cMap = new Set<string>();
        const scMap = new Set<string>();
        const mMap = new Set<string>();
        const vMap = new Set<string>();

        skus.forEach(s => {
            // Category list should always show all available categories
            if (s.category) cMap.add(s.category);

            // Tight Filtering: Only show items matching the selected higher-level filters
            const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;

            // Brand list should be filtered by selected category
            if (matchesCategory && s.brand) {
                bMap.add(s.brand);
            }

            const matchesBrand = selectedBrand === 'ALL' || s.brand === selectedBrand;

            // Sub-category list should be filtered by category AND brand
            if (matchesCategory && matchesBrand && s.subCategory) {
                scMap.add(s.subCategory);
            }

            const matchesSubCategory = selectedSubCategory === 'ALL' || s.subCategory === selectedSubCategory;

            // Model list should be filtered by category, brand, AND sub-category
            if (matchesCategory && matchesBrand && matchesSubCategory && s.model) {
                mMap.add(s.model);
            }

            const matchesModel = selectedModel === 'ALL' || s.model === selectedModel;

            // Variant list should be filtered by all previous filters
            if (matchesCategory && matchesBrand && matchesSubCategory && matchesModel && s.variant) {
                vMap.add(s.variant);
            }
        });

        return {
            uniqueBrands: Array.from(bMap).sort(),
            uniqueCategories: Array.from(cMap).sort(),
            uniqueSubCategories: Array.from(scMap).sort(),
            uniqueModels: Array.from(mMap).sort(),
            uniqueVariants: Array.from(vMap).sort(),
        };
    }, [skus, selectedBrand, selectedCategory, selectedSubCategory, selectedModel]);

    useEffect(() => {
        if (selectedModel !== 'ALL' && !uniqueModels.includes(selectedModel)) {
            setSelectedModel('ALL');
        }
    }, [uniqueModels, selectedModel]);

    useEffect(() => {
        if (selectedVariant !== 'ALL' && !uniqueVariants.includes(selectedVariant)) {
            setSelectedVariant('ALL');
        }
    }, [uniqueVariants, selectedVariant]);

    const filteredSkus = useMemo(() => {
        // Critical fix bypasses all category filters — show ALL zero-price SKUs
        if (quickFilter === 'critical') {
            return skus.filter(s => s.exShowroom === 0);
        }

        const baseFiltered = skus.filter(s => {
            const matchesBrand = selectedBrand === 'ALL' || s.brand === selectedBrand;
            const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
            const matchesSubCategory = selectedSubCategory === 'ALL' || s.subCategory === selectedSubCategory;
            const matchesModel = selectedModel === 'ALL' || s.model === selectedModel;
            const matchesVariant = selectedVariant === 'ALL' || s.variant === selectedVariant;
            return matchesBrand && matchesCategory && matchesSubCategory && matchesModel && matchesVariant;
        });
        if (!quickFilter || quickFilter === 'inventory') return baseFiltered;

        const isMarketReady = (s: SKUPriceRow) =>
            tenantSlug === 'aums'
                ? s.displayState === 'Live' || s.displayState === 'Published'
                : s.localIsActive === true;

        if (quickFilter === 'market_ready') return baseFiltered.filter(isMarketReady);
        if (quickFilter === 'pipeline') return baseFiltered.filter(s => s.status !== 'ACTIVE');
        return baseFiltered;
    }, [
        skus,
        selectedBrand,
        selectedCategory,
        selectedSubCategory,
        selectedModel,
        selectedVariant,
        quickFilter,
        tenantSlug,
    ]);

    const activeRule = states.find(s => s.id === selectedStateId) || null;

    const renderHeader = () => {
        const missingPrices = skus.filter(s => s.exShowroom === 0).length;
        const liveSkus = skus.filter(s => s.status === 'ACTIVE').length;
        const draftSkus = skus.filter(s => s.status !== 'ACTIVE').length;
        const pendingSaves = hasUnsavedChanges
            ? skus.filter(
                  s =>
                      s.exShowroom !== s.originalExShowroom ||
                      s.offerAmount !== s.originalOfferAmount ||
                      s.inclusionType !== s.originalInclusionType ||
                      s.status !== s.originalStatus ||
                      s.localIsActive !== s.originalLocalIsActive
              ).length
            : 0;
        const activeRuleObj = states.find(s => s.id === selectedStateId);

        // Dynamic sum from Table's current view
        const totalValue = tableSummary.value;
        const formattedValue =
            totalValue >= 1000 ? formatCurrencyCompact(totalValue) : `₹${totalValue.toLocaleString()}`;

        return (
            <div className="max-w-full mx-auto space-y-4 mb-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                    <div className="space-y-1 text-left">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-[8px] font-black text-emerald-600 uppercase tracking-widest rounded-full">
                                {selectedCategory === 'ACCESSORY' ? 'Product Catalog' : 'Regulatory Ledger'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            {selectedCategory === 'ACCESSORY' ? (
                                <>
                                    Accessory <span className="text-emerald-600">Pricing</span>
                                </>
                            ) : (
                                <>
                                    On-Road <span className="text-emerald-600">Pricing</span>
                                </>
                            )}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div
                            className={`flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-lg transition-all duration-300 border ${hasUnsavedChanges ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200 scale-100' : 'opacity-0 scale-95 border-transparent'}`}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="uppercase tracking-widest font-black text-xs text-left">
                                Unsaved Changes
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI Grid - Compacted */}
                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
                    {/* Brands/SKUs (Indigo) */}
                    <div
                        onClick={() => toggleQuickFilter('inventory')}
                        className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border shadow-md flex flex-col justify-between h-24 group hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden text-left cursor-pointer ${
                            quickFilter === 'inventory'
                                ? 'border-indigo-400 ring-1 ring-indigo-300/50'
                                : 'border-slate-200 dark:border-white/10'
                        }`}
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Package size={32} className="text-indigo-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-1 text-left">
                            <div className="p-1 px-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <Package size={14} className="fill-current" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                Inventory
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {loading ? '-' : tableSummary.count}
                            </div>
                            <div className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                                Filtered SKUs
                            </div>
                        </div>
                    </div>

                    {/* Live SKUs (Emerald) */}
                    <div
                        onClick={() => toggleQuickFilter('market_ready')}
                        className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border shadow-md flex flex-col justify-between h-24 group hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden text-left cursor-pointer ${
                            quickFilter === 'market_ready'
                                ? 'border-emerald-400 ring-1 ring-emerald-300/50'
                                : 'border-slate-200 dark:border-white/10'
                        }`}
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={32} className="text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-1 text-left">
                            <div className="p-1 px-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                <TrendingUp size={14} className="fill-current" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                Market Ready
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {loading ? '-' : liveSkus}
                            </div>
                            <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                                Active Status
                            </div>
                        </div>
                    </div>

                    {/* Draft/New (Amber) */}
                    <div
                        onClick={() => toggleQuickFilter('pipeline')}
                        className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border shadow-md flex flex-col justify-between h-24 group hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden text-left cursor-pointer ${
                            quickFilter === 'pipeline'
                                ? 'border-amber-400 ring-1 ring-amber-300/50'
                                : 'border-slate-200 dark:border-white/10'
                        }`}
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={32} className="text-amber-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-1 text-left">
                            <div className="p-1 px-1.5 rounded-lg bg-amber-50 text-amber-600">
                                <Zap size={14} className="fill-current" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                Pipeline
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {loading ? '-' : draftSkus}
                            </div>
                            <div className="text-[8px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                                Pending Sync
                            </div>
                        </div>
                    </div>

                    {/* Missing Price (Rose) */}
                    <div
                        onClick={() => toggleQuickFilter('critical')}
                        className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border shadow-md flex flex-col justify-between h-24 group hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden text-left cursor-pointer ${
                            quickFilter === 'critical'
                                ? 'border-rose-400 ring-1 ring-rose-300/50'
                                : 'border-slate-200 dark:border-white/10'
                        }`}
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target size={32} className="text-rose-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-1 text-left">
                            <div className="p-1 px-1.5 rounded-lg bg-rose-50 text-rose-600">
                                <Target size={14} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                Critical Fix
                            </span>
                        </div>
                        <div className="text-left">
                            <div
                                className={`text-2xl font-black uppercase italic tracking-tighter ${missingPrices > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}
                            >
                                {loading ? '-' : missingPrices}
                            </div>
                            <div className="text-[8px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">
                                Zero Price SKU
                            </div>
                        </div>
                    </div>

                    {/* Inventory Value (Blue) */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-md flex flex-col justify-between h-24 group hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles size={32} className="text-blue-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-1 text-left">
                            <div className="p-1 px-1.5 rounded-lg bg-blue-50 text-blue-600">
                                <Sparkles size={14} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                Inventory Value
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter overflow-hidden text-ellipsis whitespace-nowrap">
                                {loading ? '-' : formattedValue}
                            </div>
                            <div className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                                Sum Ex-Showroom
                            </div>
                        </div>
                    </div>

                    {/* Market (Slate) */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-md flex flex-col justify-between h-24 group hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Landmark size={32} className="text-slate-400" />
                        </div>
                        <div className="flex items-center gap-2 mb-1 text-left">
                            <div className="p-1 px-1.5 rounded-lg bg-slate-100 text-slate-500">
                                <Landmark size={14} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                Current Market
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {loading ? '-' : activeRuleObj?.stateCode || '--'}
                            </div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                {activeRuleObj?.ruleName || 'Unknown Region'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-6 overflow-auto transition-colors duration-500">
            {renderHeader()}

            <div className="w-full">
                <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden min-h-[600px] relative">
                    {loading ? (
                        <div className="flex h-[600px] items-center justify-center">
                            <div className="flex flex-col items-center gap-4 text-left">
                                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Loading Ledger...
                                </span>
                            </div>
                        </div>
                    ) : (
                        <PricingLedgerTable
                            initialSkus={skus}
                            processedSkus={filteredSkus}
                            quickFilter={quickFilter}
                            activeRule={activeRule}
                            onUpdatePrice={handleUpdatePrice}
                            onUpdateOffer={handleUpdateOffer}
                            onUpdateInclusion={handleUpdateInclusion}
                            onUpdateStatus={handleUpdateStatus}
                            onUpdatePublishStage={handleUpdatePublishStage}
                            onUpdateLocalStatus={handleUpdateLocalStatus}
                            onUpdatePopular={handleUpdatePopular}
                            onBulkUpdate={handleBulkUpdate}
                            onSaveAll={handleSaveAll}
                            states={states}
                            selectedStateId={selectedStateId}
                            onStateChange={setSelectedStateId}
                            brands={uniqueBrands}
                            selectedBrand={selectedBrand}
                            onBrandChange={setSelectedBrand}
                            categories={uniqueCategories}
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            subCategories={uniqueSubCategories}
                            selectedSubCategory={selectedSubCategory}
                            onSubCategoryChange={setSelectedSubCategory}
                            models={uniqueModels}
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            variants={uniqueVariants}
                            selectedVariant={selectedVariant}
                            onVariantChange={setSelectedVariant}
                            hasUnsavedChanges={hasUnsavedChanges}
                            isSaving={false}
                            onSummaryChange={setTableSummary}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
