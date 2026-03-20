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
    RefreshCw,
    Wrench,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { KpiCard } from '@/components/dashboard/DashboardWidgets';
import { KPIItem } from '@/components/layout/KPIBar';
import { calculatePricingBySkuIds } from '@/actions/pricingLedger';
import { savePrices } from '@/actions/savePrices';
import { formatCurrencyCompact } from '@/utils/formatVehicleSpec';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { toast } from 'sonner';

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
    tatDaysInput?: number | null;
    tatSource?: string;
    originalTatDaysInput?: number | null;
}

const normalizeOfferDelta = (value: number) => (Number.isFinite(value) ? Math.trunc(value) : 0);

const getRtoTotalForDefaultType = (row: any): number => {
    const defaultType = String(row?.rto_default_type || 'STATE').toUpperCase();
    if (defaultType === 'BH') return Number(row?.rto_total_bh) || 0;
    if (defaultType === 'COMPANY') return Number(row?.rto_total_company) || 0;
    return Number(row?.rto_total_state) || 0;
};

const getNetInsuranceTotal = (row: any): number => {
    const mandatoryBase = Number(row?.ins_sum_mandatory_insurance) || 0;
    const mandatoryGst = Number(row?.ins_sum_mandatory_insurance_gst_amount) || 0;
    const mandatoryTotal = mandatoryBase + mandatoryGst;
    if (mandatoryTotal > 0) return mandatoryTotal;
    return Number(row?.ins_total) || 0;
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
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveQueued, setSaveQueued] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastEditTime, setLastEditTime] = useState<number | null>(null);
    const [tableSummary, setTableSummary] = useState<{ count: number; value: number }>({ count: 0, value: 0 });
    const [quickFilter, setQuickFilter] = useState<'inventory' | 'market_ready' | 'pipeline' | 'critical' | null>(null);
    const [isGateVisible, setIsGateVisible] = useState(!searchParams.get('category')); // Show gate if no category in URL

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
    const saveQueuedRef = useRef(false);
    const lastPriceEngineToastAtRef = useRef(0);

    const notifyPriceEngineFailure = (message: string) => {
        const now = Date.now();
        if (now - lastPriceEngineToastAtRef.current > 2500) {
            toast.error(message);
            lastPriceEngineToastAtRef.current = now;
        }
    };

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Sync filters to URL when they change (persist across reloads)
    useEffect(() => {
        if (!isHydrated) return;
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
    }, [
        isHydrated,
        selectedStateId,
        selectedBrand,
        selectedCategory,
        selectedSubCategory,
        selectedModel,
        selectedVariant,
    ]);

    // Initial Load - Fetch Rules
    useEffect(() => {
        fetchRules();
    }, []);

    // Fetch Data when Filters Change
    useEffect(() => {
        if (isHydrated && selectedStateId) {
            fetchSKUsAndPrices();
        }
    }, [isHydrated, selectedStateId]);

    useEffect(() => {
        return () => {
            Object.values(realtimeCalcTimersRef.current).forEach(timer => clearTimeout(timer));
            realtimeCalcTimersRef.current = {};
        };
    }, []);

    // Auto-Save Logic (5 seconds debounce)
    useEffect(() => {
        if (hasUnsavedChanges && lastEditTime && !isSaving) {
            const timer = setTimeout(() => {
                handleSaveAll();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [lastEditTime, hasUnsavedChanges, isSaving]);

    const fetchRules = async () => {
        const { data, error } = await supabase
            .from('cat_reg_rules')
            .select('*')
            .eq('status', 'ACTIVE')
            .order('state_code');

        if (error) {
            console.error('Fetch Rules Error:', error);
            if (getErrorMessage(error)) console.error('Fetch Rules Message:', getErrorMessage(error));
            toast.error(`Failed to load states: ${getErrorMessage(error)}`);
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
        setLoadError(null);
        try {
            // 0. Resolve allowed brands for this dealer (mono vs multi-brand)
            //    AUMS superadmin → no rows in dealer_brands → sees ALL brands
            //    Mono-brand dealer (e.g. AHER → Honda) → sees only Honda SKUs
            let allowedBrandIds: string[] = [];
            if (tenantSlug !== 'aums' && tenantId) {
                const { data: dealerBrandsData } = await supabase
                    .from('dealer_brands')
                    .select('brand_id')
                    .eq('tenant_id', tenantId);
                allowedBrandIds = (dealerBrandsData || []).map((r: any) => r.brand_id).filter(Boolean);
            }

            // V2 Catalog Fetch: SKU -> Variant -> Model -> Brand
            let skuQuery = supabase
                .from('cat_skus')
                .select(
                    `
                    id, name, slug, position, status, sku_type,
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

            // Apply brand filter if dealer has brand restrictions
            if (allowedBrandIds.length > 0) {
                skuQuery = (skuQuery as any).in('brand_id', allowedBrandIds);
            }

            const { data: skuData, error: skuError } = await skuQuery;
            if (skuError) throw skuError;

            const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode ?? 'MH';

            const [priceRes, offerRes] = await Promise.all([
                // Authoritative SOT for pricing: State specific table
                supabase
                    .from('cat_price_state_mh')
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
                          .select('vehicle_color_id, offer_amount, inclusion_type, is_active, tat_days, tat_source')
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
                    hsnCode?: string;
                    gstRate?: number;
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
                const selectedRtoTotal = getRtoTotalForDefaultType(row);
                const insuranceTotal = getNetInsuranceTotal(row);
                const exShowroomTotal = Number(row.ex_showroom) || 0;
                const onRoadTotal = Number(row.on_road_price) || exShowroomTotal + selectedRtoTotal + insuranceTotal;
                priceMap.set(skuId, {
                    price: exShowroomTotal,
                    exFactory: Number(row.ex_showroom_basic) || 0,
                    exFactoryGst: Number(row.ex_showroom_gst_amount) || 0,
                    rto: selectedRtoTotal,
                    rto_data: {
                        STATE: {
                            total: Number(row.rto_total_state || 0),
                            registrationCharges: Number(row.rto_registration_fee_state || 0),
                            smartCardCharges: Number(row.rto_smartcard_charges_state || 0),
                            postalCharges: Number(row.rto_postal_charges_state || 0),
                            hypothecationCharges: 0,
                            roadTax: Number(row.rto_roadtax_amount_state || 0),
                            roadTaxRate: Number(row.rto_roadtax_rate_state || 0),
                            cessAmount: Number(row.rto_roadtaxcessamount_state || 0),
                            cessRate: Number(row.rto_roadtaxcess_rate_state || 0),
                        },
                        BH: {
                            total: Number(row.rto_total_bh || 0),
                            registrationCharges: Number(row.rto_registration_fee_bh || 0),
                            smartCardCharges: Number(row.rto_smartcard_charges_bh || 0),
                            postalCharges: Number(row.rto_postal_charges_bh || 0),
                            hypothecationCharges: 0,
                            roadTax: Number(row.rto_roadtax_amount_bh || 0),
                            roadTaxRate: Number(row.rto_roadtax_rate_bh || 0),
                            cessAmount: Number(row.rto_roadtaxcessamount_bh || 0),
                            cessRate: Number(row.rto_roadtaxcess_rate_bh || 0),
                        },
                        COMPANY: {
                            total: Number(row.rto_total_company || 0),
                            registrationCharges: Number(row.rto_registration_fee_company || 0),
                            smartCardCharges: Number(row.rto_smartcard_charges_company || 0),
                            postalCharges: Number(row.rto_postal_charges_company || 0),
                            hypothecationCharges: 0,
                            roadTax: Number(row.rto_roadtax_amount_company || 0),
                            roadTaxRate: Number(row.rto_roadtax_rate_company || 0),
                            cessAmount: Number(row.rto_roadtaxcessamount_company || 0),
                            cessRate: Number(row.rto_roadtaxcess_rate_company || 0),
                        },
                        default: row.rto_default_type || 'STATE',
                    },
                    insurance: insuranceTotal,
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
                            base_total: getNetInsuranceTotal(row),
                            gst_rate: Number(row.ins_gst_rate || 18),
                            od: { base: odBase, gst: Math.max(0, odGst), total: Number(row.ins_od_total || 0) },
                            tp: { base: tpBase, gst: Math.max(0, tpGst), total: Number(row.ins_tp_total || 0) },
                            addons,
                        };
                    })(),
                    onRoad: onRoadTotal,
                    district: 'ALL',
                    publishedAt: row.published_at,
                    publishStage: row.publish_stage || 'DRAFT',
                    updatedAt: row.updated_at,
                    isPopular: row.is_popular || false,
                    updatedByName: row.published_by ? publisherNameMap.get(row.published_by) || undefined : undefined,
                    hsnCode: row.hsn_code,
                    gstRate: Number(row.gst_rate) || undefined,
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

            const tatMap = new Map<string, { days: number | null; source: string }>();
            offerData?.forEach((o: any) => {
                tatMap.set(o.vehicle_color_id, {
                    days: o.tat_days ?? null,
                    source: o.tat_source || 'MANUAL',
                });
            });

            const formattedSkus: SKUPriceRow[] = (skuData || []).map((sku: any) => {
                const model = sku.model;
                const variant = sku.vehicle_variant || sku.accessory_variant || sku.service_variant;
                const brand = model?.brand;
                const productType = sku.sku_type || model?.product_type || 'VEHICLE';

                const priceRecord = priceMap.get(sku.id);
                const statePrice = priceRecord?.price;
                const pricingRule = (offerData || []).find((o: any) => o.vehicle_color_id === sku.id);
                const stateOffer = normalizeOfferDelta(Number(pricingRule?.offer_amount ?? offerMap.get(sku.id) ?? -1));
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

                // --- SMART METADATA RESOLUTION ---
                const rawName = sku.name || '';
                let resolvedColor = sku.color_name;
                let resolvedFinish = sku.finish || '';
                let resolvedHex = sku.hex_primary;

                // 1. Resolve Color Name if missing
                if (!resolvedColor) {
                    const parts = rawName.split(' - ');
                    resolvedColor = parts.length > 1 ? parts[parts.length - 1] : rawName;
                    // Clean up: Remove model/brand prefixes if they leaked into the last part
                    if (model?.name && resolvedColor.toLowerCase().includes(model.name.toLowerCase())) {
                        resolvedColor = resolvedColor.replace(new RegExp(`${model.name}\\s?`, 'i'), '').trim();
                        if (resolvedColor.startsWith('-')) resolvedColor = resolvedColor.substring(1).trim();
                    }
                }

                // 2. Resolve Finish if missing
                if (!resolvedFinish) {
                    const upper = rawName.toUpperCase();
                    if (upper.includes('MATTE') || upper.includes('MAT ')) resolvedFinish = 'MATTE';
                    else if (upper.includes('METALLIC')) resolvedFinish = 'METALLIC';
                    else if (upper.includes('PEARL')) resolvedFinish = 'PEARL';
                    else if (upper.includes('GLOSS')) resolvedFinish = 'GLOSS';
                }

                // 3. Resolve Hex if missing (High-Fidelity Mappings)
                if (!resolvedHex) {
                    const lower = (resolvedColor || '').toLowerCase();
                    if (lower.includes('red')) resolvedHex = '#B22234';
                    else if (lower.includes('blue')) resolvedHex = '#1E40AF';
                    else if (lower.includes('black')) resolvedHex = '#1C1C1C';
                    else if (lower.includes('white')) resolvedHex = '#F5F5F0';
                    else if (lower.includes('gray') || lower.includes('grey')) resolvedHex = '#4B5563';
                    else if (lower.includes('silver')) resolvedHex = '#94A3B8';
                    else if (lower.includes('yellow')) resolvedHex = '#FBBF24';
                    else if (lower.includes('green')) resolvedHex = '#15803D';
                    else if (lower.includes('titanium')) resolvedHex = '#64748B';
                    else if (lower.includes('gold')) resolvedHex = '#D4AF37';
                }

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
                    color: resolvedColor || rawName,
                    finish: resolvedFinish,
                    hex_primary: resolvedHex,
                    hex_secondary: sku.hex_secondary,
                    engineCc: variant?.displacement || 0,
                    suitableFor: '',
                    exShowroom: finalPrice,
                    exFactory: priceRecord?.exFactory || 0,
                    exFactoryGst: priceRecord?.exFactoryGst || 0,
                    hsnCode: priceRecord?.hsnCode || model?.hsn_code || '',
                    gstRate:
                        priceRecord?.gstRate ||
                        model?.item_tax_rate ||
                        (Number(variant?.displacement || 0) > 350 ? 40 : 18),
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
                    tatDaysInput: tatMap.get(sku.id)?.days ?? null,
                    tatSource: tatMap.get(sku.id)?.source || 'MANUAL',
                    originalTatDaysInput: tatMap.get(sku.id)?.days ?? null,
                };
            });

            formattedSkus.sort(
                (a, b) =>
                    a.brand.localeCompare(b.brand) ||
                    a.model.localeCompare(b.model) ||
                    (a.variantPosition || 0) - (b.variantPosition || 0) ||
                    (a.position || 0) - (b.position || 0) ||
                    a.color.localeCompare(b.color)
            );

            setSkus(formattedSkus);
        } catch (error: unknown) {
            console.error('Error fetching data:', error);
            const message = getErrorMessage(error) || 'Failed to load pricing data';
            setLoadError(message);
            toast.error(message);
        } finally {
            setLoading(false);
            setHasUnsavedChanges(false);
        }
    };

    const syncPricingSnapshotForSku = useCallback(
        async (skuId: string, stateCode: string) => {
            const { data } = await supabase
                .from('cat_price_state_mh')
                .select(
                    `
                    sku_id,
                    ex_showroom,
                    on_road_price,
                    rto_default_type,
                    rto_total_state, rto_total_bh, rto_total_company,
                    ins_od_base:ins_own_damage_premium_amount, ins_od_total:ins_own_damage_total_amount,
                    ins_tp_base:ins_liability_only_premium_amount, ins_tp_total:ins_liability_only_total_amount,
                    ins_sum_mandatory_insurance, ins_sum_mandatory_insurance_gst_amount,
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
            const selectedRtoTotal = getRtoTotalForDefaultType(d);
            const insuranceTotal = getNetInsuranceTotal(d);
            const exShowroomTotal = Number(d.ex_showroom || 0);
            const onRoadTotal = Number(d.on_road_price || 0) || exShowroomTotal + selectedRtoTotal + insuranceTotal;
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
                              rto: selectedRtoTotal,
                              insurance: insuranceTotal,
                              onRoad: onRoadTotal,
                              rto_data: {
                                  STATE: {
                                      total: Number(d.rto_total_state || 0),
                                      registrationCharges: Number(d.rto_registration_fee_state || 0),
                                      smartCardCharges: Number(d.rto_smartcard_charges_state || 0),
                                      postalCharges: Number(d.rto_postal_charges_state || 0),
                                      hypothecationCharges: 0,
                                      roadTax: Number(d.rto_roadtax_amount_state || 0),
                                      roadTaxRate: Number(d.rto_roadtax_rate_state || 0),
                                      cessAmount: Number(d.rto_roadtaxcessamount_state || 0),
                                      cessRate: Number(d.rto_roadtaxcess_rate_state || 0),
                                  },
                                  BH: {
                                      total: Number(d.rto_total_bh || 0),
                                      registrationCharges: Number(d.rto_registration_fee_bh || 0),
                                      smartCardCharges: Number(d.rto_smartcard_charges_bh || 0),
                                      postalCharges: Number(d.rto_postal_charges_bh || 0),
                                      hypothecationCharges: 0,
                                      roadTax: Number(d.rto_roadtax_amount_bh || 0),
                                      roadTaxRate: Number(d.rto_roadtax_rate_bh || 0),
                                      cessAmount: Number(d.rto_roadtaxcessamount_bh || 0),
                                      cessRate: Number(d.rto_roadtaxcess_rate_bh || 0),
                                  },
                                  COMPANY: {
                                      total: Number(d.rto_total_company || 0),
                                      registrationCharges: Number(d.rto_registration_fee_company || 0),
                                      smartCardCharges: Number(d.rto_smartcard_charges_company || 0),
                                      postalCharges: Number(d.rto_postal_charges_company || 0),
                                      hypothecationCharges: 0,
                                      roadTax: Number(d.rto_roadtax_amount_company || 0),
                                      roadTaxRate: Number(d.rto_roadtax_rate_company || 0),
                                      cessAmount: Number(d.rto_roadtaxcessamount_company || 0),
                                      cessRate: Number(d.rto_roadtaxcess_rate_company || 0),
                                  },
                                  default: d.rto_default_type || 'STATE',
                              },
                              insurance_data: {
                                  base_total: insuranceTotal,
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
                notifyPriceEngineFailure('Price engine failed. Please retry.');
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
                        notifyPriceEngineFailure('Realtime price calculation failed');
                        return;
                    }
                    if (realtimeCalcSeqRef.current[skuId] !== seq) return;
                    await syncPricingSnapshotForSku(skuId, activeStateCode);
                } catch (err) {
                    console.error('[Pricing Realtime] Unexpected failure:', err);
                    notifyPriceEngineFailure('Realtime price calculation failed');
                } finally {
                    delete realtimeCalcTimersRef.current[skuId];
                }
            }, 600);
        },
        [selectedStateId, states, tenantSlug, syncPricingSnapshotForSku]
    );

    const handleUpdatePrice = (skuId: string, price: number) => {
        const safePrice = Number.isFinite(price) && price > 0 ? Math.round(price) : 0;
        setSkus(prev =>
            prev.map(s => {
                if (s.id === skuId) {
                    const gstRate = s.gstRate || 18;
                    const exFactory = Math.round(safePrice / (1 + gstRate / 100));
                    const exFactoryGst = safePrice - exFactory;
                    return { ...s, exShowroom: safePrice, exFactory, exFactoryGst };
                }
                return s;
            })
        );
        scheduleRealtimePriceEngine(skuId, safePrice);
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateOffer = (skuId: string, offer: number) => {
        if (tenantSlug === 'aums') return;
        const normalized = normalizeOfferDelta(offer);
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, offerAmount: normalized } : s)));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateInclusion = (skuId: string, type: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') => {
        if (tenantSlug === 'aums') return;
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

    const handleUpdateTat = (skuId: string, payload: { days: number | null; hours: number | null }) => {
        setSkus(prev =>
            prev.map(s =>
                s.id === skuId
                    ? { ...s, tatDaysInput: payload.days, tatHoursInput: payload.hours, tatSource: 'MANUAL' }
                    : s
            )
        );
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleBackfill = async () => {
        if (tenantSlug !== 'aums') return;
        const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode;
        if (!activeStateCode) return;

        const skusToBackfill = skus.filter(
            s => s.exShowroom > 0 && (Number(s.rto || 0) === 0 || Number(s.insurance || 0) === 0)
        );

        if (skusToBackfill.length === 0) {
            alert('No SKUs found with missing calculations and non-zero price.');
            return;
        }

        setLoading(true);
        try {
            const inputs = skusToBackfill.map(s => ({ skuId: s.id, exShowroom: s.exShowroom }));
            const success = await runPriceEngineCalculation(inputs, activeStateCode);
            if (success) {
                alert(`Successfully backfilled ${skusToBackfill.length} SKUs.`);
            } else {
                alert('Backfill failed for some SKUs. Please check logs.');
            }
        } catch (err) {
            console.error('Backfill Error:', err);
            alert('Unexpected error during backfill.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpdate = (ids: string[], price: number) => {
        const safePrice = Number.isFinite(price) && price > 0 ? Math.round(price) : 0;
        setSkus(prev =>
            prev.map(s => {
                if (!ids.includes(s.id)) return s;
                const gstRate = s.gstRate || 18;
                const exFactory = Math.round(safePrice / (1 + gstRate / 100));
                const exFactoryGst = safePrice - exFactory;
                return { ...s, exShowroom: safePrice, exFactory, exFactoryGst };
            })
        );
        ids.forEach(id => scheduleRealtimePriceEngine(id, safePrice));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleSaveAll = async () => {
        if (isSaving) {
            saveQueuedRef.current = true;
            setSaveQueued(true);
            return;
        }
        const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode;
        if (!activeStateCode) return;

        const isAums = tenantSlug === 'aums';
        setIsSaving(true);

        try {
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
                        const msg = 'Price engine calculation failed for one or more edited SKUs. Save aborted.';
                        toast.error(msg);
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

                        // Auto-promote: DRAFT + valid price being saved → LIVE automatically
                        const isDraftAutopromote =
                            (!s.publishStage || s.publishStage === 'DRAFT') &&
                            exShowroomSafe > 0 &&
                            s.exShowroom !== s.originalExShowroom;
                        const resolvedStage = isDraftAutopromote ? 'LIVE' : s.publishStage || 'DRAFT';

                        return {
                            vehicle_color_id: s.id,
                            state_code: activeStateCode,
                            district: 'ALL',
                            ex_showroom_price: exShowroomSafe,
                            is_active: true,
                            is_popular: s.isPopular || false,
                            publish_stage: resolvedStage,
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
                    toast.error(`Failed to save changes: ${result.error}`);
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
                    setLastSavedAt(Date.now());
                    toast.success('Pricing changes saved');
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
                if (!tenantId) {
                    toast.error('Dealer context missing (tenant not resolved). Reload and try again.');
                    return;
                }
                const changedDealerRows = skus.filter(
                    s =>
                        s.offerAmount !== s.originalOfferAmount ||
                        s.inclusionType !== s.originalInclusionType ||
                        s.localIsActive !== s.originalLocalIsActive ||
                        s.isPopular !== s.originalIsPopular ||
                        s.tatDaysInput !== s.originalTatDaysInput
                );

                const offerPayload = changedDealerRows.map(s => ({
                    tenant_id: tenantId,
                    vehicle_color_id: s.id,
                    state_code: activeStateCode,
                    offer_amount: normalizeOfferDelta(s.offerAmount),
                    inclusion_type: s.inclusionType,
                    is_active: s.localIsActive,
                    tat_days: s.tatDaysInput ?? 0,
                    tat_source: s.tatSource || 'MANUAL',
                }));

                if (offerPayload.length === 0) {
                    setHasUnsavedChanges(false);
                    setLastSavedAt(Date.now());
                    return;
                }

                let saveError: unknown = null;
                const vehicleRows = changedDealerRows.filter(s => String(s.category || '').toUpperCase() === 'VEHICLE');
                const nonVehicleRows = changedDealerRows.filter(
                    s => String(s.category || '').toUpperCase() !== 'VEHICLE'
                );

                if (vehicleRows.length > 0) {
                    const missingOnRoadRows = vehicleRows.filter(s => Number(s.onRoad || 0) <= 0);
                    if (missingOnRoadRows.length > 0) {
                        toast.error(
                            `Cannot save ${missingOnRoadRows.length} vehicle offer(s): on-road price not published by AUMS.`
                        );
                        return;
                    }

                    const vehicleSaveResults = await Promise.all(
                        vehicleRows.map(s =>
                            supabase.rpc('set_dealer_offer_on_road', {
                                p_tenant_id: tenantId,
                                p_vehicle_color_id: s.id,
                                p_state_code: activeStateCode,
                                p_offer_on_road: Math.round(Number(s.onRoad || 0) + Number(s.offerAmount || 0)),
                                p_inclusion_type: s.inclusionType || 'OPTIONAL',
                                p_is_active: s.localIsActive,
                            })
                        )
                    );
                    const vehicleRpcError = vehicleSaveResults.find(r => r.error)?.error;
                    if (vehicleRpcError) {
                        saveError = vehicleRpcError;
                    }

                    // Keep TAT updates intact until set_dealer_offer_on_road supports TAT payload.
                    if (!saveError) {
                        const tatChangedRows = vehicleRows.filter(s => s.tatDaysInput !== s.originalTatDaysInput);
                        if (tatChangedRows.length > 0) {
                            const tatPayload = tatChangedRows.map(s => ({
                                tenant_id: tenantId,
                                vehicle_color_id: s.id,
                                state_code: activeStateCode,
                                offer_amount: normalizeOfferDelta(s.offerAmount),
                                inclusion_type: s.inclusionType,
                                is_active: s.localIsActive,
                                tat_days: s.tatDaysInput ?? 0,
                                tat_source: s.tatSource || 'MANUAL',
                            }));
                            const { error: tatRpcError } = await supabase.rpc('upsert_dealer_offers', {
                                offers: tatPayload,
                            });
                            if (tatRpcError) saveError = tatRpcError;
                        }
                    }
                }

                if (!saveError && nonVehicleRows.length > 0) {
                    const nonVehiclePayload = nonVehicleRows.map(s => ({
                        tenant_id: tenantId,
                        vehicle_color_id: s.id,
                        state_code: activeStateCode,
                        offer_amount: normalizeOfferDelta(s.offerAmount),
                        inclusion_type: s.inclusionType,
                        is_active: s.localIsActive,
                        tat_days: s.tatDaysInput ?? 0,
                        tat_source: s.tatSource || 'MANUAL',
                    }));
                    const { error: nonVehicleRpcError } = await supabase.rpc('upsert_dealer_offers', {
                        offers: nonVehiclePayload,
                    });
                    if (nonVehicleRpcError) {
                        saveError = nonVehicleRpcError;
                    }
                }

                if (saveError) {
                    toast.error(`Failed to save changes: ${getErrorMessage(saveError)}`);
                } else {
                    setHasUnsavedChanges(false);
                    setSkus(prev =>
                        prev.map(s => ({
                            ...s,
                            originalExShowroom: s.exShowroom,
                            originalOfferAmount: s.offerAmount,
                            originalInclusionType: s.inclusionType,
                            originalStatus: s.status,
                            originalLocalIsActive: s.localIsActive,
                            originalIsPopular: s.isPopular,
                            originalTatDaysInput: s.tatDaysInput ?? null,
                        }))
                    );
                    setLastSavedAt(Date.now());
                    toast.success('Dealer offers saved');
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
        } finally {
            setIsSaving(false);
            if (saveQueuedRef.current) {
                saveQueuedRef.current = false;
                setSaveQueued(false);
                if (hasUnsavedChanges) {
                    setTimeout(() => handleSaveAll(), 0);
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
        const isPipeline = (s: SKUPriceRow) => !isMarketReady(s);

        if (quickFilter === 'market_ready') return baseFiltered.filter(isMarketReady);
        if (quickFilter === 'pipeline') return baseFiltered.filter(isPipeline);
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-6 overflow-auto transition-colors duration-500">
            {/* Category Gate */}
            <AnimatePresence mode="wait">
                {isHydrated && isGateVisible && (
                    <CategoryGate
                        onSelect={id => {
                            setSelectedCategory(id || 'ALL');
                            setIsGateVisible(false);
                            // Also update URL manually to trigger sync
                            const params = new URLSearchParams(window.location.search);
                            if (id) params.set('category', id);
                            else params.delete('category');
                            window.history.replaceState({}, '', `?${params.toString()}`);
                        }}
                    />
                )}
            </AnimatePresence>

            <PricingHeader
                selectedCategory={selectedCategory}
                onOpenGate={() => setIsGateVisible(true)}
                skus={skus}
                tenantSlug={tenantSlug}
                hasUnsavedChanges={hasUnsavedChanges}
                fetchSKUsAndPrices={fetchSKUsAndPrices}
                isSaving={isSaving}
                saveQueued={saveQueued}
                lastSavedAt={lastSavedAt}
                tableSummary={tableSummary}
                liveSkus={
                    skus.filter(s =>
                        tenantSlug === 'aums'
                            ? s.displayState === 'Live' || s.displayState === 'Published'
                            : s.localIsActive === true
                    ).length
                }
                draftSkus={
                    skus.filter(
                        s =>
                            !(tenantSlug === 'aums'
                                ? s.displayState === 'Live' || s.displayState === 'Published'
                                : s.localIsActive === true)
                    ).length
                }
                missingPrices={skus.filter(s => s.exShowroom === 0).length}
                quickFilter={quickFilter}
                onToggleQuickFilter={toggleQuickFilter}
                activeRuleObj={states.find(s => s.id === selectedStateId)}
                loadError={loadError}
                handleBackfill={handleBackfill}
            />

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
                            onUpdateTat={handleUpdateTat}
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
                            isSaving={isSaving}
                            onSummaryChange={setTableSummary}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function CategoryGate({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6"
        >
            <div className="max-w-6xl w-full space-y-12">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center"
                    >
                        <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                Commercial Pricing Portal
                            </span>
                        </div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic"
                    >
                        Select <span className="text-emerald-500">Domain</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-slate-400 text-sm font-bold uppercase tracking-widest"
                    >
                        Choose a ledger category to manage regional pricing and taxes
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            id: 'VEHICLE',
                            label: 'Vehicles',
                            icon: Car,
                            desc: 'On-Road Pricing, RTO & Insurance',
                            color: 'text-blue-500',
                            bg: 'bg-blue-500/10',
                            border: 'hover:border-blue-500/50',
                        },
                        {
                            id: 'ACCESSORY',
                            label: 'Accessories',
                            icon: Package,
                            desc: 'MRP & Global Catalog Pricing',
                            color: 'text-emerald-500',
                            bg: 'bg-emerald-500/10',
                            border: 'hover:border-emerald-500/50',
                        },
                        {
                            id: 'SERVICE',
                            label: 'Services',
                            icon: Wrench,
                            desc: 'Labor Charges & Maintenance Plans',
                            color: 'text-amber-500',
                            bg: 'bg-amber-500/10',
                            border: 'hover:border-amber-500/50',
                        },
                    ].map((cat, idx) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            onClick={() => onSelect(cat.id)}
                            className={`group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 ${cat.border} cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:bg-white/10 flex flex-col items-center text-center gap-6`}
                        >
                            <div
                                className={`w-20 h-20 rounded-3xl ${cat.bg} flex items-center justify-center transition-transform duration-500 group-hover:rotate-12`}
                            >
                                <cat.icon size={40} className={cat.color} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                                    {cat.label}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                    {cat.desc}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 px-6 py-2 rounded-full bg-white text-slate-900 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                <span className="text-[10px] font-black uppercase tracking-widest">Enter Ledger</span>
                                <ExternalLink size={12} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function PricingHeader({
    selectedCategory,
    onOpenGate,
    skus,
    tenantSlug,
    hasUnsavedChanges,
    fetchSKUsAndPrices,
    isSaving,
    saveQueued,
    lastSavedAt,
    tableSummary,
    liveSkus,
    draftSkus,
    missingPrices,
    quickFilter,
    onToggleQuickFilter,
    activeRuleObj,
    loadError,
    handleBackfill,
}: any) {
    const totalValue = tableSummary.value;
    const formattedValue = totalValue >= 1000 ? formatCurrencyCompact(totalValue) : `₹${totalValue.toLocaleString()}`;

    return (
        <>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left relative z-10 mb-4">
                <div className="space-y-1 text-left">
                    <div className="flex items-center gap-3">
                        <span
                            onClick={onOpenGate}
                            className="px-2 py-0.5 bg-emerald-100 text-[8px] font-black text-emerald-600 uppercase tracking-widest rounded-full cursor-pointer hover:bg-emerald-200 transition-colors flex items-center gap-1"
                        >
                            <Layers size={8} />
                            {selectedCategory === 'ACCESSORY'
                                ? 'Product Catalog'
                                : selectedCategory === 'SERVICE'
                                  ? 'Service Registry'
                                  : 'Regulatory Ledger'}
                            <span className="opacity-40 ml-1 italic">(Change)</span>
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        {selectedCategory === 'ACCESSORY' ? (
                            <>
                                Accessory <span className="text-emerald-600">Pricing</span>
                            </>
                        ) : selectedCategory === 'SERVICE' ? (
                            <>
                                Service <span className="text-amber-500">Registry</span>
                            </>
                        ) : (
                            <>
                                On-Road <span className="text-emerald-600">Pricing</span>
                            </>
                        )}
                    </h1>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    {loadError && (
                        <button
                            onClick={fetchSKUsAndPrices}
                            className="group flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl transition-all duration-300 shadow-xl active:scale-95"
                            title={loadError}
                        >
                            <RefreshCw size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Retry Load</span>
                        </button>
                    )}

                    <div
                        className={`flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-lg transition-all duration-300 border ${hasUnsavedChanges ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200 scale-100' : 'opacity-0 scale-95 border-transparent'}`}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="uppercase tracking-widest font-black text-xs text-left">Unsaved Changes</span>
                    </div>
                    {isSaving && (
                        <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                            <Loader2 size={12} className="animate-spin" />
                            <span className="uppercase tracking-widest">Saving...</span>
                        </div>
                    )}
                    {!isSaving && saveQueued && (
                        <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                            <Save size={12} />
                            <span className="uppercase tracking-widest">Save Queued</span>
                        </div>
                    )}
                    {!isSaving && !hasUnsavedChanges && lastSavedAt && (
                        <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="uppercase tracking-widest">Saved</span>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Grid - Compacted */}
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 mb-4">
                {/* Brands/SKUs (Indigo) */}
                <div
                    onClick={() => onToggleQuickFilter('inventory')}
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
                            {tableSummary.count}
                        </div>
                        <div className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                            Filtered SKUs
                        </div>
                    </div>
                </div>

                {/* Live SKUs (Emerald) */}
                <div
                    onClick={() => onToggleQuickFilter('market_ready')}
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
                            {liveSkus}
                        </div>
                        <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                            Active Status
                        </div>
                    </div>
                </div>

                {/* Draft/New (Amber) */}
                <div
                    onClick={() => onToggleQuickFilter('pipeline')}
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
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pipeline</span>
                    </div>
                    <div className="text-left">
                        <div className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                            {draftSkus}
                        </div>
                        <div className="text-[8px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                            Pending Sync
                        </div>
                    </div>
                </div>

                {/* Missing Price (Rose) */}
                <div
                    onClick={() => onToggleQuickFilter('critical')}
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
                            {missingPrices}
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
                            {formattedValue}
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
                            {activeRuleObj?.stateCode || '--'}
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                            {activeRuleObj?.ruleName || 'Unknown Region'}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
