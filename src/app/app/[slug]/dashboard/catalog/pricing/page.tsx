'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import DetailPanel from '@/components/templates/DetailPanel';
import ContextSidePanel from '@/components/templates/ContextSidePanel';
import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';
import { RegistrationRule } from '@/types/registration';
import PricingLedgerTable from '@/components/modules/products/PricingLedgerTable';
import { Landmark, Filter, ShieldCheck, FileCheck, Layers, Car, Zap, Loader2, Save, ExternalLink, Activity, Target, ClipboardCheck, Package, TrendingUp } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';
import { KPIItem } from '@/components/layout/KPIBar';

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
    status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'; // Added Status
    originalStatus: 'ACTIVE' | 'INACTIVE' | 'DRAFT'; // For Diff
    localIsActive: boolean; // Dealer Local Status
    originalLocalIsActive: boolean; // For Diff
}

export default function PricingPage() {
    const supabase = createClient();
    const { tenantId, tenantSlug } = useTenant();
    const [states, setStates] = useState<RegistrationRule[]>([]);
    const [selectedStateId, setSelectedStateId] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
    const [skus, setSkus] = useState<SKUPriceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<string[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastEditTime, setLastEditTime] = useState<number | null>(null);

    // Initial Load - Fetch Brands and Rules
    useEffect(() => {
        const init = async () => {
            await fetchBrands();
            await fetchRules();
        };
        init();
    }, []);

    // Fetch Data when Filters Change
    useEffect(() => {
        if (selectedStateId) {
            fetchSKUsAndPrices();
        }
    }, [selectedStateId, selectedBrand]);

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
            // Transform DB rows to RegistrationRule type if needed, but the schema matches mostly
            const mappedRules = data.map((r: any) => ({
                ...r,
                displayId: r.display_id,
                ruleName: r.rule_name, // Simplified: already contains "State (Code)" usually, or we can format here
                stateCode: r.state_code,
                vehicleType: r.vehicle_type
            }));
            setStates(mappedRules);
            setSelectedStateId(mappedRules[0].id);
        }
    };

    const fetchBrands = async () => {
        const { data, error } = await supabase
            .from('cat_brands')
            .select('id, name, logo_svg')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Fetch Brands Error:', error);
            if (error.message) console.error('Fetch Brands Message:', error.message);
            return;
        }

        if (data) {
            setBrands(data.map((b: any) => b.name));
        }
    };

    const fetchSKUsAndPrices = async () => {
        setLoading(true);
        try {
            // 1. Fetch SKUs from Unified Catalog
            const { data: skuData, error: skuError } = await supabase
                .from('cat_items')
                .select(`
                    id, name, slug, specs, price_base, template_id, parent_id, inclusion_type, status,
                    template:cat_templates(category, name),
                    parent:parent_id (
                        id,
                        name,
                        specs,
                        parent:parent_id (
                            id,
                            name,
                            price_base,
                            specs,
                            brand:cat_brands(id, name, logo_svg)
                        )
                    )
                `)
                .eq('type', 'SKU');

            if (skuError) throw skuError;

            // 2. Fetch Base Prices (Global/State-level)
            const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode || 'MH';
            const [priceRes, offerRes, stockRes] = await Promise.all([
                supabase
                    .from('vehicle_prices')
                    .select('vehicle_color_id, ex_showroom_price, updated_at')
                    .eq('state_code', activeStateCode),
                // Fetch Dealer Specific Offers
                tenantSlug !== 'aums' ? supabase
                    .from('id_dealer_pricing_rules')
                    .select('vehicle_color_id, offer_amount, inclusion_type, is_active')
                    .eq('state_code', activeStateCode)
                    .eq('tenant_id', tenantId) : Promise.resolve({ data: [] as any, error: null as any }),
                // Temporarily disabling stock fetch as table seems to be missing
                Promise.resolve({ data: [] as any, error: null as any })
            ]);

            const { data: priceData, error: priceError } = priceRes;
            if (priceError) throw priceError;

            const { data: offerData, error: offerError } = offerRes as any;
            if (offerError) console.error('Offer Fetch Error:', offerError);

            const { data: stockData, error: stockError } = stockRes;
            if (stockError) console.error('Stock Fetch Error:', stockError);

            const stockMap = new Map();
            stockData?.forEach((s: any) => {
                stockMap.set(s.sku_id, (stockMap.get(s.sku_id) || 0) + 1);
            });

            const priceMap = new Map();
            priceData?.forEach((p: any) => {
                priceMap.set(p.vehicle_color_id, p.ex_showroom_price);
            });

            const offerMap = new Map();
            offerData?.forEach((o: any) => {
                offerMap.set(o.vehicle_color_id, o.offer_amount);
            });

            // Map Dealer Status
            const activeMap = new Map();
            offerData?.forEach((o: any) => {
                activeMap.set(o.vehicle_color_id, o.is_active);
            });

            // 3. Fetch Brand Regional Deltas
            const { data: brandDeltas, error: deltaError } = await supabase
                .from('cat_regional_configs')
                .select('brand_id, delta_percentage')
                .eq('state_code', activeStateCode);

            if (deltaError) {
                console.error('Delta Fetch Error:', deltaError);
                if (deltaError.message) console.error('Delta Fetch Message:', deltaError.message);
                if (deltaError.details) console.error('Delta Fetch Details:', deltaError.details);
            }

            const brandDeltaMap = new Map();
            brandDeltas?.forEach(d => brandDeltaMap.set(d.brand_id, d.delta_percentage));

            let formattedSkus: SKUPriceRow[] = (skuData || []).map((sku: any) => {
                // Supabase joins can sometimes return arrays depending on FK definitions
                const skuTemplate = Array.isArray(sku.template) ? sku.template[0] : sku.template;
                const variant = Array.isArray(sku.parent) ? sku.parent[0] : sku.parent;
                const family = variant ? (Array.isArray(variant.parent) ? variant.parent[0] : variant.parent) : null;
                const brand = family ? (Array.isArray(family.brand) ? family.brand[0] : family.brand) : null;

                // Price Priority: Explicit State Price > Rule-based Calculation
                const statePrice = priceMap.get(sku.id);
                const pricingRule = (offerData || []).find((o: any) => o.vehicle_color_id === sku.id);
                // Offer: Explicit Dealer Offer > 0
                const stateOffer = pricingRule?.offer_amount || offerMap.get(sku.id) || 0;
                const stateInclusion = pricingRule?.inclusion_type || sku.inclusion_type || 'OPTIONAL';
                // Local Status: Default false (Opt-in) if not found
                const localIsActive = activeMap.has(sku.id) ? activeMap.get(sku.id) : false;

                const basePrice = (sku.price_base || family?.price_base || 0);
                const brandDelta = brandDeltaMap.get(brand?.id) || 0;

                const finalPrice = statePrice !== undefined
                    ? statePrice
                    : Math.round(Number(basePrice) * (1 + Number(brandDelta) / 100));

                const finalInclusionType = stateInclusion as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';

                // Better type identification: Template Category > Defaults
                let itemType: 'vehicles' | 'accessories' | 'service' = 'vehicles';
                const tempCat = skuTemplate?.category?.toUpperCase();

                if (tempCat === 'ACCESSORY') itemType = 'accessories';
                else if (tempCat === 'SERVICE') itemType = 'service';
                else if (sku.specs?.type?.toLowerCase() === 'accessories') itemType = 'accessories';
                else if (sku.specs?.type?.toLowerCase() === 'service') itemType = 'service';

                const categoryLabel = itemType === 'vehicles' ? 'Vehicle' : (itemType === 'accessories' ? 'Accessory' : 'Service');
                const subCategoryLabel = skuTemplate?.name || 'General';

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
                    // Clean Color Name: Remove Variant Name from SKU Name if present
                    color: (sku.specs?.color) || (variant?.name ? sku.name.replace(new RegExp(`^${variant.name}\\s*`, 'i'), '') : sku.name),
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
                    status: sku.status || 'INACTIVE', // Default to INACTIVE if null
                    originalStatus: sku.status || 'INACTIVE',
                    localIsActive: localIsActive,
                    originalLocalIsActive: localIsActive
                };
            });

            if (selectedBrand !== 'ALL') {
                formattedSkus = formattedSkus.filter(s => s.brand === selectedBrand);
            }

            formattedSkus.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
            setSkus(formattedSkus);
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setHasUnsavedChanges(false);
        }
    };

    const handleUpdatePrice = (skuId: string, price: number) => {
        setSkus(prev => prev.map(s => s.id === skuId ? { ...s, exShowroom: price } : s));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateOffer = (skuId: string, offer: number) => {
        setSkus(prev => prev.map(s => s.id === skuId ? { ...s, offerAmount: offer } : s));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateInclusion = (skuId: string, type: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') => {
        setSkus(prev => prev.map(s => s.id === skuId ? { ...s, inclusionType: type } : s));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateStatus = (skuId: string, status: 'ACTIVE' | 'INACTIVE') => {
        setSkus(prev => prev.map(s => s.id === skuId ? { ...s, status: status } : s));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleUpdateLocalStatus = (skuId: string, isActive: boolean) => {
        setSkus(prev => prev.map(s => s.id === skuId ? { ...s, localIsActive: isActive } : s));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleBulkUpdate = (ids: string[], price: number) => {
        setSkus(prev => prev.map(s => ids.includes(s.id) ? { ...s, exShowroom: price } : s));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleSaveAll = async () => {
        const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode;
        if (!activeStateCode) return;

        // SEPARATE LOGIC:
        // AUMS -> Saves Base Prices (vehicle_prices) AND Status (cat_items)
        // DEALERS -> Saves Offers (id_dealer_pricing_rules)

        const isAums = tenantSlug === 'aums';
        const updates: Promise<any>[] = [];

        if (isAums) {
            // 1. Save Prices
            const pricePayload = skus.map(s => ({
                vehicle_color_id: s.id,
                state_code: activeStateCode,
                ex_showroom_price: s.exShowroom,
                updated_at: new Date().toISOString()
            }));

            updates.push(Promise.resolve(supabase.rpc('upsert_vehicle_prices_bypass', { prices: pricePayload })));

            // 2. Save Status Changes (Only if changed)
            const modifiedStatusSkus = skus.filter(s => s.status !== s.originalStatus);
            if (modifiedStatusSkus.length > 0) {
                const statusUpdates = modifiedStatusSkus.map(async (sku) => {
                    return supabase.from('cat_items').update({ status: sku.status }).eq('id', sku.id);
                });
                updates.push(...statusUpdates);
                // Future Notification Hook:
                // const newlyActive = modifiedStatusSkus.filter(s => s.status === 'ACTIVE' && s.originalStatus !== 'ACTIVE');
                // notifyDealers(newlyActive);
            }
        } else {
            // Dealer Logic
            const offerPayload = skus.map(s => ({
                tenant_id: tenantId,
                vehicle_color_id: s.id,
                state_code: activeStateCode,
                offer_amount: s.offerAmount,
                inclusion_type: s.inclusionType,
                is_active: s.localIsActive // Persist Local Status
            }));

            // Use the New Dealer RPC
            updates.push(Promise.resolve(supabase.rpc('upsert_dealer_offers', { offers: offerPayload })));
        }

        const results = await Promise.all(updates);
        const hasErrors = results.some(r => r.error);

        if (hasErrors) {
            const errorMsg = results.find(r => r.error)?.error.message || 'Unknown error';
            alert(`Failed to save changes: ${errorMsg}`);
            console.error('Save Errors:', results);
        } else {
            setHasUnsavedChanges(false);
            // Refresh to confirm sync and update originalStatus
            // Ideally we should just update ref here to avoid re-fetch flickers
            setSkus(prev => prev.map(s => ({ ...s, originalExShowroom: s.exShowroom, originalOfferAmount: s.offerAmount, originalStatus: s.status })));
        }
    };

    const activeRule = states.find(s => s.id === selectedStateId) || MOCK_REGISTRATION_RULES[0];

    // ... Rendering ...
    // ... Rendering ...
    const renderHeader = () => {
        // Calculate dynamic metrics
        const missingPrices = skus.filter(s => s.exShowroom === 0).length;
        const pendingSaves = hasUnsavedChanges ? skus.filter(s => s.exShowroom !== s.originalExShowroom || s.offerAmount !== s.originalOfferAmount || s.inclusionType !== s.originalInclusionType || s.status !== s.originalStatus || s.localIsActive !== s.originalLocalIsActive).length : 0;
        const activeState = states.find(s => s.id === selectedStateId)?.stateCode || '--';

        return (
            <div className="relative flex justify-between items-center px-8 py-4 border-b-2 border-[#d4af37]/30 bg-gradient-to-br from-[#0a1628] via-[#1a2942] to-[#0a1628] sticky top-0 z-20 shadow-2xl">
                {/* Marble texture overlay */}
                <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0ibWFyYmxlIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMEwyMDAgMjAwTTIwMCAwTDAgMjAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjbWFyYmxlKSIvPjwvc3ZnPg==')] pointer-events-none" />

                <div className="flex items-center gap-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative p-2.5 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8941f] shadow-lg shadow-[#d4af37]/20">
                            <Landmark size={22} strokeWidth={2.5} className="text-[#0a1628] drop-shadow-md" />
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/10 to-transparent" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-white tracking-tight leading-none mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                                On-Road Pricing
                            </h2>
                            <p className="text-[10px] font-semibold text-[#d4af37] uppercase tracking-[0.15em] flex items-center gap-2 opacity-80">
                                <span className="w-6 h-px bg-[#d4af37]" />
                                Regulatory Ledger
                                <span className="w-6 h-px bg-[#d4af37]" />
                            </p>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-[#d4af37]/30 to-transparent hidden lg:block" />

                    {/* Premium KPI Cards - COMPACT */}
                    <div className="hidden xl:flex items-center gap-3">
                        {/* Tracked SKUs */}
                        <div className="group relative px-4 py-2.5 rounded-lg bg-gradient-to-br from-[#1a2942]/60 to-[#0a1628]/60 border border-[#d4af37]/30 hover:border-[#d4af37]/60 transition-all duration-300 backdrop-blur-sm">
                            <div className="flex items-center gap-2.5 relative z-10">
                                <Package size={16} className="text-[#d4af37]/80" />
                                <div>
                                    <div className="text-[9px] font-bold text-[#f4e4c1]/70 uppercase tracking-tight">SKUs</div>
                                    <div className="text-lg font-bold text-white tabular-nums font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>{skus.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Pending Saves */}
                        <div className={`group relative px-4 py-2.5 rounded-lg transition-all duration-300 backdrop-blur-sm ${pendingSaves > 0 ? 'bg-gradient-to-br from-[#d4af37]/15 to-[#b8941f]/05 border border-[#d4af37] shadow-lg shadow-[#d4af37]/10' : 'bg-gradient-to-br from-[#1a2942]/60 to-[#0a1628]/60 border border-[#d4af37]/20'}`}>
                            <div className="flex items-center gap-2.5 relative z-10">
                                <Save size={16} className={pendingSaves > 0 ? 'text-[#d4af37]' : 'text-[#d4af37]/40'} />
                                <div>
                                    <div className="text-[9px] font-bold text-[#f4e4c1]/70 uppercase tracking-tight">Pending</div>
                                    <div className={`text-lg font-bold tabular-nums font-serif ${pendingSaves > 0 ? 'text-[#d4af37]' : 'text-white/40'}`} style={{ fontFamily: 'Playfair Display, serif' }}>{pendingSaves}</div>
                                </div>
                            </div>
                        </div>

                        {/* Missing Prices */}
                        <div className={`group relative px-4 py-2.5 rounded-lg transition-all duration-300 backdrop-blur-sm ${missingPrices > 0 ? 'bg-gradient-to-br from-red-900/20 to-red-950/10 border border-red-500/40' : 'bg-gradient-to-br from-emerald-900/20 to-emerald-950/10 border border-emerald-500/40'}`}>
                            <div className="flex items-center gap-2.5 relative z-10">
                                <Target size={16} className={missingPrices > 0 ? 'text-red-400/80' : 'text-emerald-400/80'} />
                                <div>
                                    <div className="text-[9px] font-bold text-[#f4e4c1]/70 uppercase tracking-tight">Missing</div>
                                    <div className={`text-lg font-bold tabular-nums font-serif ${missingPrices > 0 ? 'text-red-400/80' : 'text-emerald-400/80'}`} style={{ fontFamily: 'Playfair Display, serif' }}>{missingPrices}</div>
                                </div>
                            </div>
                        </div>

                        {/* Active Region */}
                        <div className="group relative px-4 py-2.5 rounded-lg bg-gradient-to-br from-[#1a2942]/60 to-[#0a1628]/60 border border-[#d4af37]/30 hover:border-[#d4af37]/60 transition-all duration-300 backdrop-blur-sm">
                            <div className="flex items-center gap-2.5 relative z-10">
                                <Activity size={16} className="text-[#d4af37]/80" />
                                <div>
                                    <div className="text-[9px] font-bold text-[#f4e4c1]/70 uppercase tracking-tight">Region</div>
                                    <div className="text-lg font-bold text-white tabular-nums font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>{activeState}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    {/* Premium Unsaved Changes Indicator */}
                    <div className={`flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-lg transition-all duration-300 border ${hasUnsavedChanges ? 'bg-gradient-to-r from-[#d4af37]/15 to-[#b8941f]/05 text-[#d4af37] border-[#d4af37]/60 shadow-lg shadow-[#d4af37]/20 scale-100' : 'opacity-0 scale-95 border-transparent'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                        <span className="uppercase tracking-[0.1em] font-semibold">Unsaved Changes</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
            {renderHeader()}

            <div className="flex-1 overflow-hidden px-4 pt-4">
                <DetailPanel
                    title="Pricing Matrix"
                    hideHeader={true}
                    showTabs={false}
                    renderContent={() => (
                        loading ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Ledger...</span>
                                </div>
                            </div>
                        ) : (
                            <PricingLedgerTable
                                initialSkus={skus}
                                activeRule={activeRule}
                                onUpdatePrice={handleUpdatePrice}
                                onUpdateOffer={handleUpdateOffer}
                                onUpdateInclusion={handleUpdateInclusion}
                                onUpdateStatus={handleUpdateStatus}
                                onUpdateLocalStatus={handleUpdateLocalStatus}
                                onBulkUpdate={handleBulkUpdate}
                                onSaveAll={handleSaveAll}
                                states={states}
                                selectedStateId={selectedStateId}
                                onStateChange={setSelectedStateId}
                                brands={brands}
                                selectedBrand={selectedBrand}
                                onBrandChange={setSelectedBrand}
                                hasUnsavedChanges={hasUnsavedChanges}
                                isSaving={false} // Placeholder or add state if needed
                            />
                        )
                    )}
                />
            </div>
        </div>
    );
}
