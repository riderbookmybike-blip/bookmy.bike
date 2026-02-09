'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Save,
    Fingerprint,
    Box,
    Layers,
    Palette,
    Grid3X3,
    FileCheck,
    Gauge,
    Wind,
    Zap,
    HardHat,
    LayoutTemplate,
    CheckCircle2,
    Plus,
    X,
    Search,
    Info,
    Landmark,
    Rocket,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import { toast } from 'sonner';
import AddBrandModal from '@/components/catalog/AddBrandModal';
import { CatalogItem, CatalogTemplate } from '@/types/store';

// Modular Step Components
import CategoryStep from './steps/CategoryStep';
import BrandStep from './steps/BrandStep';
import TemplateStep from './steps/TemplateStep';
import FamilyStep from './steps/FamilyStep';
import VariantStep from './steps/VariantStep';
import ColorStep from './steps/ColorStep';
import MatrixStep from './steps/MatrixStep';
import ReviewStep from './steps/ReviewStep';
import PublishStep from './steps/PublishStep';

const getTemplateIcon = (code: string) => {
    switch (code) {
        case 'ice_bike':
            return Gauge;
        case 'ice_scooter':
            return Wind;
        case 'ev_scooter':
            return Zap;
        case 'helmet':
            return HardHat;
        default:
            return LayoutTemplate;
    }
};

const STEPS = [
    { id: 'category', title: 'Type', icon: Box, color: 'text-orange-500' },
    { id: 'brand', title: 'Brand', icon: Landmark, color: 'text-blue-500' },
    { id: 'template', title: 'Templates', icon: Fingerprint, color: 'text-cyan-500' },
    { id: 'model', title: 'Model', icon: Box, color: 'text-purple-500' },
    { id: 'variants', title: 'Variants', icon: Layers, color: 'text-indigo-500' },
    { id: 'colors', title: 'Colors', icon: Palette, color: 'text-pink-500' },
    { id: 'sku', title: 'SKU', icon: Grid3X3, color: 'text-emerald-500' },
    { id: 'review', title: 'Review', icon: FileCheck, color: 'text-slate-500' },
    { id: 'publish', title: 'Publish', icon: Rocket, color: 'text-orange-500' },
];

