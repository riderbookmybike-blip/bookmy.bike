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
    exShowroom: number;
    originalExShowroom?: number;
    hsnCode?: string;
    gstRate?: number;
    updatedAt?: string;
    brandLogo?: string;
    stockCount?: number;
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
        const { data } = await supabase
            .from('registration_rules')
            .select('*')
            .eq('status', 'ACTIVE')
            .order('state_code');

        if (data && data.length > 0) {
            // Transform DB rows to RegistrationRule type if needed, but the schema matches mostly
            const mappedRules = data.map((r: any) => ({
                ...r,
                displayId: r.display_id,
                ruleName: `${r.rule_name} (${r.state_code})`,
                stateCode: r.state_code,
                vehicleType: r.vehicle_type
            }));
            setStates(mappedRules);
            setSelectedStateId(mappedRules[0].id);
        }
    };

    const fetchBrands = async () => {
        const { data } = await supabase
            .from('brands')
            .select('id, name, logo_svg')
            .eq('is_active', true)
            .order('name');

        if (data) {
            setBrands(data.map((b: any) => b.name));
        }
    };

    const fetchSKUsAndPrices = async () => {
        setLoading(true);
        try {
            // 1. Fetch SKUs from Unified Catalog
            // SKU -> Variant (Parent) -> Family (Grandparent)
            const { data: skuData, error: skuError } = await supabase
                .from('catalog_items')
                .select(`
                    id,
                    name,
                    specs,
                    price_base,
                    parent:parent_id (
                        id,
                        name,
                        parent:parent_id (
                            id,
                            name,
                            price_base,
                            brand:brands(id, name, logo_svg)
                        )
                    )
                `)
                .eq('type', 'SKU');

            if (skuError) throw skuError;

            // 2. Fetch Existing Prices for State
            const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode || 'MH';
            const [priceRes, stockRes] = await Promise.all([
                supabase
                    .from('vehicle_prices')
                    .select('vehicle_color_id, ex_showroom_price, updated_at')
                    .eq('state_code', activeStateCode),
                supabase
                    .from('vehicle_inventory')
                    .select('sku_id, status')
                    .eq('status', 'AVAILABLE')
            ]);

            const { data: priceData, error: priceError } = priceRes;
            if (priceError) throw priceError;

            const { data: stockData } = stockRes;

            const stockMap = new Map();
            stockData?.forEach((s: any) => {
                stockMap.set(s.sku_id, (stockMap.get(s.sku_id) || 0) + 1);
            });

            // 3. Fetch Brand Regional Deltas for this state
            const { data: brandDeltas } = await supabase
                .from('brand_regional_configs')
                .select('brand_id, delta_percentage')
                .eq('state_code', activeStateCode);

            const brandDeltaMap = new Map();
            brandDeltas?.forEach(d => brandDeltaMap.set(d.brand_id, d.delta_percentage));

            const priceMap = new Map();
            priceData?.forEach((p: any) => priceMap.set(p.vehicle_color_id, p.ex_showroom_price));

            let formattedSkus: SKUPriceRow[] = (skuData || []).map((sku: any) => {
                const variant = sku.parent;
                const family = variant?.parent;
                const brand = family?.brand;

                // Priority: State Price > (Base Price * (1 + Brand Delta %)) > 0
                const statePrice = priceMap.get(sku.id);
                const basePrice = (sku.price_base || family?.price_base || 0);
                const brandDelta = brandDeltaMap.get(brand?.id) || 0;

                const finalPrice = statePrice !== undefined
                    ? statePrice
                    : Math.round(basePrice * (1 + brandDelta / 100));

                return {
                    id: sku.id,
                    brand: brand?.name || 'UNKNOWN',
                    brandId: brand?.id,
                    brandLogo: brand?.logo_svg,
                    model: family?.name || 'UNKNOWN',
                    modelId: family?.id,
                    variant: variant?.name || 'UNKNOWN',
                    color: sku.name,
                    engineCc: parseInt(sku.specs?.engine_cc || family?.specs?.engine_cc || '110'),
                    exShowroom: finalPrice,
                    originalExShowroom: basePrice,
                    stockCount: stockMap.get(sku.id) || 0
                };
            });

            // Filter by Brand if needed
            if (selectedBrand !== 'ALL') {
                formattedSkus = formattedSkus.filter(s => s.brand === selectedBrand);
            }

            // Client-side sort
            formattedSkus.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

            setSkus(formattedSkus);
        } catch (error) {
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

    const handleBulkUpdate = (ids: string[], price: number) => {
        setSkus(prev => prev.map(s => ids.includes(s.id) ? { ...s, exShowroom: price } : s));
        setHasUnsavedChanges(true);
        setLastEditTime(Date.now());
    };

    const handleSaveAll = async () => {
        const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode;
        if (!activeStateCode) return;

        // Prepare Upsert Payload
        // We only upsert rows that match the current state.
        // Optimization: In a real app, track 'dirty' rows only. For now, bulk upserting visible rows is fine for <1000 items.
        // Actually, let's filter for dirty if possible, but we don't track original efficiently here.
        // We will simple upsert all for the active state to ensure consistency.

        const payload = skus.map(s => ({
            vehicle_color_id: s.id,
            state_code: activeStateCode,
            ex_showroom_price: s.exShowroom,
            updated_at: new Date().toISOString()
        }));

        // Use RPC to bypass RLS and handle bulk upsert securely
        const { error } = await supabase.rpc('upsert_vehicle_prices_bypass', {
            prices: payload
        });

        if (error) {
            alert(`Failed to save prices: ${error.message} (${error.details || ''})`);
            console.error('Save Error:', error);
        } else {
            setHasUnsavedChanges(false);
        }
    };

    const activeRule = states.find(s => s.id === selectedStateId) || MOCK_REGISTRATION_RULES[0];

    // ... Rendering ...
    // ... Rendering ...
    const renderHeader = () => {
        // Calculate dynamic metrics
        const missingPrices = skus.filter(s => s.exShowroom === 0).length;
        const pendingSaves = hasUnsavedChanges ? skus.filter(s => s.exShowroom !== s.originalExShowroom).length : 0;
        const activeState = states.find(s => s.id === selectedStateId)?.stateCode || '--';

        return (
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 sticky top-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                            <Landmark size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                                On-Road Pricing
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Regulatory Ledger
                            </p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden lg:block" />

                    {/* Page KPIs */}
                    <div className="hidden xl:flex items-center gap-3">
                        <KPIItem
                            label="Tracked SKUs"
                            value={skus.length}
                            icon={Package}
                            description="Total unique color/variant combinations in this state"
                            color="indigo"
                        />
                        <KPIItem
                            label="Pending Saves"
                            value={pendingSaves}
                            icon={Save}
                            description="SKUs modified in current session awaiting commit"
                            color={pendingSaves > 0 ? 'amber' : 'slate'}
                            trend={pendingSaves > 0 ? { value: 'Dirty', positive: false } : undefined}
                        />
                        <KPIItem
                            label="Missing Prices"
                            value={missingPrices}
                            icon={Target}
                            description="SKUs requiring ex-showroom price definition"
                            color={missingPrices > 0 ? 'rose' : 'emerald'}
                        />
                        <KPIItem
                            label="Active Region"
                            value={activeState}
                            icon={Activity}
                            description="Currently selected region for regulatory computation"
                            color="blue"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Brand Performance Shortcut */}
                    <a
                        href={`/app/${tenantSlug}/dashboard/catalog/pricing/brands`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-[11px] font-black uppercase text-slate-500 transition-all border border-slate-100 dark:border-white/5"
                    >
                        <TrendingUp size={14} className="text-pink-500" />
                        Configure Brand Performance Deltas
                    </a>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

                    {/* Unsaved Changes Indicator */}
                    <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${hasUnsavedChanges ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'opacity-0'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        UNSAVED CHANGES
                    </div>
                </div>
            </div>
        );
    };

    const renderControlBar = () => (
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
            {/* Left: Filters */}
            <div className="flex items-center gap-3">
                {/* State Selector */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Landmark size={14} className="text-slate-400" />
                    </div>
                    <select
                        value={selectedStateId}
                        onChange={(e) => setSelectedStateId(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
                    >
                        {states.map(s => (
                            <option key={s.id} value={s.id}>{s.stateCode} - {s.ruleName}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-slate-400" />
                    </div>
                </div>

                {/* Brand Selector */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Car size={14} className="text-slate-400" />
                    </div>
                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
                    >
                        <option value="ALL">All Brands</option>
                        {brands.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-slate-400" />
                    </div>
                </div>
            </div>

            {/* Right: Metrics Pills & Save Action */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 hidden md:flex">
                    <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                        <Car size={14} className="text-blue-500" />
                        <div className="flex flex-col leading-none">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Tracked SKUs</span>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{skus.length}</span>
                        </div>
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-white/10 hidden md:block" />

                <button
                    onClick={handleSaveAll}
                    disabled={!hasUnsavedChanges}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95 ${hasUnsavedChanges
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                        }`}
                >
                    <Save size={14} /> Save Changes
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
            {renderHeader()}
            {renderControlBar()}

            <div className="flex-1 overflow-hidden px-4 pt-4">
                <DetailPanel
                    title="Pricing Matrix"
                    hideHeader={true}
                    // tabs prop removed to hide tab switcher
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
                                onBulkUpdate={handleBulkUpdate}
                                onSaveAll={handleSaveAll}
                                states={states}
                                selectedStateId={selectedStateId}
                                onStateChange={setSelectedStateId}
                                brands={brands}
                                selectedBrand={selectedBrand}
                                onBrandChange={setSelectedBrand}
                            />
                        )
                    )}
                />
            </div>
        </div>
    );
}
