'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Box,
    Layers,
    Palette,
    Grid3X3,
    FileCheck,
    Rocket,
    Landmark,
} from 'lucide-react';

import { useTenant } from '@/lib/tenant/tenantContext';
import { toast } from 'sonner';
import AddBrandModal from '@/components/catalog/AddBrandModal';
import { getHierarchyLabels } from '@/lib/constants/catalogLabels';
import type { ProductType, CatalogModel, CatalogSku, CatalogColour } from '@/actions/catalog/catalogV2Actions';
import {
    listBrands,
    listModels,
    listVariants,
    listSkusByModel,
    listColours,
    getFullProductTree,
} from '@/actions/catalog/catalogV2Actions';

// V2 Step Components
import BrandStepV2 from './steps/BrandStepV2';
import ModelStepV2 from './steps/ModelStepV2';
import VariantStepV2 from './steps/VariantStepV2';
import ColourPoolStepV2 from './steps/ColourPoolStepV2';
import SKUStepV2 from './steps/SKUStepV2';
import ReviewStepV2 from './steps/ReviewStepV2';
import PublishStepV2 from './steps/PublishStepV2';
import ServiceStepV2 from './steps/ServiceStepV2';

// Steps dynamically label based on selected category
const getSteps = (category: string | null) => {
    // SERVICE has a simplified flow
    if (category === 'SERVICE') {
        return [
            { id: 'type', title: 'Type', icon: Landmark, color: 'text-blue-500' },
            { id: 'services', title: 'Services', icon: Layers, color: 'text-indigo-500' },
            { id: 'review', title: 'Review', icon: FileCheck, color: 'text-slate-500' },
            { id: 'activate', title: 'Activate', icon: Rocket, color: 'text-orange-500' },
        ];
    }
    const labels = getHierarchyLabels(category);
    return [
        { id: 'type', title: 'Type', icon: Landmark, color: 'text-blue-500' },
        { id: 'model', title: labels.model, icon: Box, color: 'text-purple-500' },
        { id: 'variants', title: labels.variant + 's', icon: Layers, color: 'text-indigo-500' },
        { id: 'colours', title: labels.pool + 's', icon: Palette, color: 'text-pink-500' },
        { id: 'skus', title: 'SKU Matrix', icon: Grid3X3, color: 'text-emerald-500' },
        { id: 'review', title: 'Review', icon: FileCheck, color: 'text-slate-500' },
        { id: 'activate', title: 'Activate', icon: Rocket, color: 'text-orange-500' },
    ];
};