export default function UnifiedStudioPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { tenantSlug, tenantId, tenantType } = useTenant();

    useEffect(() => {
        if (tenantType === 'DEALER') {
            router.replace(`/app/${tenantSlug}/dashboard`);
        }
    }, [tenantType, tenantSlug, router]);

    const [currentStep, setCurrentStep] = useState(0);

    // Global Data
    const [brands, setBrands] = useState<any[]>([]);
    const [templates, setTemplates] = useState<CatalogTemplate[]>([]);

    // Selection State
    const [selectedCategory, setSelectedCategory] = useState<string | null>('VEHICLE');
    const [brand, setBrand] = useState<any>(null);
    const [template, setTemplate] = useState<CatalogTemplate | null>(null);

    // Data State
    const [familyData, setFamilyData] = useState<CatalogItem | null>(null);
    const [variants, setVariants] = useState<CatalogItem[]>([]);
    const [colors, setColors] = useState<CatalogItem[]>([]);
    const [allColors, setAllColors] = useState<CatalogItem[]>([]); // Preserves local colors for SKU matching
    const [skus, setSkus] = useState<CatalogItem[]>([]);

    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<any>(null);
    const [brandStats, setBrandStats] = useState<
        Record<string, { families: number; variants: number; skus: number; templates: Record<string, number> }>
    >({});
    const [familyStats, setFamilyStats] = useState<Record<string, { variants: number; colors: number; skus: number }>>(
        {}
    );
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, [tenantId]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const syncColors = (deduplicatedColors: CatalogItem[], fullColorList: CatalogItem[]) => {
        // Create a map for quick lookup of deduplicated colors by ID
        const deduplicatedMap = new Map(deduplicatedColors.map(c => [c.id, c]));

        // Update the full color list to reflect any changes in the deduplicated list
        // This ensures that if a color is removed from deduplicated, it's also removed from full,
        // and if properties change, they are updated.
        const newFullColorList = fullColorList.filter(c => deduplicatedMap.has(c.id));
        deduplicatedColors.forEach(dedupColor => {
            if (!newFullColorList.some(c => c.id === dedupColor.id)) {
                newFullColorList.push(dedupColor);
            } else {
                // Update existing color in full list if its properties changed
                const index = newFullColorList.findIndex(c => c.id === dedupColor.id);
                if (index !== -1) {
                    newFullColorList[index] = { ...newFullColorList[index], ...dedupColor };
                }
            }
        });
        return newFullColorList;
    };

    const fetchFamilyData = async (fId: string) => {
        const supabase = createClient();
        setIsLoading(true);

        try {
            // Fetch all descendants of the Family using the optimized recursive RPC
            const { data: items, error: treeError } = await supabase.rpc('get_item_descendants_tree', {
                root_id: fId,
            });

            if (treeError) {
                console.warn('RPC failed, falling back to local pool:', treeError);
            }

            // Fallback: If RPC failed or returned nothing, try to find items in our pre-fetched local pool
            // This handles cases where items were just added or the RPC is still propagating.
            let finalItems = items && (items as any).length > 0 ? items : null;

            if (!finalItems) {
                // Find all items in catalogItems that have this family as their ancestor (up to 3 levels)
                const itemsMap = new Map(catalogItems.map(i => [i.id, i]));
                const findFamilyRoot = (item: any, depth = 0): string | null => {
                    if (!item || depth > 3) return null;
                    if (item.id === fId) return item.id;
                    if (item.parent_id) return findFamilyRoot(itemsMap.get(item.parent_id), depth + 1);
                    return null;
                };

                finalItems = catalogItems.filter(i => i.id !== fId && findFamilyRoot(i) === fId);
            }

            if (finalItems && (finalItems as any).length > 0) {
                const itemsArray = finalItems as any[];

                const variantItems = itemsArray
                    .filter(c => c.type === 'VARIANT')
                    .sort((a, b) => (a.position || 0) - (b.position || 0));

                const allColorItems = itemsArray
                    .filter(c => c.type === 'COLOR_DEF')
                    .sort((a, b) => (a.position || 0) - (b.position || 0));

                // Hierarchy-Aware Deduplication for Colors:
                // Group colors by name and pick the highest-level one (child of Family) if it exists,
                // or just the first occurrence.
                const colorMap = new Map<string, any>();
                allColorItems.forEach(c => {
                    const nameKey = (c.name || 'UNNAMED').toUpperCase();
                    const existing = colorMap.get(nameKey);
                    if (!existing || (c.parent_id === fId && existing.parent_id !== fId)) {
                        colorMap.set(nameKey, c);
                    }
                });

                setVariants(variantItems);
                setColors(Array.from(colorMap.values()));
                setAllColors(allColorItems);

                const skuItems = itemsArray
                    .filter(c => c.type === 'SKU')
                    .sort((a, b) => (a.position || 0) - (b.position || 0));

                setSkus(skuItems);
            } else {
                // If we truly have no children, clear the details steps
                setVariants([]);
                setColors([]);
                setSkus([]);
            }
        } catch (err) {
            console.error('Failed to resolve model hierarchy:', err);
            setVariants([]);
            setColors([]);
            setSkus([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Strict Data Isolation Effect
    useEffect(() => {
        if (familyData?.id) {
            fetchFamilyData(familyData.id);
        } else {
            setVariants([]);
            setColors([]);
            setSkus([]);
        }
    }, [familyData?.id]);

    // Reset when Step Back changes high level context
    useEffect(() => {
        if (currentStep < 3) {
            // Category, Brand or Template Step
            if (currentStep < 2) setTemplate(null);
            setFamilyData(null);
        }
    }, [currentStep]);

    const fetchInitialData = async () => {
        if (!tenantId) return;
        setIsLoading(true);
        const supabase = createClient();

        try {
            const { data: bData } = await supabase.from('cat_brands').select('*');
            if (bData) setBrands(bData);

            const { data: tData } = await supabase.from('cat_templates').select('*');
            if (tData) setTemplates(tData);

            // Fetch Stats & Catalog Items for Lists (Families are top level, so safe to fetch all for studio list?)
            // Actually, we should filter by brand later, but fetching all FAMILIES is okay if not too huge.
            // For now fetching all items is what caused the bleed if we didn't filter.
            // But here we are just fetching the "Pool". Isolation happens in Step Components via props.
            const pageSize = 1000;
            let offset = 0;
            let allItems: any[] = [];
            // Fetch all items with pagination to avoid PostgREST default limits
            while (true) {
                const { data: batch, error: batchError } = await supabase
                    .from('cat_items')
                    .select('*')
                    .range(offset, offset + pageSize - 1);
                if (batchError) {
                    console.error('[Catalog Studio] Failed to fetch catalog items batch:', batchError);
                    break;
                }
                if (!batch || batch.length === 0) break;
                allItems = allItems.concat(batch);
                if (batch.length < pageSize) break;
                offset += pageSize;
            }
            if (allItems) {
                setCatalogItems(allItems);
                const stats: Record<
                    string,
                    { families: number; variants: number; skus: number; templates: Record<string, number> }
                > = {};
                const fStats: Record<string, { variants: number; colors: number; skus: number }> = {};
                const itemMap = new Map(allItems.map(i => [i.id, i]));

                // ... stats calculation code ...
                // Helper to find brand ID recursively (max depth 3)
                const findBrand = (item: any, depth = 0): string | null => {
                    if (!item || depth > 3) return null;
                    if (item.brand_id) return item.brand_id;
                    if (item.parent_id) return findBrand(itemMap.get(item.parent_id), depth + 1);
                    return null;
                };

                // Helper to find Family ID recursively
                const findFamily = (item: any, depth = 0): string | null => {
                    if (!item || depth > 2) return null;
                    if (item.type === 'FAMILY') return item.id;
                    if (item.parent_id) return findFamily(itemMap.get(item.parent_id), depth + 1);
                    return null;
                };

                allItems.forEach(item => {
                    const bId = findBrand(item);
                    // ... stats logic ...
                    if (bId) {
                        if (!stats[bId]) stats[bId] = { families: 0, variants: 0, skus: 0, templates: {} };
                        if (item.type === 'FAMILY') {
                            stats[bId].families++;
                            if (item.template_id) {
                                stats[bId].templates[item.template_id] =
                                    (stats[bId].templates[item.template_id] || 0) + 1;
                            }
                        }
                        if (item.type === 'VARIANT') stats[bId].variants++;
                        if (item.type === 'SKU') stats[bId].skus++;
                    }

                    const fId = findFamily(item);
                    if (fId) {
                        if (!fStats[fId]) fStats[fId] = { variants: 0, colors: 0, skus: 0 };
                        if (item.type === 'VARIANT') fStats[fId].variants++;
                        if (item.type === 'COLOR_DEF') fStats[fId].colors++;
                        if (item.type === 'SKU') fStats[fId].skus++;
                    }
                });
                setBrandStats(stats);
                setFamilyStats(fStats);
            }

            // Check for edit mode
            const familyId = searchParams.get('familyId');
            const brandId = searchParams.get('brandId');
            const stepParam = searchParams.get('step');

            if (familyId) {
                const { data: fData } = await supabase.from('cat_items').select('*').eq('id', familyId).single();
                if (fData) {
                    setFamilyData(fData);
                    const tmpl = tData?.find(t => t.id === fData.template_id);
                    if (tmpl) setTemplate(tmpl);
                    if (brandId) {
                        const brnd = bData?.find(b => b.id === brandId);
                        if (brnd) setBrand(brnd);
                    }

                    // Handle Deep Linking to specific step
                    if (stepParam) {
                        const stepIndex = parseInt(stepParam);
                        if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEPS.length) {
                            setCurrentStep(stepIndex);
                        }
                    } else if (fData.template_id) {
                        const tmpl = tData?.find(t => t.id === fData.template_id);
                        if (tmpl?.category) setSelectedCategory(tmpl.category);
                    }
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
        else {
            const base = tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/products` : '/dashboard/catalog/products';
            router.push(base);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-900">
                <div className="relative">
                    <div className="w-24 h-24 rounded-[2rem] border-4 border-slate-200 border-t-indigo-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                        <Loader2 className="animate-pulse" size={32} />
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        Initializing Studio
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Booting unified engine engine...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Nav Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-b border-slate-100 dark:border-white/5 py-6 px-8 space-y-6">
                <div className="max-w-[1800px] mx-auto">
                    {/* Branding Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black italic shadow-xl shadow-slate-900/10 text-lg">
                                B
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                    Unified Engine
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                                        Product Studio
                                    </h1>

                                    {/* Context Breadcrumb */}
                                    {(selectedCategory || brand || template || familyData) && (
                                        <div className="flex items-center gap-2 ml-4 pl-4 border-l-2 border-slate-200 dark:border-white/10 opacity-50">
                                            {selectedCategory && (
                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
                                                    <span className="text-slate-300">/</span> {selectedCategory}
                                                </div>
                                            )}
                                            {brand && (
                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
                                                    <span className="text-slate-300">/</span> {brand.name}
                                                </div>
                                            )}
                                            {template && (
                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
                                                    <span className="text-slate-300">/</span> {template.name}
                                                </div>
                                            )}
                                            {familyData && (
                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
                                                    <span className="text-slate-300">/</span> {familyData.name}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stepper Row - Full Width Grid */}
                <div className="w-full border-t border-slate-100 dark:border-white/5 pt-6">
                    <nav className="grid grid-cols-4 md:grid-cols-8 gap-3 w-full">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = currentStep === idx;
                            const isPast = currentStep > idx;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => isPast && setCurrentStep(idx)}
                                    className={`relative flex flex-col xl:flex-row items-center justify-center gap-3 py-4 px-2 rounded-2xl transition-all duration-300 border-2 ${
                                        isActive
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 scale-105 z-10'
                                            : isPast
                                              ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50'
                                              : 'bg-transparent text-slate-300 border-transparent grayscale opacity-60 pointer-events-none'
                                    }`}
                                >
                                    <div
                                        className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10' : isPast ? 'bg-emerald-100' : 'bg-slate-100 dark:bg-white/5'} transition-colors`}
                                    >
                                        {isPast ? (
                                            <CheckCircle2 size={14} strokeWidth={3} />
                                        ) : (
                                            <Icon size={14} strokeWidth={2.5} />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none text-center xl:text-left hidden 2xl:block">
                                        {step.title}
                                    </span>
                                    {/* Mobile/Tablet Title fallback if needed, currently hiding on vertically constrained, showing on 2xl. 
                                        Actually user said "bada" (big). Let's show title always if possible or use responsive.
                                        I'll show title always but small.
                                    */}
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none text-center xl:text-left 2xl:hidden">
                                        {step.title.slice(0, 3)}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Canvas */}
            <main className="flex-1 max-w-[1600px] w-full mx-auto py-8 px-12 relative">
                <div className="min-h-[600px] mb-24">
                    {currentStep === 0 && (
                        <CategoryStep
                            selectedCategory={selectedCategory}
                            onSelectCategory={(id: string) => {
                                setSelectedCategory(id);
                            }}
                        />
                    )}
                    {currentStep === 1 && (
                        <BrandStep
                            brands={brands}
                            stats={brandStats}
                            selectedBrand={brand?.id ?? null}
                            onSelectBrand={(id: string) => {
                                setBrand(brands.find(b => b.id === id));
                            }}
                            onCreateBrand={() => {
                                setEditingBrand(null);
                                setIsBrandModalOpen(true);
                            }}
                            onEditBrand={brand => {
                                setEditingBrand(brand);
                                setIsBrandModalOpen(true);
                            }}
                        />
                    )}
                    {currentStep === 2 && (
                        <TemplateStep
                            templates={templates.filter(t => t.category === selectedCategory || !selectedCategory)}
                            selectedTemplate={template?.id ?? null}
                            templateStats={brand?.id ? (brandStats[brand.id]?.templates ?? {}) : {}}
                            onSelectTemplate={(id: string) => {
                                setTemplate(templates.find(t => t.id === id) ?? null);
                            }}
                        />
                    )}
                    {currentStep === 3 && brand && template && (
                        <FamilyStep
                            brand={brand}
                            template={template}
                            familyData={familyData}
                            families={catalogItems.filter(
                                i => i.type === 'FAMILY' && i.brand_id === brand?.id && i.template_id === template?.id
                            )}
                            stats={familyStats}
                            onSave={(updatedFamily: CatalogItem | null) => {
                                setFamilyData(updatedFamily);
                                if (!updatedFamily) return;
                                setCatalogItems(prev => {
                                    const index = prev.findIndex(i => i?.id === updatedFamily.id);
                                    if (index >= 0) {
                                        const newItems = [...prev];
                                        newItems[index] = updatedFamily;
                                        return newItems;
                                    } else {
                                        return [updatedFamily, ...prev];
                                    }
                                });
                            }}
                            onDelete={async (id: string) => {
                                if (
                                    confirm(
                                        'Are you sure you want to delete this Model Family? This will delete all associated Variants and SKUs.'
                                    )
                                ) {
                                    const supabase = createClient();
                                    const { error } = await supabase.from('cat_items').delete().eq('id', id);
                                    if (!error) {
                                        setCatalogItems(prev => prev.filter(item => item.id !== id));
                                        if (familyData?.id === id) setFamilyData(null);
                                    } else {
                                        alert('Failed to delete family');
                                    }
                                }
                            }}
                            tenantId={tenantId}
                        />
                    )}
                    {currentStep === 4 && familyData && template && (
                        <VariantStep
                            family={familyData}
                            template={template}
                            existingVariants={variants}
                            onUpdate={setVariants}
                            tenantId={tenantId}
                        />
                    )}
                    {currentStep === 5 && familyData && template && (
                        <ColorStep
                            family={familyData}
                            template={template}
                            existingColors={colors}
                            onUpdate={(newDeduplicatedColors: any[]) => {
                                setColors(newDeduplicatedColors);
                                // Sync back to allColors: replace updated items in the full list
                                setAllColors(prevAll => {
                                    const nextAll = [...prevAll];
                                    newDeduplicatedColors.forEach(updated => {
                                        const idx = nextAll.findIndex(a => a.id === updated.id);
                                        if (idx >= 0) nextAll[idx] = updated;
                                    });
                                    return nextAll;
                                });
                            }}
                        />
                    )}
                    {currentStep === 6 && familyData && template && (
                        <MatrixStep
                            family={familyData}
                            template={template}
                            variants={variants}
                            colors={colors}
                            allColors={allColors}
                            existingSkus={skus}
                            onUpdate={setSkus}
                        />
                    )}
                    {currentStep === 7 && (
                        <ReviewStep
                            brand={brand}
                            family={familyData}
                            template={template}
                            variants={variants}
                            colors={colors}
                            skus={skus}
                            onUpdate={setSkus}
                        />
                    )}
                    {currentStep === 8 && <PublishStep onFinish={handleNext} />}
                </div>
            </main>

            {/* Sticky Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 py-4 px-8">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div>
                        {currentStep > 0 && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all shadow-lg"
                            >
                                <ChevronLeft size={16} /> Previous Step
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="px-6 py-3 border border-slate-200 text-slate-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">
                            Save Draft
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={
                                (currentStep === 0 && !selectedCategory) ||
                                (currentStep === 1 && !brand) ||
                                (currentStep === 2 && !template)
                            }
                            className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-[1.25rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {currentStep === STEPS.length - 1 ? (
                                'Go to Catalog'
                            ) : (
                                <>
                                    <span>Next: {STEPS[currentStep + 1]?.title}</span>
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Global Modals */}
            {isBrandModalOpen && (
                <AddBrandModal
                    isOpen={isBrandModalOpen}
                    initialData={editingBrand}
                    onClose={() => {
                        setIsBrandModalOpen(false);
                        setEditingBrand(null);
                    }}
                    onSuccess={(brandName: string) => {
                        // Re-fetch or update locally - since we only get name, we re-fetch to be safe
                        fetchInitialData();
                    }}
                    template={template}
                />
            )}
        </div>
    );
}
