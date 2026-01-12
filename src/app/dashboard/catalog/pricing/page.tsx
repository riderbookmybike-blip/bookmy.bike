'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import DetailPanel from '@/components/templates/DetailPanel';
import ContextSidePanel from '@/components/templates/ContextSidePanel';
import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';
import { RegistrationRule } from '@/types/registration';
import PricingLedgerTable from '@/components/modules/products/PricingLedgerTable';
import { Landmark, Filter, ShieldCheck, FileCheck, Layers, Car, Zap, Loader2, Save } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';

interface SKUPriceRow {
    id: string; // vehicle_color_id
    brand: string;
    model: string;
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
    const [states, setStates] = useState<RegistrationRule[]>(MOCK_REGISTRATION_RULES);
    const [selectedStateId, setSelectedStateId] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

    const [skus, setSkus] = useState<SKUPriceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<string[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastEditTime, setLastEditTime] = useState<number | null>(null);

    // Initial Load
    useEffect(() => {
        if (MOCK_REGISTRATION_RULES.length > 0) {
            setSelectedStateId(MOCK_REGISTRATION_RULES[0].id);
        }
        fetchBrands();
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
            }, 5000); // 5 seconds of inactivity
            return () => clearTimeout(timer);
        }
    }, [lastEditTime, hasUnsavedChanges]);

    const fetchBrands = async () => {
        const { data } = await supabase.from('brands').select('name, logo_svg').eq('is_active', true).order('name');
        if (data) {
            setBrands(data.map((b: any) => b.name)); // Keeping state as string for now to avoid breaking existing logic, but we could upgrade this.
        }
    };

    const fetchSKUsAndPrices = async () => {
        setLoading(true);
        try {
            // 1. Fetch SKUs (Hierarchical)
            let query = supabase
                .from('vehicle_colors')
                .select(`
                    id,
                    name,
                    vehicle_variants!inner (
                        name,
                        base_price_ex_showroom,
                        vehicle_models!inner (
                            name,
                            brands!inner (name, logo_svg)
                        )
                    )
                `);

            if (selectedBrand !== 'ALL') {
                query = query.eq('vehicle_variants.vehicle_models.brands.name', selectedBrand);
            }

            const { data: skuData, error: skuError } = await query;
            if (skuError) throw skuError;

            // 2. Fetch Existing Prices for State
            const activeStateCode = states.find(s => s.id === selectedStateId)?.stateCode || 'MH';
            const [priceRes, stockRes] = await Promise.all([
                supabase
                    .from('vehicle_prices')
                    .select('vehicle_color_id, ex_showroom_price, updated_at')
                    .eq('state_code', activeStateCode),
                supabase
                    .rpc('get_stock_counts') // We'll create this RPC or use a manual count
            ]);

            // If RPC doesn't exist yet, we'll do a manual count fetch
            const { data: priceData, error: priceError } = priceRes;
            if (priceError) throw priceError;

            // Fetch stock counts manually for now
            const { data: stockData } = await supabase
                .from('vehicle_inventory')
                .select('sku_id, status')
                .eq('status', 'AVAILABLE');

            const stockMap = new Map();
            stockData?.forEach((s: any) => {
                stockMap.set(s.sku_id, (stockMap.get(s.sku_id) || 0) + 1);
            });

            // Map Prices
            const priceMap = new Map();
            priceData?.forEach((p: any) => priceMap.set(p.vehicle_color_id, p.ex_showroom_price));

            // Transform to Flat Row
            const formattedSkus: SKUPriceRow[] = (skuData || []).map((sku: any) => {
                const variant = sku.vehicle_variants;
                const model = variant.vehicle_models;
                const brand = model.brands;

                // Priority: State Price > Variant Base Price > 0
                const statePrice = priceMap.get(sku.id);
                const finalPrice = statePrice !== undefined ? statePrice : (variant.base_price_ex_showroom || 0);

                return {
                    id: sku.id,
                    brand: brand.name,
                    brandLogo: brand.logo_svg,
                    model: model.name,
                    variant: variant.name,
                    color: sku.name,
                    engineCc: 110, // Default for now as it wasn't in the fetch
                    exShowroom: finalPrice,
                    originalExShowroom: finalPrice, // Store original for diff
                    updatedAt: priceMap.get(sku.id) !== undefined ? priceData?.find((p: any) => p.vehicle_color_id === sku.id)?.updated_at : undefined,
                    stockCount: stockMap.get(sku.id) || 0
                };
            });

            // Client-side sort if needed
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

        const { error } = await supabase
            .from('vehicle_prices')
            .upsert(payload, { onConflict: 'vehicle_color_id,state_code' });

        if (error) {
            alert('Failed to save prices');
            console.error(error);
        } else {
            setHasUnsavedChanges(false);
        }
    };

    const activeRule = states.find(s => s.id === selectedStateId) || MOCK_REGISTRATION_RULES[0];

    // ... Rendering ...
    // ... Rendering ...
    const renderHeader = () => (
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                    <Landmark size={20} strokeWidth={2.5} />
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

            <div className="flex items-center gap-4">
                {/* Unsaved Changes Indicator */}
                <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${hasUnsavedChanges ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'opacity-0'}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    UNSAVED CHANGES
                </div>
            </div>
        </div>
    );

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