export default function StudioV2Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { tenantSlug, tenantType } = useTenant();

    // Redirect dealers
    useEffect(() => {
        if (tenantType === 'DEALER') {
            router.replace(`/app/${tenantSlug}/dashboard`);
        }
    }, [tenantType, tenantSlug, router]);

    // ── Selection State ──
    const [selectedCategory, setSelectedCategory] = useState<ProductType>(
        (searchParams.get('category') as ProductType) || 'VEHICLE'
    );

    const stepParam = searchParams.get('step');
    const STEPS = getSteps(selectedCategory);
    const initialStep = stepParam ? STEPS.findIndex(s => s.id === stepParam) : 0;
    const [currentStep, setCurrentStep] = useState(initialStep >= 0 ? initialStep : 0);

    // ── Data State (V2 types) ──
    const [brands, setBrands] = useState<any[]>([]);
    const [brand, setBrand] = useState<any>(null);
    const [modelData, setModelData] = useState<CatalogModel | null>(null);
    const [variants, setVariants] = useState<any[]>([]);
    const [colours, setColours] = useState<CatalogColour[]>([]);
    const [skus, setSkus] = useState<CatalogSku[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ── Brand Modal ──
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<any>(null);

    // ── URL sync ──
    const updateStepUrl = useCallback(
        (step: number) => {
            const steps = getSteps(selectedCategory);
            const params = new URLSearchParams(searchParams.toString());
            params.set('step', steps[step]?.id || 'brand');
            if (brand?.id) params.set('brandId', brand.id);
            else params.delete('brandId');
            if (selectedCategory) params.set('category', selectedCategory);
            if (modelData?.id) params.set('modelId', modelData.id);
            else params.delete('modelId');
            router.replace(`?${params.toString()}`, { scroll: false });
        },
        [searchParams, selectedCategory, brand?.id, modelData?.id, router]
    );

    useEffect(() => {
        updateStepUrl(currentStep);
    }, [currentStep, brand?.id, selectedCategory, modelData?.id]);

    // ── Unsaved changes warning ──
    useEffect(() => {
        const h = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', h);
        return () => window.removeEventListener('beforeunload', h);
    }, []);

    // ── Initial Data Load ──
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const brandData = await listBrands();
            setBrands(brandData || []);

            // Resume from URL if brandId + modelId present
            const urlBrandId = searchParams.get('brandId');
            const urlModelId = searchParams.get('modelId');

            if (urlBrandId && brandData) {
                const found = brandData.find((b: any) => b.id === urlBrandId);
                if (found) setBrand(found);
            }

            if (urlModelId) {
                const tree = await getFullProductTree(urlModelId);
                if (tree) {
                    setModelData(tree.model);
                    setVariants(tree.variants || []);
                    setColours(tree.colours || []);
                    setSkus(tree.allSkus || []);
                    if (tree.brand) setBrand(tree.brand);
                    if (tree.model.product_type) setSelectedCategory(tree.model.product_type as ProductType);
                }
            }
        } catch (err) {
            console.error('Failed to load initial data:', err);
            toast.error('Failed to load initial data');
        } finally {
            setIsLoading(false);
        }
    };

    // ── When model changes, reload variants + SKUs ──
    useEffect(() => {
        if (modelData?.id) {
            loadModelChildren(modelData.id);
        } else {
            setVariants([]);
            setColours([]);
            setSkus([]);
        }
    }, [modelData?.id]);

    const loadModelChildren = async (modelId: string) => {
        try {
            const [variantData, colourData, skuData] = await Promise.all([
                listVariants(modelId, modelData?.product_type || 'VEHICLE'),
                listColours(modelId),
                listSkusByModel(modelId),
            ]);
            setVariants(variantData || []);
            setColours(colourData || []);
            setSkus(skuData || []);
        } catch (err) {
            console.error('Failed to load model children:', err);
        }
    };

    // ── Step reset on going back ──
    useEffect(() => {
        if (currentStep < 1) setModelData(null);
    }, [currentStep]);

    // ── Navigation ──
    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            const base = tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/products` : '/dashboard/catalog/products';
            router.push(base);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    // ── Loading Screen ──
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
                        Initializing Studio V2
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Loading normalized catalog...
                    </p>
                </div>
            </div>
        );
    }

    // ── Render ──
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Nav Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-b border-slate-100 dark:border-white/5 py-6 px-8 space-y-6">
                <div className="max-w-[1800px] mx-auto">
                    {/* Branding Row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    const base = tenantSlug
                                        ? `/app/${tenantSlug}/dashboard/catalog/products`
                                        : '/dashboard/catalog/products';
                                    router.push(base);
                                }}
                                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronLeft size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Back to Catalog</span>
                            </button>
                            <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                                Catalog Studio{' '}
                                <span className="text-indigo-500 text-xs not-italic font-mono ml-1">V2</span>
                            </h1>
                        </div>

                        {/* Breadcrumb context */}
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {brand && <span className="text-slate-600 dark:text-slate-300">{brand.name}</span>}
                            {brand && modelData && <span>→</span>}
                            {modelData && <span className="text-indigo-500">{modelData.name}</span>}
                        </div>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-1 w-full">
                        {STEPS.map((step, i) => {
                            const isActive = i === currentStep;
                            const isComplete = i < currentStep;
                            const Icon = step.icon;

                            return (
                                <React.Fragment key={step.id}>
                                    <button
                                        onClick={() => {
                                            if (i <= currentStep) setCurrentStep(i);
                                        }}
                                        className={`
                                            flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                                            ${isActive ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' : ''}
                                            ${isComplete ? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-200' : ''}
                                            ${!isActive && !isComplete ? 'text-slate-300 dark:text-slate-600 cursor-default' : ''}
                                        `}
                                    >
                                        <Icon size={14} className={isActive ? 'text-white' : step.color} />
                                        <span className="hidden lg:inline">{step.title}</span>
                                    </button>
                                    {i < STEPS.length - 1 && (
                                        <div
                                            className={`w-4 h-px flex-shrink-0 ${i < currentStep ? 'bg-slate-400' : 'bg-slate-200 dark:bg-white/10'}`}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Main Canvas */}
            <main className="flex-1 max-w-[1600px] w-full mx-auto py-8 px-12 relative">
                <div className="min-h-[600px] mb-24">
                    {currentStep === 0 && (
                        <BrandStepV2
                            brands={brands}
                            selectedBrand={brand?.id ?? null}
                            selectedCategory={selectedCategory}
                            onSelectBrand={(id: string) => setBrand(brands.find(b => b.id === id))}
                            onSelectCategory={(cat: string) => setSelectedCategory(cat as ProductType)}
                            onCreateBrand={() => {
                                setEditingBrand(null);
                                setIsBrandModalOpen(true);
                            }}
                            onEditBrand={b => {
                                setEditingBrand(b);
                                setIsBrandModalOpen(true);
                            }}
                        />
                    )}
                    {/* SERVICE category: simplified flow */}
                    {selectedCategory === 'SERVICE' && currentStep === 1 && (
                        <ServiceStepV2 modelId={modelData?.id || ''} brandName={brand?.name} />
                    )}
                    {selectedCategory === 'SERVICE' && currentStep === 2 && (
                        <div className="max-w-[1200px] mx-auto py-12 text-center">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white mb-2">
                                Review
                            </h2>
                            <p className="text-sm text-slate-400">
                                Services are saved in real-time. Review your changes in the PDP to verify.
                            </p>
                        </div>
                    )}
                    {selectedCategory === 'SERVICE' && currentStep === 3 && (
                        <PublishStepV2 modelId={modelData?.id || null} onFinish={handleNext} />
                    )}

                    {/* NON-SERVICE categories: full flow */}
                    {selectedCategory !== 'SERVICE' && currentStep === 1 && brand && (
                        <ModelStepV2
                            brand={brand}
                            category={selectedCategory}
                            modelData={modelData}
                            onSave={(model: CatalogModel | null) => setModelData(model)}
                        />
                    )}
                    {selectedCategory !== 'SERVICE' && currentStep === 2 && modelData && (
                        <VariantStepV2 model={modelData} variants={variants} onUpdate={(v: any[]) => setVariants(v)} />
                    )}
                    {selectedCategory !== 'SERVICE' && currentStep === 3 && modelData && (
                        <ColourPoolStepV2
                            model={modelData}
                            colours={colours}
                            onUpdate={(c: CatalogColour[]) => setColours(c)}
                        />
                    )}
                    {selectedCategory !== 'SERVICE' && currentStep === 4 && modelData && (
                        <SKUStepV2
                            model={modelData}
                            variants={variants}
                            colours={colours}
                            skus={skus}
                            onUpdate={(s: CatalogSku[]) => setSkus(s)}
                            onUpdateColours={(c: CatalogColour[]) => setColours(c)}
                        />
                    )}
                    {selectedCategory !== 'SERVICE' && currentStep === 5 && modelData && (
                        <ReviewStepV2 modelId={modelData.id} />
                    )}
                    {selectedCategory !== 'SERVICE' && currentStep === 6 && (
                        <PublishStepV2 modelId={modelData?.id || null} onFinish={handleNext} />
                    )}
                </div>
            </main>

            {/* Sticky Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between px-12">
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
                        <button
                            onClick={handleNext}
                            disabled={
                                (currentStep === 0 && !selectedCategory) ||
                                (currentStep === 0 && selectedCategory !== 'SERVICE' && !brand) ||
                                (selectedCategory !== 'SERVICE' && currentStep === 1 && !modelData)
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

            {/* Brand Modal */}
            {isBrandModalOpen && (
                <AddBrandModal
                    isOpen={isBrandModalOpen}
                    initialData={editingBrand}
                    onClose={() => {
                        setIsBrandModalOpen(false);
                        setEditingBrand(null);
                    }}
                    onSuccess={() => fetchInitialData()}
                />
            )}
        </div>
    );
}
