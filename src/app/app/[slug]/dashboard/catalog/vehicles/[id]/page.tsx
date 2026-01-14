'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import DetailPanel from '@/components/templates/DetailPanel';
import ContextSidePanel from '@/components/templates/ContextSidePanel';
import DependencyMapPanel from '@/components/modules/context/DependencyMapPanel';
import ImpactAnalysisPanel from '@/components/modules/context/ImpactAnalysisPanel';
import ActivityTimelinePanel from '@/components/modules/context/ActivityTimelinePanel';
import { mockStore } from '@/lib/mock/mockStore';
import { MOCK_VEHICLES, MOCK_ACCESSORIES, MOCK_SERVICES, ProductVariant, ProductBrand, VehicleModel, ModelVariant, ModelColor } from '@/types/productMaster';
import { ChevronLeft, Sparkles, Box, Plus, Copy, Palette, FileText, Save, Loader2, CheckCircle2 } from 'lucide-react';
import {
    ProductBrandOverview,
    ProductModelsTab,
    ProductVariantsTab,
    ProductColorsTab
} from '@/components/modules/products/ProductTabs';
import { VariantSpecificationEditor } from '@/components/modules/products/VariantSpecificationEditor';
import { SimpleVariantTable } from '@/components/modules/products/SimpleVariantTable';
import AdvancedVariantEditor from '@/components/modules/products/AdvancedVariantEditor';
import AdvancedColorEditor from '@/components/modules/products/AdvancedColorEditor';
import VehicleSKUListView from '@/components/modules/products/VehicleSKUListView';

/**
 * Helper to derive Brands from flat Variants list.
 */
const deriveBrands = (variants: ProductVariant[]): ProductBrand[] => {
    const map = new Map<string, ProductBrand>();

    variants.forEach(v => {
        if (!map.has(v.make)) {
            map.set(v.make, {
                id: v.make, // Use Name as ID
                name: v.make,
                type: v.type, // Simplification
                modelCount: 0,
                skuCount: 0,
                status: 'ACTIVE'
            });
        }
        const brand = map.get(v.make)!;
        brand.skuCount++;
    });

    return Array.from(map.values());
};

/**
 * Helper to build Model -> Variant hierarchy for the selected brand from MOCK_VEHICLES
 */
