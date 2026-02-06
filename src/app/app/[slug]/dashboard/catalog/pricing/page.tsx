'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { publishPrices } from '@/actions/publishPrices';
import { savePrices } from '@/actions/savePrices';

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
    publishStage?: string; // AUMS: publish_stage from cat_price_state
    originalPublishStage?: string; // For diff detection
    insurance_data?: any;
}

export default function PricingPage() {
    const supabase = createClient();
    const { tenantId, tenantSlug } = useTenant();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [states, setStates] = useState<RegistrationRule[]>([]);
    // Read initial filter values from URL (persist on reload)
    const [selectedStateId, setSelectedStateId] = useState<string>(searchParams.get('state') || '');
    const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get('brand') || 'ALL');
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'ALL');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>(searchParams.get('subCategory') || 'ALL');
    const [selectedModel, setSelectedModel] = useState<string>(searchParams.get('model') || 'ALL');
    const [selectedVariant, setSelectedVariant] = useState<string>(searchParams.get('variant') || 'ALL');
    const [skus, setSkus] = useState<SKUPriceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastEditTime, setLastEditTime] = useState<number | null>(null);
    const [tableSummary, setTableSummary] = useState<{ count: number; value: number }>({ count: 0, value: 0 });
    const [isPublishing, setIsPublishing] = useState(false);

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
            if (error.message) console.error('Fetch Rules Message:', error.message);
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
            setSelectedStateId(mappedRules[0].id);
        }
    };

    const fetchSKUsAndPrices = async () => {
        setLoading(true);
        try {
            const { data: skuData, error: skuError } = await supabase
                .from('cat_items')
                .select(
                    `
                    id, name, slug, specs, price_base, parent_id, inclusion_type, status, position,
                    parent:parent_id (
                        id,
                        name,
                        specs,
                        position,
                        parent:parent_id (
                            id,
                            name,
                            price_base,
                            specs,
                            template:cat_templates(category, name),
                            brand:cat_brands(id, name, logo_svg)
                        )
                    )
                `
                )
                .eq('type', 'SKU')
                .order('position', { ascending: true, nullsFirst: false });

            if (skuError) throw skuError;

            const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode ?? 'MH';
            const [priceRes, offerRes, stockRes] = await Promise.all([
                supabase
                    .from('cat_price_state')
                    .select(
                        'vehicle_color_id, ex_showroom_price, rto_total, rto, insurance_total, insurance, on_road_price, updated_at, district, published_at, publish_stage'
                    )
                    .eq('state_code', activeStateCode)
                    .eq('is_active', true)
                    .or('district.is.null,district.eq.ALL'),
                tenantSlug !== 'aums'
                    ? supabase
                          .from('cat_price_dealer')
                          .select('vehicle_color_id, offer_amount, inclusion_type, is_active')
                          .eq('state_code', activeStateCode)
                          .eq('tenant_id', tenantId)
                    : Promise.resolve({ data: [] as any, error: null as any }),
                Promise.resolve({ data: [] as any, error: null as any }),
            ]);

            const { data: priceData, error: priceError } = priceRes;
            if (priceError) throw priceError;

            const { data: offerData, error: offerError } = offerRes as any;
            if (offerError) console.error('Offer Fetch Error:', offerError);

            const { data: stockData, error: stockError } = stockRes;
            if (stockError) console.error('Stock Fetch Error:', stockError);

            const priceMap = new Map<
                string,
                {
                    price: number;
                    rto: number;
                    rto_data?: any;
                    insurance: number;
                    insurance_data?: any;
                    onRoad: number;
                    district?: string | null;
                    publishedAt?: string;
                    publishStage?: string;
                    updatedAt?: string;
                }
            >();
            priceData?.forEach((p: any) => {
                const district = (p.district || '').toString().toUpperCase();
                const existing = priceMap.get(p.vehicle_color_id);
                if (!existing || district === 'ALL' || (existing.district || '').toUpperCase() !== 'ALL') {
                    priceMap.set(p.vehicle_color_id, {
                        price: p.ex_showroom_price || 0,
                        rto: p.rto_total || 0,
                        rto_data: p.rto,
                        insurance: p.insurance_total || 0,
                        insurance_data: p.insurance,
                        onRoad: p.on_road_price || p.ex_showroom_price || 0,
                        district: p.district,
                        publishedAt: p.published_at,
                        publishStage: p.publish_stage || 'DRAFT',
                        updatedAt: p.updated_at,
                    });
                }
            });

            const offerMap = new Map();
            offerData?.forEach((o: any) => {
                offerMap.set(o.vehicle_color_id, o.offer_amount);
            });

            const activeMap = new Map();
            offerData?.forEach((o: any) => {
                activeMap.set(o.vehicle_color_id, o.is_active);
            });

            const { data: brandDeltas, error: deltaError } = await supabase
                .from('cat_regional_configs')
                .select('brand_id, delta_percentage')
                .eq('state_code', activeStateCode);

            const brandDeltaMap = new Map();
            brandDeltas?.forEach(d => brandDeltaMap.set(d.brand_id, d.delta_percentage));

            const formattedSkus: SKUPriceRow[] = (skuData || []).map((sku: any) => {
                const variant = Array.isArray(sku.parent) ? sku.parent[0] : sku.parent;
                const family = variant ? (Array.isArray(variant.parent) ? variant.parent[0] : variant.parent) : null;
                const brand = family ? (Array.isArray(family.brand) ? family.brand[0] : family.brand) : null;
                // Template is at family (grandparent) level, not sku
                const familyTemplate = family
                    ? Array.isArray(family.template)
                        ? family.template[0]
                        : family.template
                    : null;

                const statePrice = priceMap.get(sku.id)?.price;
                const pricingRule = (offerData || []).find((o: any) => o.vehicle_color_id === sku.id);
                const stateOffer = pricingRule?.offer_amount || offerMap.get(sku.id) || 0;
                const stateInclusion = pricingRule?.inclusion_type || sku.inclusion_type || 'OPTIONAL';
                const localIsActive = activeMap.has(sku.id) ? activeMap.get(sku.id) : false;

                const basePrice = sku.price_base || family?.price_base || 0;
                const brandDelta = brandDeltaMap.get(brand?.id) || 0;

                const priceRecord = priceMap.get(sku.id);
                const publishedAt = priceRecord?.publishedAt;
                const updatedAt = priceRecord?.updatedAt;
                const publishStage = priceRecord?.publishStage || 'DRAFT';
                const resolvedStatus = sku.status || 'INACTIVE';
                let displayState: SKUPriceRow['displayState'] = 'Draft';
                if (tenantSlug !== 'aums') {
                    displayState = resolvedStatus === 'ACTIVE' && localIsActive ? 'Live' : 'Inactive';
                } else {
                    // AUMS uses publish_stage from cat_price_state, not sku.status from cat_items
                    if (publishStage === 'PUBLISHED') displayState = 'Published';
                    else if (publishStage === 'UNDER_REVIEW') displayState = 'In Review';
                    else if (publishStage === 'LIVE') displayState = 'Live';
                    else if (publishStage === 'INACTIVE') displayState = 'Inactive';
                    else displayState = 'Draft'; // Default for DRAFT or null
                }

                const finalPrice =
                    statePrice !== undefined
                        ? statePrice
                        : Math.round(Number(basePrice) * (1 + Number(brandDelta) / 100));

                const finalInclusionType = stateInclusion as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';

                // Determine item type from template category
                let itemType: 'vehicles' | 'accessories' | 'service' = 'vehicles';
                const tempCat = familyTemplate?.category?.toUpperCase();

                if (tempCat === 'ACCESSORY') itemType = 'accessories';
                else if (tempCat === 'SERVICE') itemType = 'service';

                const categoryLabel =
                    familyTemplate?.category ||
                    (itemType === 'vehicles' ? 'VEHICLE' : itemType === 'accessories' ? 'ACCESSORY' : 'SERVICE');
                const subCategoryLabel = familyTemplate?.name || 'General';

                return {
                    id: sku.id,
                    brand: brand?.name || (itemType === 'vehicles' ? 'UNKNOWN' : 'GENERAL'),
                    brandId: brand?.id,
                    brandLogo: brand?.logo_svg,
                    category: categoryLabel,
                    subCategory: subCategoryLabel,
                    model: family?.name || sku.name || 'UNKNOWN',
                    modelId: family?.id,
                    variant: variant?.name || '',
                    color:
                        sku.specs?.color ||
                        (variant?.name ? sku.name.replace(new RegExp(`^${variant.name}\\s*`, 'i'), '') : sku.name),
                    engineCc: parseInt(sku.specs?.engine_cc || family?.specs?.engine_cc || '0'),
                    suitableFor: sku.specs?.suitable_for || '',
                    exShowroom: finalPrice,
                    offerAmount: stateOffer,
                    inclusionType: finalInclusionType,
                    type: itemType,
                    originalExShowroom: finalPrice,
                    originalOfferAmount: stateOffer,
                    originalInclusionType: finalInclusionType,
                    stockCount: 0,
                    status: sku.status || 'INACTIVE',
                    originalStatus: sku.status || 'INACTIVE',
                    localIsActive: localIsActive,
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
                };
            });

            formattedSkus.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

            // RPC removed - all pricing data now comes from cat_price_state table (Published SOT)

            setSkus(formattedSkus);
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setHasUnsavedChanges(false);
        }
    };

    const handleUpdatePrice = (skuId: string, price: number) => {
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, exShowroom: price } : s)));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateOffer = (skuId: string, offer: number) => {
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, offerAmount: offer } : s)));
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

    // AUMS: Update publish_stage in cat_price_state
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
                          publishStage: stage,
                          displayState: displayStateMap[stage] || 'Draft',
                      }
                    : s
            )
        );
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateLocalStatus = (skuId: string, isActive: boolean) => {
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, localIsActive: isActive } : s)));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleBulkUpdate = (ids: string[], price: number) => {
        setSkus(prev => prev.map(s => (ids.includes(s.id) ? { ...s, exShowroom: price } : s)));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleSaveAll = async () => {
        const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode;
        if (!activeStateCode) return;

        const isAums = tenantSlug === 'aums';

        if (isAums) {
            const pricePayload = skus.map(s => ({
                vehicle_color_id: s.id,
                state_code: activeStateCode,
                district: 'ALL',
                ex_showroom_price: s.exShowroom,
                is_active: true,
                // Include publish_stage if it was modified
                ...(s.publishStage !== s.originalPublishStage && { publish_stage: s.publishStage }),
            }));

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
                    }))
                );
            }
        } else {
            const offerPayload = skus.map(s => ({
                tenant_id: tenantId,
                vehicle_color_id: s.id,
                state_code: activeStateCode,
                offer_amount: s.offerAmount,
                inclusion_type: s.inclusionType,
                is_active: s.localIsActive,
            }));

            const { error } = await supabase.rpc('upsert_dealer_offers', { offers: offerPayload });

            if (error) {
                alert(`Failed to save changes: ${error.message}`);
            } else {
                setHasUnsavedChanges(false);
                setSkus(prev =>
                    prev.map(s => ({
                        ...s,
                        originalExShowroom: s.exShowroom,
                        originalOfferAmount: s.offerAmount,
                        originalStatus: s.status,
                    }))
                );
            }
        }
    };

    // AUMS-only: Calculate RTO/Insurance for SELECTED SKUs only
    const handleCalculate = async (selectedIds: string[]) => {
        if (tenantSlug !== 'aums') return;

        const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode;
        if (!activeStateCode) {
            alert('Please select a state first');
            return;
        }

        // Filter to only selected SKUs with valid ex-showroom prices
        const vehicleSkuIds = skus.filter(s => selectedIds.includes(s.id) && s.exShowroom > 0).map(s => s.id);

        if (vehicleSkuIds.length === 0) {
            alert('No valid SKUs selected. Please select SKUs with prices first.');
            return;
        }

        setIsPublishing(true);
        try {
            const result = await publishPrices(vehicleSkuIds, activeStateCode);

            if (result.success) {
                const publishedIds = result.results
                    .filter(r => r.success)
                    .map(r => r.skuId)
                    .join(', ');
                alert(
                    `Calculated ${result.totalPublished} SKUs. RTO and Insurance values updated.\n\nSKU IDs: ${publishedIds}`
                );
                // AUMS: Force publish_stage to UNDER_REVIEW for recalculated SKUs (manual publish required)
                setSkus(prev =>
                    prev.map(s =>
                        selectedIds.includes(s.id)
                            ? {
                                  ...s,
                                  publishStage: 'UNDER_REVIEW',
                                  originalPublishStage: 'UNDER_REVIEW',
                                  displayState: 'In Review',
                              }
                            : s
                    )
                );
                // Refresh data to show updated RTO/Insurance
                await fetchSKUsAndPrices();
            } else {
                alert(`Calculate failed: ${result.errors.join(', ')}`);
            }
        } catch (err) {
            alert(`Calculate error: ${String(err)}`);
        } finally {
            setIsPublishing(false);
        }
    };

    const { uniqueBrands, uniqueCategories, uniqueSubCategories, uniqueModels, uniqueVariants } = useMemo(() => {
        const bMap = new Set<string>();
        const cMap = new Set<string>();
        const scMap = new Set<string>();
        const mMap = new Set<string>();
        const vMap = new Set<string>();

        skus.forEach(s => {
            if (s.brand) bMap.add(s.brand);
            if (s.category) cMap.add(s.category);
            const matchesBrand = selectedBrand === 'ALL' || s.brand === selectedBrand;
            const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
            if (matchesBrand && matchesCategory && s.subCategory) {
                scMap.add(s.subCategory);
            }
            const matchesSubCategory = selectedSubCategory === 'ALL' || s.subCategory === selectedSubCategory;
            if (matchesBrand && matchesCategory && matchesSubCategory && s.model) {
                mMap.add(s.model);
            }
            const matchesModel = selectedModel === 'ALL' || s.model === selectedModel;
            if (matchesBrand && matchesCategory && matchesSubCategory && matchesModel && s.variant) {
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
        return skus.filter(s => {
            const matchesBrand = selectedBrand === 'ALL' || s.brand === selectedBrand;
            const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
            const matchesSubCategory = selectedSubCategory === 'ALL' || s.subCategory === selectedSubCategory;
            const matchesModel = selectedModel === 'ALL' || s.model === selectedModel;
            const matchesVariant = selectedVariant === 'ALL' || s.variant === selectedVariant;
            return matchesBrand && matchesCategory && matchesSubCategory && matchesModel && matchesVariant;
        });
    }, [skus, selectedBrand, selectedCategory, selectedSubCategory, selectedModel, selectedVariant]);

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
            totalValue >= 10000000
                ? `₹${(totalValue / 10000000).toFixed(2)} Cr`
                : totalValue >= 100000
                  ? `₹${(totalValue / 100000).toFixed(2)} L`
                  : `₹${totalValue.toLocaleString()}`;

        return (
            <div className="max-w-[1600px] mx-auto space-y-12 mb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 text-left">
                    <div className="space-y-2 text-left">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest rounded-full">
                                Regulatory Ledger
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            On-Road <span className="text-emerald-600">Pricing</span>
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

                {/* KPI Grid - Expanded to 6 items to match Studio */}
                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
                    {/* Brands/SKUs (Indigo) */}
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Package size={64} className="text-indigo-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-left">
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                <Package size={20} className="fill-current" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Inventory
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {loading ? '-' : tableSummary.count}
                            </div>
                            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                                Filtered SKUs
                            </div>
                        </div>
                    </div>

                    {/* Live SKUs (Emerald) */}
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={64} className="text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-left">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                <TrendingUp size={20} className="fill-current" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Market Ready
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {loading ? '-' : liveSkus}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                                Active Status
                            </div>
                        </div>
                    </div>

                    {/* Draft/New (Amber) */}
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={64} className="text-amber-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-left">
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                <Zap size={20} className="fill-current" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Pipeline
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {loading ? '-' : draftSkus}
                            </div>
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                                Pending Sync
                            </div>
                        </div>
                    </div>

                    {/* Missing Price (Rose) */}
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target size={64} className="text-rose-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-left">
                            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                                <Target size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Critical Fix
                            </span>
                        </div>
                        <div className="text-left">
                            <div
                                className={`text-4xl font-black uppercase italic tracking-tighter ${missingPrices > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}
                            >
                                {loading ? '-' : missingPrices}
                            </div>
                            <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">
                                Zero Price SKU
                            </div>
                        </div>
                    </div>

                    {/* Inventory Value (Blue) - REPLACED Unsaved Data */}
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles size={64} className="text-blue-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-left">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <Sparkles size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Inventory Value
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter overflow-hidden text-ellipsis whitespace-nowrap">
                                {loading ? '-' : formattedValue}
                            </div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                                Sum Ex-Showroom
                            </div>
                        </div>
                    </div>

                    {/* Market (Slate) */}
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Landmark size={64} className="text-slate-400" />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-left">
                            <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
                                <Landmark size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Current Market
                            </span>
                        </div>
                        <div className="text-left">
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {loading ? '-' : activeRuleObj?.stateCode || '--'}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                {activeRuleObj?.ruleName || 'Unknown Region'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 lg:p-12 overflow-auto transition-colors duration-500">
            {renderHeader()}

            <div className="max-w-[1600px] mx-auto">
                <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-100/50 dark:shadow-none overflow-hidden min-h-[600px] relative">
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
                            activeRule={activeRule}
                            onUpdatePrice={handleUpdatePrice}
                            onUpdateOffer={handleUpdateOffer}
                            onUpdateInclusion={handleUpdateInclusion}
                            onUpdateStatus={handleUpdateStatus}
                            onUpdatePublishStage={handleUpdatePublishStage}
                            onUpdateLocalStatus={handleUpdateLocalStatus}
                            onBulkUpdate={handleBulkUpdate}
                            onSaveAll={handleSaveAll}
                            onCalculate={handleCalculate}
                            isCalculating={isPublishing}
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
