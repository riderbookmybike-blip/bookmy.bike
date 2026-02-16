'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Loader2, Save, Filter, MapPin, Tag, AlertCircle, CheckCircle2, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

interface SKU {
    id: string;
    fullName: string;
    modelName: string;
    variantName: string;
    colorName: string;
    brandName: string;
    brandLogo?: string;
    exShowroom: number;
    offerAmount: number; // Current dealer offer (numeric value for calculations)
    inputOffer: string; // Controlled input value (allows '-' and empty states)
    rtoAmount: number;
    insuranceAmount: number;
    onRoadBase: number;
    hasRule: boolean;
    ruleId?: string;
    isActive: boolean;
    originalIsActive: boolean;
    isDirty?: boolean; // For UI tracking
    pricingReady?: boolean;
}

export const DealerPricelist = ({
    tenantId,
    defaultStateCode = 'MH',
}: {
    tenantId: string;
    defaultStateCode?: string;
}) => {
    const [skus, setSkus] = useState<SKU[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState('ALL');
    const [pricingDistrict, setPricingDistrict] = useState('');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

    const supabase = createClient();

    const fetchPricelist = async () => {
        setLoading(true);
        try {
            // 1. Fetch SKUs
            const { data: skuData, error: skuError } = await supabase
                .from('cat_items')
                .select(
                    `
                    id, 
                    name, 
                    specs,
                    price_base,
                    parent:cat_items!parent_id(
                        name, 
                        parent:cat_items!parent_id(
                            name, 
                            brand:cat_brands(name, logo_svg)
                        )
                    )
                `
                )
                .eq('type', 'SKU')
                .eq('status', 'ACTIVE');

            if (skuError) throw skuError;

            // 2. Fetch Rules
            const { data: rulesData, error: rulesError } = await supabase
                .from('cat_price_dealer')
                .select('id, vehicle_color_id, offer_amount, is_active')
                .eq('tenant_id', tenantId);

            if (rulesError) throw rulesError;

            // 3. Resolve Dealer District (for pricing RPC + district-specific prices)
            const { data: dealerData } = await supabase
                .from('id_tenants')
                .select('id, name, location, pincode')
                .eq('id', tenantId)
                .maybeSingle();
            const dealerDistrict = dealerData?.location || '';
            const displayDistrict = dealerDistrict || 'ALL';
            setPricingDistrict(displayDistrict);

            const skuIds = (skuData || []).map((item: any) => item.id).filter(Boolean);

            // 4. Fetch Base Prices from cat_skus_linear (Published SOT)
            const priceCol = `price_${defaultStateCode.toLowerCase()}`;
            const { data: linearRows } =
                skuIds.length > 0
                    ? await supabase.from('cat_skus_linear').select(`unit_json, ${priceCol}`).eq('status', 'ACTIVE')
                    : { data: [] as any[] };

            const ruleMap = new Map(rulesData?.map(r => [r.vehicle_color_id, r]));

            const priceMap = new Map<
                string,
                { price: number; rto: number; insurance: number; onRoad: number; district?: string | null }
            >();
            (linearRows || []).forEach((row: any) => {
                const pm = row[priceCol];
                const unitId = row.unit_json?.id;
                if (unitId && pm && skuIds.includes(unitId)) {
                    priceMap.set(unitId, {
                        price: Number(pm.ex_showroom) || 0,
                        rto: Number(pm.rto_total) || 0,
                        insurance: Number(pm.insurance_total) || 0,
                        onRoad: Number(pm.on_road_price) || Number(pm.ex_showroom) || 0,
                        district: 'ALL',
                    });
                }
            });

            const formatted: SKU[] = (skuData || []).map((item: any) => {
                const color = item.specs?.Color || item.name;
                const variant = item.parent?.name || '';
                const model = item.parent?.parent?.name || '';
                const brand = item.parent?.parent?.brand;

                const rule = ruleMap.get(item.id);
                const priceRecord = priceMap.get(item.id);
                const pricingReady = Boolean(priceRecord?.price || priceRecord?.onRoad);
                const statePrice = priceRecord?.price ?? item.price_base ?? 0;
                const rto = priceRecord?.rto || 0;
                const insurance = priceRecord?.insurance || 0;
                const onRoadBase = priceRecord?.onRoad || statePrice + rto + insurance;
                const currentOffer = rule ? (rule as any).offer_amount : 0;
                const isActive = rule ? Boolean((rule as any).is_active ?? true) : true;

                return {
                    id: item.id,
                    fullName: `${brand?.name} ${model} ${variant}`,
                    modelName: model,
                    variantName: variant,
                    colorName: color,
                    brandName: brand?.name || 'Unknown',
                    exShowroom: statePrice,
                    rtoAmount: rto,
                    insuranceAmount: insurance,
                    onRoadBase: onRoadBase,
                    offerAmount: currentOffer,
                    inputOffer: currentOffer !== 0 ? currentOffer.toString() : '',
                    hasRule: !!rule,
                    ruleId: rule?.id,
                    isActive,
                    originalIsActive: isActive,
                    isDirty: false,
                    pricingReady,
                };
            });

            setSkus(formatted);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load pricelist');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) fetchPricelist();
    }, [tenantId]);

    const handleUpdateOffer = (skuId: string, newValue: string) => {
        setSkus(prev =>
            prev.map(s => {
                if (s.id !== skuId) return s;

                // Allow '-' or empty string to be visually represented
                // But keep the numeric value as 0 for calculations until valid
                const numericValue = newValue === '' || newValue === '-' ? 0 : Number(newValue);

                return {
                    ...s,
                    inputOffer: newValue,
                    offerAmount: isNaN(numericValue) ? 0 : numericValue,
                    isDirty: true,
                };
            })
        );
    };

    const handleToggleActive = (skuId: string) => {
        setSkus(prev => prev.map(s => (s.id === skuId ? { ...s, isActive: !s.isActive, isDirty: true } : s)));
    };

    const setActiveForFiltered = (nextState: boolean) => {
        setSkus(prev =>
            prev.map(s => {
                const isInFilter = filteredSkus.some(f => f.id === s.id);
                if (!isInFilter) return s;
                return { ...s, isActive: nextState, isDirty: true };
            })
        );
    };

    const saveChanges = async () => {
        const dirtySkus = skus.filter(s => s.isDirty);
        if (dirtySkus.length === 0) return;

        setSaving(true);
        try {
            // Process sequentially for safety, or we could batch if we had a batch RPC
            let successCount = 0;

            for (const sku of dirtySkus) {
                const amount = Number(sku.offerAmount);
                const payload = {
                    tenant_id: tenantId,
                    vehicle_color_id: sku.id,
                    offer_amount: amount,
                    state_code: defaultStateCode,
                    is_active: sku.isActive,
                    updated_at: new Date().toISOString(),
                };

                if (sku.hasRule && sku.ruleId) {
                    await supabase.from('cat_price_dealer').update(payload).eq('id', sku.ruleId);
                } else {
                    await supabase.from('cat_price_dealer').insert(payload);
                }
                successCount++;
            }

            toast.success(`Updated ${successCount} prices successfully`);
            await fetchPricelist(); // Refresh
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user?.id && tenantId) {
                    await supabase.from('audit_logs' as any).insert({
                        tenant_id: tenantId,
                        actor_id: user.id,
                        action: 'DEALER_PRICING_UPDATED',
                        entity_type: 'DEALER_PRICELIST',
                        entity_id: defaultStateCode,
                        metadata: {
                            updated_rows: successCount,
                            state_code: defaultStateCode,
                        },
                    });
                }
            } catch (e) {
                console.warn('Audit log failed:', e);
            }
        } catch (err) {
            console.error(err);
            toast.error('Some updates failed');
        } finally {
            setSaving(false);
        }
    };

    // Derived State
    const brands = useMemo(() => Array.from(new Set(skus.map(s => s.brandName))).sort(), [skus]);

    const filteredSkus = useMemo(() => {
        let result = skus;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(
                s => s.fullName.toLowerCase().includes(lower) || s.colorName.toLowerCase().includes(lower)
            );
        }
        if (brandFilter !== 'ALL') {
            result = result.filter(s => s.brandName === brandFilter);
        }
        if (activeFilter !== 'ALL') {
            result = result.filter(s => (activeFilter === 'ACTIVE' ? s.isActive : !s.isActive));
        }
        return result;
    }, [skus, searchTerm, brandFilter, activeFilter]);

    const stats = useMemo(() => {
        const total = skus.length;
        const activeOffers = skus.filter(s => s.offerAmount !== 0).length;
        const dirtyCount = skus.filter(s => s.isDirty).length;
        const activeRows = skus.filter(s => s.isActive).length;
        return { total, activeOffers, dirtyCount, activeRows };
    }, [skus]);

    return (
        <div className="space-y-6">
            {/* 1. Header & Stats - Clean Glass Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFD700] flex items-center justify-center text-black shadow-lg shadow-[#FFD700]/20">
                            <Tag size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                On-Road Pricing & Offers
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">
                                Regulatory Ledger • {defaultStateCode}
                                {pricingDistrict ? ` • ${pricingDistrict}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-6">
                        <div className="flex flex-col items-center px-4 md:border-r border-slate-100 dark:border-white/5 last:border-0">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Tracked SKUs
                            </span>
                        </div>
                        <div className="flex flex-col items-center px-4 md:border-r border-slate-100 dark:border-white/5 last:border-0">
                            <span className="text-2xl font-black text-emerald-500">{stats.activeRows}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Active Rows
                            </span>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r border-slate-100 dark:border-white/5 last:border-0">
                            <span className="text-2xl font-black text-green-500">{stats.activeOffers}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Active Offers
                            </span>
                        </div>
                        <div className="flex flex-col items-center px-4 last:border-0 border-r border-slate-100 dark:border-white/5">
                            <span
                                className={`text-2xl font-black ${stats.dirtyCount > 0 ? 'text-amber-500' : 'text-slate-300'}`}
                            >
                                {stats.dirtyCount}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Pending Saves
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. The Grid Control Consolidation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                {/* Integrated Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                    {/* Left: Filters & Search */}
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                        {/* Search */}
                        <div className="relative group">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FFD700] transition-colors"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search inventory..."
                                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-9 pr-4 py-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#FFD700]/20 outline-none w-48 transition-all hover:border-[#FFD700]/40"
                            />
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1" />

                        {/* Brand Filter */}
                        <div className="relative">
                            <select
                                value={brandFilter}
                                onChange={e => setBrandFilter(e.target.value)}
                                className="appearance-none bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 pl-3 pr-8 py-2 rounded-xl text-xs font-bold uppercase tracking-wide focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm"
                            >
                                <option value="ALL">All Brands</option>
                                {brands.map(b => (
                                    <option key={b} value={b}>
                                        {b}
                                    </option>
                                ))}
                            </select>
                            <LayoutGrid
                                size={14}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
                            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setActiveFilter(key)}
                                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors ${
                                        activeFilter === key
                                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* State Badge */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                            <MapPin size={12} />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                {defaultStateCode} Zone
                            </span>
                        </div>

                        <button
                            onClick={() => setActiveForFiltered(true)}
                            className="px-3 py-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
                        >
                            Activate Filtered
                        </button>
                        <button
                            onClick={() => setActiveForFiltered(false)}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
                        >
                            Deactivate Filtered
                        </button>

                        {stats.dirtyCount > 0 ? (
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FFD700]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 rounded-xl">
                                <CheckCircle2 size={14} className="text-[#FFD700]" />
                                Synced
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                            <tr>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16 text-center">
                                    Brand
                                </th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Vehicle Details
                                </th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                                    Ex-Showroom
                                </th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                                    RTO
                                </th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                                    Insurance
                                </th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                                    On-Road
                                </th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-24">
                                    Active
                                </th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-40">
                                    Offer
                                </th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                                    Final Price
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <Loader2 className="animate-spin mx-auto mb-2 opacity-50" />
                                        <p className="text-xs uppercase tracking-widest font-bold">Syncing Ledger...</p>
                                    </td>
                                </tr>
                            ) : filteredSkus.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                                        No inventory matches found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSkus.map((sku, idx) => (
                                    <tr
                                        key={sku.id}
                                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <td className="p-4 bg-white/50 dark:bg-transparent group-hover:bg-transparent transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center p-1.5 shadow-sm">
                                                {sku.brandLogo ? (
                                                    <img
                                                        src={sku.brandLogo}
                                                        alt={sku.brandName}
                                                        className="w-full h-full object-contain opacity-80"
                                                    />
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300">
                                                        {sku.brandName.substring(0, 2)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {sku.modelName}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                                        {sku.variantName}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-400 mt-0.5">{sku.colorName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                    ₹{sku.exShowroom.toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-[9px] text-slate-300 uppercase font-bold tracking-wider">
                                                    Base
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {sku.pricingReady ? `₹${sku.rtoAmount.toLocaleString('en-IN')}` : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {sku.pricingReady
                                                    ? `₹${sku.insuranceAmount.toLocaleString('en-IN')}`
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                {sku.pricingReady ? `₹${sku.onRoadBase.toLocaleString('en-IN')}` : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleToggleActive(sku.id)}
                                                className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                                                    sku.isActive ? 'bg-[#FFD700]' : 'bg-slate-200 dark:bg-slate-700'
                                                }`}
                                                title={sku.isActive ? 'Active' : 'Inactive'}
                                            >
                                                <span
                                                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                        sku.isActive ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center">
                                                <div className="relative w-32 group-focus-within:w-36 transition-all">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        {sku.offerAmount !== 0 ? (
                                                            sku.offerAmount < 0 ? (
                                                                <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
                                                            ) : (
                                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                            )
                                                        ) : (
                                                            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                        )}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={sku.inputOffer ?? ''}
                                                        onChange={e => handleUpdateOffer(sku.id, e.target.value)}
                                                        placeholder="Add Offer"
                                                        className={`block w-full pl-8 pr-3 py-2 text-center text-sm font-bold rounded-xl border-2 outline-none transition-all ${
                                                            sku.isDirty
                                                                ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-4 focus:ring-[#FFD700]/10'
                                                                : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 focus:border-[#FFD700] focus:bg-white dark:focus:bg-black'
                                                        } ${
                                                            sku.offerAmount < 0
                                                                ? 'text-green-600'
                                                                : sku.offerAmount > 0
                                                                  ? 'text-amber-600'
                                                                  : 'text-slate-900 dark:text-white'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end min-w-[100px]">
                                                {/* Rough calculation of delta for visual feedback - note: strictly we should sum standard on-road + offer, but here we just show base + offer effect */}
                                                <div className="flex items-center gap-1">
                                                    <span
                                                        className={`text-sm font-black ${
                                                            sku.offerAmount < 0
                                                                ? 'text-green-500'
                                                                : 'text-slate-900 dark:text-white'
                                                        }`}
                                                    >
                                                        {sku.pricingReady
                                                            ? `₹${(sku.onRoadBase + sku.offerAmount).toLocaleString('en-IN')}`
                                                            : '—'}
                                                    </span>
                                                    {sku.pricingReady && (
                                                        <span className="text-[9px] text-slate-300 font-bold">*</span>
                                                    )}
                                                </div>
                                                {sku.offerAmount !== 0 ? (
                                                    <span
                                                        className={`text-[9px] font-bold uppercase tracking-wider ${
                                                            sku.offerAmount < 0
                                                                ? 'text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.5 rounded'
                                                                : 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded'
                                                        }`}
                                                    >
                                                        {sku.offerAmount < 0
                                                            ? `${Math.abs(sku.offerAmount)} OFF`
                                                            : `+${sku.offerAmount} Premium`}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                                                        Standard
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Note */}
                <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center gap-2">
                    <AlertCircle size={12} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        On-road pricing from published price ledger for {defaultStateCode}. Offer adjustments are
                        previewed client-side and finalized on save.
                    </p>
                </div>
            </div>
        </div>
    );
};
