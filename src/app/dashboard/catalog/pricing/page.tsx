'use client';

import React, { useState, useEffect } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import DetailPanel from '@/components/templates/DetailPanel';
import ContextSidePanel from '@/components/templates/ContextSidePanel';
import DependencyMapPanel from '@/components/modules/context/DependencyMapPanel';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';
import { RegistrationRule } from '@/types/registration';
import PricingLedgerTable from '@/components/modules/products/PricingLedgerTable';
import { Landmark, Filter, ShieldCheck, FileCheck, Layers, Car, Zap } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';

interface SKUPriceRow {
    id: string;
    brand: string;
    model: string;
    variant: string;
    color: string;
    engineCc: number;
    exShowroom: number;
    hsnCode?: string;
    gstRate?: number;
}

export default function PricingPage() {
    const [states, setStates] = useState<RegistrationRule[]>(MOCK_REGISTRATION_RULES);
    const [selectedStateId, setSelectedStateId] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

    // Persistent pricing state
    const [skuPrices, setSkuPrices] = useState<Record<string, number>>({});

    // Brands list for filter
    const brands = Array.from(new Set(MOCK_VEHICLES.map(v => v.make)));

    useEffect(() => {
        // 1. Load persist pricing
        const storedPrices = localStorage.getItem('aums_catalog_sku_prices');
        if (storedPrices) {
            setSkuPrices(JSON.parse(storedPrices));
        } else {
            const defaults: Record<string, number> = {};
            MOCK_VEHICLES.forEach(v => {
                defaults[v.sku] = (v as any).exShowroom || 85000;
            });
            setSkuPrices(defaults);
        }

        // 2. Load registration rules from storage (shared with Studio)
        const storedRules = localStorage.getItem('aums_registration_rules_v2');
        if (storedRules) {
            const parsed = JSON.parse(storedRules);
            setStates(parsed);
            if (parsed.length > 0) setSelectedStateId(parsed[0].id);
        } else {
            setSelectedStateId(MOCK_REGISTRATION_RULES[0]?.id || '');
        }
    }, []);

    const handleUpdatePrice = (skuId: string, price: number) => {
        setSkuPrices(prev => ({ ...prev, [skuId]: price }));
    };

    const handleSaveAll = () => {
        localStorage.setItem('aums_catalog_sku_prices', JSON.stringify(skuPrices));
    };

    // Derived SKU rows based on filters
    const skus: SKUPriceRow[] = MOCK_VEHICLES
        .filter(v => selectedBrand === 'ALL' || v.make === selectedBrand)
        .map(v => ({
            id: v.sku,
            brand: v.make,
            model: v.model,
            variant: v.variant,
            color: v.color || 'Standard',
            engineCc: (v.specifications as any)?.engineCc || 110,
            exShowroom: skuPrices[v.sku] || 85000,
            hsnCode: v.hsnCode,
            gstRate: v.gstRate
        }));

    const activeRule = states.find(s => s.id === selectedStateId) || null;

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-12 mb-8">
            <KpiCard title="Active State" value={activeRule?.stateCode || 'MH'} icon={Landmark} color="text-blue-500" />
            <KpiCard title="SKUs Tracked" value={skus.length} icon={Car} color="text-emerald-500" />
            <KpiCard title="Integrity" value="Verified" icon={ShieldCheck} color="text-purple-500" />
            <KpiCard title="Calculation" value="Instant" icon={Zap} color="text-amber-500" />
        </div>
    );

    // Moved activeRule up

    const renderHeader = () => (
        <div className="flex justify-between items-center px-12 py-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 border border-white/10">
                    <Landmark size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none mb-2">
                        ON-ROAD PRICING
                    </h2>
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                        <Filter size={12} className="text-blue-500" /> Regulatory Ledger Configuration
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Minimal Header Actions if any */}
            </div>
        </div>
    );

    const renderRightPanel = () => (
        <ContextSidePanel type="context">
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
                {/* Intelligence Card */}
                <div className="p-8 bg-blue-600/10 rounded-[32px] border border-blue-500/20 shadow-xl shadow-blue-500/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Layers size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Yield Analysis</h4>
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest italic">Calculated Real-Time</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tight">Active State</span>
                            <span className="font-black text-slate-900 dark:text-white uppercase italic">{activeRule?.stateCode}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tight">Base RTO %</span>
                            <span className="font-black text-blue-500 italic">{activeRule?.components[0]?.percentage || 10}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase tracking-tight">Insurance IDV</span>
                            <span className="font-black text-emerald-500 italic">95.0% EX-S</span>
                        </div>
                    </div>
                </div>

                {/* Statutory Quick Links */}
                <div className="space-y-4 px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Statutory Frameworks</p>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                            <FileCheck size={18} className="text-slate-300" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight">RTO State Tenure</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{activeRule?.stateTenure || 15} Years</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                            <ShieldCheck size={18} className="text-slate-300" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight">Insurance Coverage</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">1 Yr OD + 5 Yr TP</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pro-Tip */}
                <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Notice ⚠️</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                        Ex-showroom prices are standard nationwide. RTO and Insurance vary by jurisdiction and engine capacity.
                    </p>
                </div>
            </div>
        </ContextSidePanel>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
            {renderHeader()}

            <div className="flex-1 overflow-hidden px-4">
                {metrics}
                <DetailPanel
                    title="Pricing Optimization"
                    hideHeader={true}
                    tabs={['Pricing Ledger']}
                    renderContent={() => (
                        <PricingLedgerTable
                            initialSkus={skus}
                            activeRule={activeRule}
                            onUpdatePrice={handleUpdatePrice}
                            onSaveAll={handleSaveAll}
                            states={states}
                            selectedStateId={selectedStateId}
                            onStateChange={setSelectedStateId}
                            brands={brands}
                            selectedBrand={selectedBrand}
                            onBrandChange={setSelectedBrand}
                        />
                    )}
                    rightPanelContent={renderRightPanel}
                />
            </div>
        </div>
    );
}