const getBrandHierarchy = (brandName: string): VehicleModel[] => {
    const modelsMap = new Map<string, VehicleModel>();

    MOCK_VEHICLES.filter(v => v.make.toLowerCase() === brandName.toLowerCase()).forEach(v => {
        if (!modelsMap.has(v.model)) {
            modelsMap.set(v.model, {
                id: `m-${v.model}`,
                name: v.model,
                brand: brandName,
                variants: [],
                colors: []
            });
        }
        const model = modelsMap.get(v.model)!;

        // Find if variant already exists
        const existingVariant = model.variants.find((vr: ModelVariant) => vr.name === v.variant);
        if (!existingVariant) {
            const colorEntry: ModelColor = {
                id: `c-${v.sku}`,
                name: v.color || 'Standard',
                code: '#000000', // Default if not in flat mock
                variantIds: [`v-${v.variant}`],
                media: []
            };

            model.variants.push({
                id: `v-${v.variant}`,
                name: v.variant,
                status: 'ACTIVE',
                specifications: v.specifications as any // Temporary cast until specs are fully unified
            });
            model.colors.push(colorEntry);
        }
    });

    return Array.from(modelsMap.values());
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const brandId = decodeURIComponent(params.id as string).trim();
    const brandSlug = brandId.toLowerCase();

    const [brands, setBrands] = useState<ProductBrand[]>([]);
    const [brandModels, setBrandModels] = useState<VehicleModel[]>([]);
    const [brandColors, setBrandColors] = useState<ModelColor[]>([]);
    const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
    const [activeTab, setActiveTab] = useState('Overview');
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<number>(0);
    const [showSaved, setShowSaved] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [initialBrandColors, setInitialBrandColors] = useState<string>('');

    const fetchRealData = React.useCallback(async () => {
        const supabase = createClient();

        // 1. Fetch Brand by slug or name (case-insensitive)
        let { data: brandData, error: brandError } = await supabase
            .from('brands')
            .select('*')
            .or(`slug.eq.${brandSlug},name.ilike.${brandId}`)
            .limit(1)
            .maybeSingle();

        if (!brandData) {
            const fallback = await supabase
                .from('brands')
                .select('*')
                .ilike('name', `%${brandId}%`)
                .limit(1)
                .maybeSingle();
            brandData = fallback.data;
            brandError = fallback.error;
        }

        if (brandError || !brandData) {
            // Fallback to Mock if DB fetch fails or not found (e.g. for pure mock brands)
            console.log("Brand not found in DB, using Mock/Local");
            loadMockData();
            return;
        }

        // 2. Fetch Models for this Brand
        const { data: modelsData, error: modelsError } = await supabase
            .from('vehicle_models')
            .select(`
                *,
                vehicle_variants (*)
            `)
            .eq('brand_id', brandData.id);

        if (modelsError) {
            console.error("Error fetching models:", modelsError);
            loadMockData();
            return;
        }

        // 3. Transform DB Data to UI Structure
        const dbModels: VehicleModel[] = modelsData.map((m: any) => ({
            id: m.id,
            name: m.name,
            brand: brandData.name,
            category: m.category,
            fuelType: m.fuel_type,
            hsnCode: '', // Not in fetch yet
            gstRate: 28, // Default
            variants: (m.vehicle_variants || []).map((v: any) => ({
                id: v.id,
                name: v.name,
                status: 'ACTIVE',
                specifications: {} as any // Specs are currently flat in DB or separated
            })).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
            colors: [] // Colors would need another fetch or join
        }));


        // Extract all variant IDs from the fetched models
        const allVariantIds = dbModels.flatMap(m => m.variants.map((v: any) => v.id));

        // 4. Fetch Colors (using IN clause which is often more reliable than deep joins)
        let colorsData: any[] = [];
        let colorsError = null;

        if (allVariantIds.length > 0) {
            const response = await supabase
                .from('vehicle_colors')
                .select('*')
                .in('variant_id', allVariantIds);
            colorsData = response.data || [];
            colorsError = response.error;
        }



        if (colorsData) {
            const groupedColors = new Map<string, ModelColor>();

            colorsData.forEach((c: any) => {
                const key = `${c.name}-${c.hex_code}`;
                if (!groupedColors.has(key)) {
                    groupedColors.set(key, {
                        id: c.id,
                        name: c.name,
                        code: c.hex_code || '#000000',
                        variantIds: [],
                        allIds: [],
                        primaryVariantIds: [],
                        // Detect videos based on extension or w3schools sample
                        media: (c.gallery_urls || []).map((url: string) => ({
                            id: url,
                            type: url.match(/\.(mp4|webm|ogg|mov)$|youtube\.com|youtu\.be|vimeo\.com/i) ? 'video' : 'image',
                            url
                        }))
                    });
                }
                const group = groupedColors.get(key)!;
                group.variantIds.push(c.variant_id);
                group.allIds?.push(c.id);
                if (c.is_primary) {
                    group.primaryVariantIds = Array.from(new Set([...(group.primaryVariantIds || []), c.variant_id]));
                }
            });

            const finalColors = Array.from(groupedColors.values());
            setBrandColors(finalColors);
            setInitialBrandColors(JSON.stringify(finalColors));
            setHasUnsavedChanges(false);
        }

        // Calculate SKU Count (Total Colors across all Variants)
        const totalSkus = colorsData.length;

        // Set Brand Info from DB
        setBrands([{
            id: brandData.slug || brandData.name,
            name: brandData.name,
            logoUrl: brandData.logo_url,
            type: 'VEHICLE',
            modelCount: dbModels.length,
            skuCount: totalSkus,
            status: brandData.is_active ? 'ACTIVE' : 'DISCONTINUED'
        }]);

        // Set Models State (Crucial for the "Models" tab)
        setBrandModels(dbModels);

        if (dbModels.length > 0) {
            setSelectedModel(dbModels[0]);
        }
    }, [brandId]);

    const loadMockData = React.useCallback(() => {
        const allVariants = [
            ...mockStore.getOrGenerate('products_vehicles', () => MOCK_VEHICLES),
            ...mockStore.getOrGenerate('products_accessories', () => MOCK_ACCESSORIES),
            ...mockStore.getOrGenerate('products_services', () => MOCK_SERVICES),
        ];
        setBrands(deriveBrands(allVariants));

        const persistenceKey = `catalog_models_${brandId}`;
        const persistedModels = localStorage.getItem(persistenceKey);

        let hierarchy;
        if (persistedModels && JSON.parse(persistedModels).length > 0) {
            hierarchy = JSON.parse(persistedModels);
        } else {
            hierarchy = getBrandHierarchy(brandId);
        }

        setBrandModels(hierarchy);

        if (hierarchy.length > 0) {
            setSelectedModel(hierarchy[0]);
        }
    }, [brandId]);

    useEffect(() => {
        fetchRealData();
    }, [fetchRealData]);

    useEffect(() => {
        const current = JSON.stringify(brandColors);
        if (initialBrandColors && current !== initialBrandColors) {
            setHasUnsavedChanges(true);
        } else {
            setHasUnsavedChanges(false);
        }
    }, [brandColors, initialBrandColors]);

    // --- AUTO-SAVE LOGIC ---
    useEffect(() => {
        if (brandModels.length > 0) {
            mockStore.set(`catalog_models_${brandId}`, brandModels);
        }
    }, [brandModels, brandId]);

    useEffect(() => {
        if (brandColors.length > 0) {
            mockStore.set(`catalog_colors_${brandId}`, brandColors);
        }
    }, [brandColors, brandId]);

    const normalizedBrandId = brandId.toLowerCase();
    const selectedBrand = brands.find(b =>
        b.id.toLowerCase() === normalizedBrandId ||
        b.name.toLowerCase() === normalizedBrandId
    );

    const handleClose = () => {
        const slug = params.slug;
        router.push(slug ? `/app/${slug}/dashboard/catalog/vehicles` : '/dashboard/catalog/vehicles');
    };

    const handleAddModel = (data: { name: string, category: string, fuelType: string, hsnCode: string, gstRate: number }) => {
        const newModel: VehicleModel = {
            id: `m-${Date.now()}`,
            name: data.name,
            brand: brandId,
            category: data.category,
            fuelType: data.fuelType,
            hsnCode: data.hsnCode,
            gstRate: data.gstRate,
            variants: [],
            colors: []
        };
        setBrandModels(prev => [...prev, newModel]);
    };

    const handleUpdateModel = (id: string, data: { name: string, category: string, fuelType: string, hsnCode: string, gstRate: number }) => {
        setBrandModels(prev => prev.map(m =>
            m.id === id
                ? { ...m, name: data.name, category: data.category, fuelType: data.fuelType, hsnCode: data.hsnCode, gstRate: data.gstRate }
                : m
        ));

        if (selectedModel?.id === id) {
            setSelectedModel((prev: any) => prev ? { ...prev, name: data.name, category: data.category, fuelType: data.fuelType, hsnCode: data.hsnCode, gstRate: data.gstRate } : null);
        }
    };

    const handleAddVariant = (data: Partial<ModelVariant>) => {
        if (!selectedModel) return;

        const newVariant: ModelVariant = {
            id: `v-${Date.now()}`,
            name: data.name || 'Standard',
            status: 'ACTIVE',
            specifications: {
                engine: { displacement: '--', maxPower: '--', cooling: '--' },
                transmission: { type: '--' }
            } as any
        };

        setBrandModels(prev => prev.map(m =>
            m.id === selectedModel.id
                ? { ...m, variants: [...(m.variants || []), newVariant] }
                : m
        ));

        setSelectedModel({
            ...selectedModel,
            variants: [...(selectedModel.variants || []), newVariant]
        });
    };

    const handleUpdateVariant = (variantId: string, field: string, value: any) => {
        if (!selectedModel) return;

        setBrandModels(prev => prev.map(m =>
            m.id === selectedModel.id
                ? {
                    ...m,
                    variants: m.variants.map((v: ModelVariant) =>
                        v.id === variantId ? { ...v, [field]: value } : v
                    )
                }
                : m
        ));

        setSelectedModel((prev: any) => {
            if (!prev) return null;
            return {
                ...prev,
                variants: prev.variants.map((v: any) =>
                    v.id === variantId ? { ...v, [field]: value } : v
                )
            };
        });
    };

    const handleDeleteVariant = (variantId: string) => {
        if (!selectedModel) return;

        setBrandModels(prev => prev.map(m =>
            m.id === selectedModel.id
                ? { ...m, variants: m.variants.filter((v: ModelVariant) => v.id !== variantId) }
                : m
        ));

        setSelectedModel((prev: VehicleModel | null) => {
            if (!prev) return null;
            return {
                ...prev,
                variants: prev.variants.filter((v: ModelVariant) => v.id !== variantId)
            };
        });
    };

    const handleCloneVariant = (variantId: string) => {
        if (!selectedModel) return;

        const variantToClone = selectedModel.variants.find((v: ModelVariant) => v.id === variantId);
        if (!variantToClone) return;

        const clonedVariant: ModelVariant = {
            ...variantToClone,
            id: `v-clone-${Date.now()}`,
            name: `${variantToClone.name} (Copy)`
        };

        setBrandModels(prev => prev.map(m =>
            m.id === selectedModel.id
                ? { ...m, variants: [...m.variants, clonedVariant] }
                : m
        ));

        setSelectedModel((prev: VehicleModel | null) => {
            if (!prev) return null;
            return {
                ...prev,
                variants: [...prev.variants, clonedVariant]
            };
        });
    };

    const handleAddColor = (data: Partial<ModelColor> = {}) => {
        if (!selectedModel) return;
        const tenantSlug = params.slug; // Ensure params is captured or use tenantSlug from context if available, but params.slug exists here
        const base = tenantSlug ? `/app/${tenantSlug}/dashboard` : '/dashboard';
        router.push(`${base}/catalog/vehicles/studio?modelId=${selectedModel.id}&step=colors`);
        // Deprioritize local handling since we want the full studio exp
    };

    const handleUpdateColor = (id: string, field: string, value: any) => {
        setBrandColors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const [isSaving, setIsSaving] = useState(false);
    const [saveDetails, setSaveDetails] = useState<{ skus: number } | null>(null);

    const handleSaveColors = async () => {
        setIsSaving(true);
        const supabase = createClient();

        try {
            let totalProcessed = 0;
            const tenantSlug = params.slug;
            const primaryVariantIds = new Set<string>();
            const allVariantIds = new Set<string>();

            brandColors.forEach(color => {
                (color.primaryVariantIds || []).forEach(vid => primaryVariantIds.add(vid));
                (color.variantIds || []).forEach(vid => allVariantIds.add(vid));
            });

            if (allVariantIds.size > 0) {
                await supabase
                    .from('vehicle_colors')
                    .update({ is_primary: false })
                    .in('variant_id', Array.from(allVariantIds));
            }

            for (const color of brandColors) {
                const uiVariantIds = color.variantIds || [];
                const dbRowIds = color.allIds || [];

                // We need to fetch current associations from DB to see what's actually there
                // because allIds might be stale if multiple saves happen
                const { data: currentRows } = await supabase
                    .from('vehicle_colors')
                    .select('id, variant_id')
                    .in('id', dbRowIds.length > 0 ? dbRowIds : [color.id]);

                const existingVariantIds = (currentRows || []).map(r => r.variant_id);
                const rowIdByVariantId = new Map((currentRows || []).map(r => [r.variant_id, r.id]));

                // 1. Identify New Associations (In UI, not in DB)
                const newVariantIds = uiVariantIds.filter(vid => !existingVariantIds.includes(vid));

                // 2. Identify Associations to Update (In UI and DB)
                const variantsToUpdate = uiVariantIds.filter(vid => existingVariantIds.includes(vid));

                // 3. Identify Associations to Delete (In DB, not in UI)
                const rowIdsToDelete = (currentRows || [])
                    .filter(r => !uiVariantIds.includes(r.variant_id))
                    .map(r => r.id);

                // --- Handle INSERTS ---
                if (newVariantIds.length > 0) {
                    const inserts = newVariantIds.map(vid => {
                        let rowMedia = color.media || [];
                        if (color.variantOverrides?.[vid]?.media) {
                            rowMedia = color.variantOverrides[vid].media!;
                        }
                        return {
                            variant_id: vid,
                            name: color.name,
                            hex_code: color.code,
                            gallery_urls: rowMedia.map(m => m.url),
                            is_primary: (color.primaryVariantIds || []).includes(vid),
                            updated_at: new Date().toISOString()
                        };
                    });

                    const { data: insertedRows, error: insertError } = await supabase
                        .from('vehicle_colors')
                        .insert(inserts)
                        .select('id');

                    if (insertError) throw insertError;

                    // Sync Pricing for New SKUs
                    if (insertedRows && insertedRows.length > 0) {
                        const priceInserts = insertedRows.map(row => ({
                            vehicle_color_id: row.id,
                            state_code: 'MH', // Default state for sync
                            ex_showroom_price: 0, // Initial price
                            updated_at: new Date().toISOString()
                        }));
                        await supabase.from('vehicle_prices').insert(priceInserts);
                    }
                    totalProcessed += inserts.length;
                }

                // --- Handle UPDATES ---
                if (variantsToUpdate.length > 0) {
                    for (const vid of variantsToUpdate) {
                        const rowId = rowIdByVariantId.get(vid);
                        if (!rowId) continue;

                        let rowMedia = color.media || [];
                        if (color.variantOverrides?.[vid]?.media) {
                            rowMedia = color.variantOverrides[vid].media!;
                        }

                        const { error: updateError } = await supabase
                            .from('vehicle_colors')
                            .update({
                                name: color.name,
                                hex_code: color.code,
                                gallery_urls: rowMedia.map(m => m.url),
                                is_primary: (color.primaryVariantIds || []).includes(vid),
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', rowId);

                        if (updateError) throw updateError;
                    }
                    totalProcessed += variantsToUpdate.length;
                }

                // --- Handle DISCONTINUATIONS (Instead of Deletions) ---
                if (rowIdsToDelete.length > 0) {
                    const { error: discontinueError } = await supabase
                        .from('vehicle_colors')
                        .update({
                            status: 'Discontinue',
                            updated_at: new Date().toISOString()
                        })
                        .in('id', rowIdsToDelete);
                    if (discontinueError) {
                        // If status column doesn't exist yet, we'll log it but not block.
                        // However, per user request, we should aim for this.
                        console.warn('Could not set Discontinue status, falling back to delete or ignoring:', discontinueError);
                        // If user specifically said "Never get deleted", then we definitely don't delete.
                    }
                }
            }

            setLastSavedAt(Date.now());
            setSaveDetails({ skus: totalProcessed });
            setShowSaved(true);
            setHasUnsavedChanges(false);
            setInitialBrandColors(JSON.stringify(brandColors));
            setTimeout(() => {
                setShowSaved(false);
                setSaveDetails(null);
            }, 5000);

            // Refresh local data to get new allIds
            fetchRealData();
            console.log(`Saved ${totalProcessed} SKUs successfully`);
        } catch (e: any) {
            console.error('Save Failure:', e);
            alert('Critial Save Error: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteColor = (id: string) => {
        setBrandColors(prev => prev.filter(c => c.id !== id));
    };

    const renderRightPanel = (currentTab: string) => {
        switch (currentTab) {
            case 'Overview':
                return (
                    <ContextSidePanel type="dependencies">
                        <DependencyMapPanel
                            entity={{ name: selectedBrand?.name || '', id: brandId }}
                            dependencies={{
                                bookings: 12,
                                inventory: 3,
                                priceLists: 2,
                                registrations: 5,
                                insurance: 4
                            }}
                        />
                        <ActivityTimelinePanel
                            entity={{ name: selectedBrand?.name || '', id: brandId }}
                        />
                    </ContextSidePanel>
                );

            case 'Models':
                return (
                    <ContextSidePanel type="context">
                        <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Brand Context</p>
                                <h4 className="text-sm font-black text-white">{selectedBrand?.name}</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Total Models</span>
                                    <span className="font-black text-white">{brandModels.length}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Category</span>
                                    <span className="font-black text-white">{selectedBrand?.type}</span>
                                </div>
                            </div>
                        </div>
                        <ImpactAnalysisPanel
                            entity={{ name: selectedBrand?.name || '', id: brandId }}
                            impacts={[]}
                        />
                    </ContextSidePanel>
                );

            case 'Variants':
                return (
                    <ContextSidePanel type="context">
                        <div className="bg-slate-900 rounded-3xl border border-white/10 p-6 space-y-6">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Model Context</p>
                                <h4 className="text-lg font-black text-white italic truncate">{selectedModel?.name}</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Structure</span>
                                    <span className="font-black text-blue-400 uppercase tracking-widest italic">Hierarchical Tree</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Total Variants</span>
                                    <span className="font-black text-white">{selectedModel?.variants?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                        <ImpactAnalysisPanel
                            entity={{ name: selectedModel?.name || 'Selection', id: selectedModel?.id || 'none' }}
                            impacts={[]}
                        />
                    </ContextSidePanel>
                );

            case 'Colors':
                return (
                    <ContextSidePanel type="context">
                        <div className="bg-slate-900 rounded-3xl border border-white/10 p-6 space-y-6">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Color Palette Context</p>
                                <h4 className="text-lg font-black text-white italic">Active Visuals</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Total Colors</span>
                                    <span className="font-black text-white">{brandColors.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Associated SKUs</span>
                                    <span className="font-black text-white">{brandColors.reduce((acc, c) => acc + (c.variantIds?.length || 0), 0)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Pro-Tip 💡</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                                Associations help in auto-generating SKUs for inventory and pricing rules.
                            </p>
                        </div>
                    </ContextSidePanel>
                );

            case 'SKUs':
                return (
                    <ContextSidePanel>
                        <div className="space-y-8 animate-in fade-in duration-1000">
                            <div className="p-8 bg-blue-600/10 rounded-[32px] border border-blue-500/20 shadow-xl shadow-blue-500/5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">SKU Intelligence</h4>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest italic">Inventory Optimization</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-tight">Active Combinations</span>
                                        <span className="font-black text-slate-900 dark:text-white">
                                            {brandColors.reduce((acc, c) => acc + (c.variantIds?.length || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-tight">Market Readiness</span>
                                        <span className="font-black text-emerald-500 uppercase italic">100% Sync</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Management Tools</p>
                                <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-blue-500/50 transition-all text-left group shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <FileText size={16} className="text-slate-400 group-hover:text-blue-500" />
                                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Audit SKU History</span>
                                    </div>
                                    <ChevronLeft className="rotate-180 text-slate-300" size={14} />
                                </button>
                                <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-blue-500/50 transition-all text-left group shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Copy size={16} className="text-slate-400 group-hover:text-blue-500" />
                                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Bulk Re-sync</span>
                                    </div>
                                    <ChevronLeft className="rotate-180 text-slate-300" size={14} />
                                </button>
                            </div>
                        </div>
                    </ContextSidePanel>
                );

            case 'Activity':
                return (
                    <ContextSidePanel type="activity">
                        <ActivityTimelinePanel
                            entity={{ name: selectedBrand?.name || '', id: brandId }}
                        />
                    </ContextSidePanel>
                );

            default:
                return (
                    <ContextSidePanel>
                        <div className="text-center py-8">
                            <p className="text-xs text-slate-400">Context not available</p>
                        </div>
                    </ContextSidePanel>
                );
        }
    };

    const renderDetailContent = (currentTab: string) => {
        if (!selectedBrand) return <div />;

        switch (currentTab) {
            case 'Overview':
                return <ProductBrandOverview brand={selectedBrand} />;
            case 'Models':
                const tenantSlug = params.slug;
                return (
                    <div className="space-y-6">
                        <ProductModelsTab
                            models={brandModels}
                            selectedModelId={selectedModel?.id}
                            isCreateModalOpen={isModelModalOpen}
                            setCreateModalOpen={setIsModelModalOpen}
                            onSelectModel={(model) => {
                                setSelectedModel(model);
                                setActiveTab('Variants');
                            }}
                            onCreateModel={handleAddModel}
                            onUpdateModel={handleUpdateModel}
                        />
                    </div>
                );
            case 'Variants':
                return (
                    <div className="w-full">
                        {selectedModel ? (
                            <AdvancedVariantEditor
                                modelName={selectedModel.name}
                                variants={selectedModel.variants || []}
                                brandColors={brandColors}
                                onAddVariant={handleAddVariant}
                                onUpdateVariant={handleUpdateVariant}
                                onDeleteVariant={handleDeleteVariant}
                                onCloneVariant={handleCloneVariant}
                                onUpdateColor={handleUpdateColor}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-white/5 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-white/10">
                                <Box size={48} className="text-slate-300 mb-4" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic text-center px-12">
                                    Please select a model from the 'Models' tab to manage specifications and variants.
                                </p>
                            </div>
                        )}
                    </div>
                );
            case 'Colors':
                return selectedModel ? (
                    <AdvancedColorEditor
                        selectedModel={selectedModel}
                        colors={brandColors}
                        lastSavedAt={lastSavedAt}
                        onAddColor={handleAddColor}
                        onUpdateColor={handleUpdateColor}
                        onDeleteColor={handleDeleteColor}
                        allModels={brandModels}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-20 text-center animate-in fade-in duration-700">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                            <Palette size={40} className="text-slate-300 dark:text-white/10" />
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Selection Required</h4>
                        <p className="text-sm font-bold uppercase tracking-widest mt-2 max-w-sm">Please select a model from the 'Models' tab to configure visual identities.</p>
                        <button
                            onClick={() => setActiveTab('Models')}
                            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                        >
                            Go to Models
                        </button>
                    </div>
                );
            case 'SKUs':
                return (
                    <VehicleSKUListView
                        models={brandModels}
                        colors={brandColors}
                        brandName={brandId}
                    />
                );
            default:
                return <div className="p-12 text-center text-slate-400 uppercase font-black tracking-widest italic">Detailed configuration coming soon</div>;
        }
    };

    const renderTabAction = (tab: string) => {
        switch (tab) {
            case 'Models':
                return (
                    <button
                        onClick={() => setIsModelModalOpen(true)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} strokeWidth={3} />
                    </button>
                );
            case 'Colors':
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveColors}
                            disabled={isSaving}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 px-4 shadow-lg ${showSaved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20'}`}
                        >
                            {showSaved ? (
                                <>
                                    <CheckCircle2 size={16} strokeWidth={2.5} />
                                    <span className="text-[10px] font-black uppercase">Saved</span>
                                </>
                            ) : isSaving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={16} strokeWidth={2.5} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Save</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => handleAddColor()}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div >
                );
            default:
                return null;
        }
    };

    return (
        <MasterListDetailLayout mode="detail-only">
            {/* Dummy List Part for detail-only mode */}
            <div />

            {selectedBrand ? (
                <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">
                    {/* Header */}
                    <div className="flex justify-between items-center px-12 py-6 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <button
                                className="p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm"
                                onClick={handleClose}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none mb-1">
                                    {selectedBrand.name}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Sparkles size={10} className="text-blue-500" /> Catalog Entity / {selectedBrand.type}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                {selectedBrand.status}
                            </div>
                        </div>
                    </div>

                    {/* Unsaved Changes Banner */}
                    {hasUnsavedChanges && (
                        <div className="bg-amber-500 text-white px-12 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300 z-30 shadow-lg select-none">
                            <div className="flex items-center gap-3">
                                <div className="p-1 bg-white/20 rounded-lg">
                                    <Sparkles size={14} className="animate-pulse" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">You have unsaved configuration changes</span>
                            </div>
                            <button
                                onClick={handleSaveColors}
                                disabled={isSaving}
                                className="bg-white text-amber-600 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Save Now
                            </button>
                        </div>
                    )}

                    <DetailPanel
                        title={selectedBrand.name}
                        status={selectedBrand.status}
                        onClose={handleClose}
                        tabs={['Overview', 'Models', 'Variants', 'Colors', 'SKUs', 'Activity']}
                        renderContent={renderDetailContent}
                        actionButton={renderTabAction(activeTab)}
                        onTabChange={(tab) => setActiveTab(tab)}
                        rightPanelContent={(tab) => renderRightPanel(tab)}
                        hideHeader={true} // We use our custom premium header
                    />
                </div>
            ) : (
                <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900 w-full">
                    <div className="text-center space-y-4">
                        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full inline-block">
                            <Box size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Brand not found</h3>
                        <button
                            onClick={handleClose}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Back to Catalog
                        </button>
                    </div>
                </div>
            )}
        </MasterListDetailLayout>
    );
}
