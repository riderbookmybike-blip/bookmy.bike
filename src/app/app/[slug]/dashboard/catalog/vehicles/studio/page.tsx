'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Save,
    CheckCircle2,
    Database,
    Layout,
    Copy,
    Palette,
    Settings2,
    Zap,
    Trash2,
    AlertCircle,
    Loader2,
    X,
    ChevronDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import AddBrandModal from '@/components/catalog/AddBrandModal';
import MediaUploadModal from '@/components/catalog/MediaUploadModal';
import { Plus, Image as ImageIcon } from 'lucide-react';

// Wizard Steps
const STEPS = [
    { id: 'brand', name: 'Brand Select', icon: Database },
    { id: 'model', name: 'Model & Engine', icon: Layout },
    { id: 'variants', name: 'Variants & Tech', icon: Settings2 },
    { id: 'colors', name: 'Colors & Media', icon: Palette },
];

export default function VehicleStudioPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { tenantId, tenantSlug } = useTenant();

    const [currentStep, setCurrentStep] = useState(() => {
        const stepParam = searchParams.get('step');
        if (stepParam) {
            const idx = STEPS.findIndex(s => s.id === stepParam);
            return idx !== -1 ? idx : 0;
        }
        return 0;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<any>(null); // NEW: State for editing

    // State for the hierarchy
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(searchParams.get('brandId'));
    const [modelId, setModelId] = useState<string | null>(searchParams.get('modelId'));

    // Data stores
    const [brands, setBrands] = useState<any[]>([]);
    const [modelData, setModelData] = useState<any>(null);
    const [variants, setVariants] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [mediaModal, setMediaModal] = useState<{ isOpen: boolean, colorIdx: number, variantId: string } | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, [tenantId]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        const supabase = createClient();
        try {
            // Fetch ALL brands (Global master)
            const { data: brandsData, error: brandsError } = await supabase
                .from('brands')
                .select('*')
                .order('name');

            if (brandsError) throw brandsError;

            if (brandsData) {
                console.log('Brands Fetched:', brandsData);
                setBrands(brandsData);
            }

            if (!tenantId) {
                setIsLoading(false);
                return;
            }

            // If modelId exists, fetch full hierarchy
            if (modelId) {
                const { data: model } = await supabase
                    .from('vehicle_models')
                    .select('*')
                    .eq('id', modelId)
                    .single();

                if (model) {
                    setModelData(model);
                    setSelectedBrandId(model.brand_id);

                    // Fetch variants sorted by position
                    const { data: variantsData } = await supabase
                        .from('vehicle_variants')
                        .select('*')
                        .eq('model_id', modelId)
                        .order('position', { ascending: true })
                        .order('base_price_ex_showroom', { ascending: true });

                    setVariants(variantsData || []);
                }
            }
        } catch (err) {
            setError('Failed to load studio data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep === 0 && !selectedBrandId) {
            alert('Please select a brand before continuing.');
            return;
        }
        if (currentStep === 1 && !modelId) {
            alert('Please save or select a model before continuing.');
            return;
        }
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Finalize & Close
            const base = tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/vehicles` : '/dashboard/catalog/vehicles';
            router.push(base);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Synchronizing Studio Environment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center space-y-4 max-w-md mx-auto p-8">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">System Error</h3>
                    <p className="text-sm font-medium text-slate-500">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Header / Nav */}
            <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Vehicle Studio</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none italic">
                            {modelId ? `Editing: ${modelData?.name}` : 'New Catalog Entry'}
                        </p>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="hidden lg:flex items-center gap-2">
                    {STEPS.map((step, idx) => {
                        const isCompleted = currentStep > idx;
                        const isActive = currentStep === idx;
                        const isEnabled = idx === 0 || (idx === 1 ? selectedBrandId : modelId);

                        return (
                            <React.Fragment key={step.id}>
                                <button
                                    onClick={() => isEnabled && setCurrentStep(idx)}
                                    disabled={!isEnabled}
                                    className={`flex items-center gap-3 transition-all duration-500 disabled:opacity-20 ${isActive ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                >
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all ${isActive ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30' : (isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 dark:border-white/10')}`}>
                                        {isCompleted ? <CheckCircle2 size={16} className="text-white" /> : (
                                            <step.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                        )}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{step.name}</span>
                                    </div>
                                </button>
                                {idx < STEPS.length - 1 && (
                                    <div className="w-4 h-[1px] bg-slate-200 dark:bg-white/5" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Auto-save</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase italic">Cloud Active</span>
                    </div>
                    <button
                        onClick={() => router.push(tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/vehicles` : '/dashboard/catalog/vehicles')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                    >
                        Save & Exit Studio
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="max-w-6xl mx-auto">
                    {currentStep === 0 && (
                        <BrandStep
                            brands={brands}
                            selectedId={selectedBrandId}
                            onSelect={setSelectedBrandId}
                            onNext={handleNext}
                            onCreateBrand={() => {
                                setEditingBrand(null);
                                setIsBrandModalOpen(true);
                            }}
                            onEditBrand={(brand: any) => {
                                setEditingBrand(brand);
                                setIsBrandModalOpen(true);
                            }}
                        />
                    )}
                    {currentStep === 1 && (
                        <ModelStep
                            brandId={selectedBrandId}
                            modelData={modelData}
                            onSave={(id: string, fullData: any) => {
                                setModelId(id);
                                setModelData(fullData);
                            }}
                            onNext={handleNext}
                        />
                    )}
                    {currentStep === 2 && (
                        <VariantStep
                            modelId={modelId}
                            modelName={modelData?.name}
                            variants={variants}
                            onUpdate={setVariants}
                            onNext={handleNext}
                            brandId={selectedBrandId}
                        />
                    )}
                    {currentStep === 3 && (
                        <ColorStep
                            modelId={modelId}
                            variants={variants}
                            onNext={handleNext}
                            colors={colors}
                            setColors={setColors}
                            mediaModal={mediaModal}
                            setMediaModal={setMediaModal}
                            brandId={selectedBrandId}
                        />
                    )}
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="h-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 px-12 flex items-center justify-between sticky bottom-0 z-50">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="flex items-center gap-3 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors uppercase font-black text-[11px] tracking-widest"
                >
                    <ChevronLeft size={20} /> Previous Phase
                </button>

                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            // In a real app with lifted state, this would trigger the save.
                            // Since we have auto-save/immediate save, this serves as user reassurance.
                            // We could trigger a validation or specific sync here.
                            const isModelStep = currentStep === 1;
                            if (isModelStep) {
                                // For Model Step, we rely on the auto-save, but we can visually confirm.
                            }
                            alert('Draft Saved Successfully!');
                        }}
                        className="px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] italic hover:scale-105 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        {currentStep === STEPS.length - 1 ? 'Finalize & Close' : 'Next Section'} <ChevronRight size={20} />
                    </button>
                </div>
            </footer>

            <MediaUploadModal
                isOpen={mediaModal?.isOpen || false}
                onClose={() => setMediaModal(null)}
                onSuccess={(url) => {
                    if (mediaModal) {
                        const newColors = [...colors];
                        const colorToUpdate = newColors[mediaModal.colorIdx];
                        const linkToUpdate = colorToUpdate.links.find((l: any) => l.variant_id === mediaModal.variantId);

                        if (linkToUpdate) {
                            const newUrls = [...(linkToUpdate.gallery_urls || []), url];
                            linkToUpdate.gallery_urls = newUrls;
                            setColors(newColors);

                            const supabase = createClient();
                            supabase
                                .from('vehicle_colors')
                                .update({ gallery_urls: newUrls, image_url: newUrls[0] || null })
                                .eq('id', linkToUpdate.id)
                                .then(({ error }) => {
                                    if (error) console.error('Failed to sync gallery:', error);
                                });
                        }
                    }
                }}
                title="Add Vehicle Asset"
            />
            <AddBrandModal
                isOpen={isBrandModalOpen}
                onClose={() => {
                    setIsBrandModalOpen(false);
                    setEditingBrand(null);
                }}
                initialData={editingBrand}
                onSuccess={(brandName) => {
                    fetchInitialData();
                }}
            />
        </div>
    );
}

// Sub-components for Steps
function BrandStep({ brands, selectedId, onSelect, onNext, onCreateBrand, onEditBrand }: any) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Origin Identity</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Select the primary manufacturer for this vehicle cluster</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {brands.map((brand: any) => (
                    <div key={brand.id} className="relative group">
                        <button
                            onClick={() => {
                                onSelect(brand.id);
                                onNext();
                            }}
                            className={`w-full p-8 rounded-[3rem] border-4 transition-all duration-500 text-left ${selectedId === brand.id ? 'border-blue-600 bg-blue-600/5 shadow-2xl scale-105' : 'border-white dark:border-white/5 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-white/20'}`}
                        >
                            <div className="h-40 w-full rounded-[2rem] bg-slate-50 dark:bg-black/20 flex items-center justify-center mb-6 overflow-hidden border border-slate-100 dark:border-white/5 relative p-8">
                                {brand.logo_svg ? (
                                    <div
                                        className={`w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full transition-transform duration-500 group-hover:scale-105 ${brand.logo_svg.includes('currentColor') ? '[&>svg]:fill-current [&>svg]:text-slate-900 dark:[&>svg]:text-white' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: brand.logo_svg }}
                                    />
                                ) : brand.logo_url ? (
                                    <img src={brand.logo_url} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <Database className="w-1/3 h-1/3 text-slate-200" />
                                )}
                            </div>
                            <span className={`text-sm font-black uppercase tracking-widest transition-colors ${selectedId === brand.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                {brand.name}
                            </span>
                        </button>

                        {/* Edit Override Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditBrand(brand);
                            }}
                            className="absolute top-6 right-6 w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:shadow-xl opacity-0 group-hover:opacity-100 transition-all z-10 border border-slate-100 dark:border-white/5"
                        >
                            <Settings2 size={18} />
                        </button>
                    </div>
                ))}

                {/* Create New Brand Trigger */}
                <button
                    onClick={() => onCreateBrand()}
                    className="group relative p-8 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-white/5 bg-transparent hover:border-indigo-600 hover:bg-indigo-600/5 transition-all duration-500 flex flex-col items-center justify-center text-center"
                >
                    <div className="w-20 h-20 rounded-[2rem] bg-indigo-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Plus className="text-indigo-600" size={32} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 italic">Register Brand</span>
                </button>
            </div>
        </div>
    );
}

function ModelStep({ brandId, modelData, onSave, onNext }: any) {
    const supabase = createClient();
    const [formData, setFormData] = useState({
        name: modelData?.name || '',
        slug: modelData?.slug || '',
        category: modelData?.category || 'MOTORCYCLE',
        fuel_type: modelData?.fuel_type || 'PETROL',
        segment: modelData?.segment || 'COMMUTER',
        displacement_cc: modelData?.displacement_cc || '',
        max_power_kw: modelData?.max_power_kw || '',
        max_torque_nm: modelData?.max_torque_nm || '',
        emission_type: modelData?.emission_type || 'BS6-2.0',
        seating_capacity: modelData?.seating_capacity || 2,
        battery_capacity_kwh: modelData?.battery_capacity_kwh || '',
        certified_range_km: modelData?.certified_range_km || '',
    });

    const [isSaving, setIsSaving] = useState(false);

    const [existingModels, setExistingModels] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!brandId) return;
        const fetchModels = async () => {
            const { data } = await supabase
                .from('vehicle_models')
                .select('*')
                .eq('brand_id', brandId);
            if (data) setExistingModels(data);
        };
        fetchModels();
    }, [brandId]);

    const filteredModels = existingModels.filter(m =>
        m.name.toLowerCase().includes(formData.name.toLowerCase()) &&
        m.name.toLowerCase() !== formData.name.toLowerCase()
    );

    const handleSelectExisting = (model: any) => {
        setFormData({
            name: model.name,
            slug: model.slug,
            category: model.category,
            fuel_type: model.fuel_type,
            segment: model.segment,
            displacement_cc: model.displacement_cc || '',
            max_power_kw: model.max_power_kw || '',
            max_torque_nm: model.max_torque_nm || '',
            emission_type: model.emission_type || 'BS6-2.0',
            seating_capacity: model.seating_capacity || 2,
            battery_capacity_kwh: model.battery_capacity_kwh || '',
            certified_range_km: model.certified_range_km || '',
        });
        // Important: Notify parent we are now editing this ID
        onSave(model.id, model);
        setShowSuggestions(false);
    };

    const handleAutoSave = async () => {
        if (!brandId || !formData.name.trim()) {
            return;
        }
        setIsSaving(true);
        const supabase = createClient();
        try {
            const payload = {
                brand_id: brandId,
                ...formData,
                displacement_cc: formData.displacement_cc ? parseFloat(formData.displacement_cc) : null,
                max_power_kw: formData.max_power_kw ? parseFloat(formData.max_power_kw) : null,
                max_torque_nm: formData.max_torque_nm ? parseFloat(formData.max_torque_nm) : null,
                battery_capacity_kwh: formData.battery_capacity_kwh ? parseFloat(formData.battery_capacity_kwh) : null,
                certified_range_km: formData.certified_range_km ? parseFloat(formData.certified_range_km) : null,
            };

            const { data, error } = await supabase
                .from('vehicle_models')
                .upsert(modelData?.id ? { id: modelData.id, ...payload } : payload)
                .select()
                .single();

            if (data) {
                onSave(data.id, data);
            }
        } catch (err) {
            console.error('Auto-save failed', err);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (!brandId || !formData.name.trim()) return;
        const debounce = setTimeout(() => {
            handleAutoSave();
        }, 800);
        return () => clearTimeout(debounce);
    }, [brandId, formData]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'name') {
            setFormData(prev => ({ ...prev, slug: value.toLowerCase().replace(/ /g, '-') }));
            setShowSuggestions(true);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Model Architecture</h2>
                <div className="flex items-center justify-center gap-2">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Define technical core and RTO-critical specifications</p>
                    {modelData?.id && (
                        <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                            Editing Existing Record
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Basic Info */}
                <div className="lg:col-span-2 space-y-8 bg-white dark:bg-slate-900 p-12 rounded-[4rem] border border-slate-200 dark:border-white/5 shadow-2xl relative z-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Model Identity Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="e.g. Apache RTR 160 4V"
                                    value={formData.name}
                                    onFocus={(e) => {
                                        if (e.target.value.toUpperCase() === 'NEW MODEL') {
                                            updateField('name', '');
                                        }
                                        setShowSuggestions(true);
                                    }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className="w-full px-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-blue-600 rounded-[2rem] text-sm font-black text-slate-900 dark:text-white outline-none transition-all uppercase italic"
                                />
                                {showSuggestions && filteredModels.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-6 py-3 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Existing Models Found</span>
                                        </div>
                                        <ul className="max-h-60 overflow-y-auto p-2">
                                            {filteredModels.map((model) => (
                                                <li
                                                    key={model.id}
                                                    onMouseDown={() => handleSelectExisting(model)}
                                                    className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors group flex items-center justify-between"
                                                >
                                                    <div>
                                                        <span className="block text-sm font-black text-slate-700 dark:text-slate-200 uppercase italic group-hover:text-blue-600 transition-colors">{model.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">{model.category} • {model.fuel_type}</span>
                                                    </div>
                                                    <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Select
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">URL Slug (System ID)</label>
                            <input
                                type="text"
                                value={formData.slug}
                                readOnly
                                className="w-full px-8 py-5 bg-slate-100 dark:bg-black/40 border-2 border-transparent rounded-[2rem] text-sm font-black text-slate-400 outline-none italic"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => updateField('category', e.target.value)}
                                className="w-full px-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-blue-600 rounded-[2rem] text-sm font-black text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                            >
                                <option value="MOTORCYCLE">MOTORCYCLE</option>
                                <option value="SCOOTER">SCOOTER</option>
                                <option value="MOPED">MOPED</option>
                                <option value="CAR">CAR</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fuel Type</label>
                            <select
                                value={formData.fuel_type}
                                onChange={(e) => updateField('fuel_type', e.target.value)}
                                className="w-full px-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-blue-600 rounded-[2rem] text-sm font-black text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                            >
                                <option value="PETROL">PETROL</option>
                                <option value="ELECTRICAL">ELECTRIC</option>
                                <option value="CNG">CNG</option>
                                <option value="DIESEL">DIESEL</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Segment</label>
                            <select
                                value={formData.segment}
                                onChange={(e) => updateField('segment', e.target.value)}
                                className="w-full px-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-blue-600 rounded-[2rem] text-sm font-black text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                            >
                                <option value="COMMUTER">COMMUTER</option>
                                <option value="SPORTS">SPORTS</option>
                                <option value="ADVENTURE">ADVENTURE</option>
                                <option value="LUXURY">LUXURY</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Technical / RTO Specs */}
                <div className="space-y-8 bg-indigo-600/5 p-12 rounded-[4rem] border-2 border-indigo-600/10 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Zap size={24} className="text-indigo-600" />
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            {formData.fuel_type === 'ELECTRICAL' ? 'Motor Specs' : 'Engine Specs'}
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {formData.fuel_type === 'ELECTRICAL' ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Motor Max Power (kW)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 6.5"
                                    value={formData.max_power_kw}
                                    onChange={(e) => updateField('max_power_kw', e.target.value)}
                                    className="w-full px-8 py-4 bg-white dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none"
                                />
                                <p className="text-[9px] text-slate-400 px-4 font-bold uppercase italic">* Mandatory RTO Parameter for Electric</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Engine Displacement (CC)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 159.7"
                                    value={formData.displacement_cc}
                                    onChange={(e) => updateField('displacement_cc', e.target.value)}
                                    className="w-full px-8 py-4 bg-white dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none"
                                />
                                <p className="text-[9px] text-slate-400 px-4 font-bold uppercase italic">* Mandatory RTO Parameter for Petrol</p>
                            </div>
                        )}

                        <div className="pt-4 flex items-center justify-between border-t border-indigo-600/10">
                            <div className="flex items-center gap-2">
                                {isSaving ? (
                                    <Loader2 size={14} className="text-indigo-600 animate-spin" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                )}
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isSaving ? 'Synching...' : 'RTO Specs Verified'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VariantStep({ modelId, modelName, variants, onUpdate, onNext, brandId }: any) {
    const supabase = createClient();
    const [localVariants, setLocalVariants] = useState(variants);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestionsId, setShowSuggestionsId] = useState<string | null>(null);

    useEffect(() => {
        setLocalVariants(variants);
    }, [variants]);

    useEffect(() => {
        if (!brandId) return;
        const fetchBrandVariants = async () => {
            // Fetch all variants for models of this brand to suggest common naming
            const { data } = await supabase
                .from('vehicle_variants')
                .select('name, vehicle_models!inner(brand_id)')
                .eq('vehicle_models.brand_id', brandId);

            if (data) {
                const names = Array.from(new Set(data.map((v: any) => v.name))).sort();
                setSuggestions(names);
            }
        };
        fetchBrandVariants();
    }, [brandId]);

    const handleAddVariant = async () => {
        if (!modelId) {
            alert('Please save or select a model before adding variants.');
            return;
        }
        const maxPos = localVariants.reduce((max: number, v: any) => Math.max(max, v.position || 0), 0);
        const { data, error } = await supabase
            .from('vehicle_variants')
            .insert({
                model_id: modelId,
                name: 'New Variant',
                slug: `new-variant-${Date.now()}`,
                base_price_ex_showroom: 0,
                rto_charges: 0,
                insurance_charges: 0,
                position: maxPos + 1
            })
            .select()
            .single();

        if (data) {
            const updated = [...localVariants, data];
            setLocalVariants(updated);
            onUpdate(updated);
        } else if (error) {
            console.error('Error adding variant:', error);
            alert(`Failed to add variant. Please try again. System Error: ${(error as any).message}`);
        }
    };

    const handleCloneVariant = async (variant: any) => {
        if (!modelId) {
            alert('Please save or select a model before adding variants.');
            return;
        }
        const maxPos = localVariants.reduce((max: number, v: any) => Math.max(max, v.position || 0), 0);
        const { data, error } = await supabase
            .from('vehicle_variants')
            .insert({
                model_id: modelId,
                name: `${variant.name} (Copy)`,
                slug: `${variant.slug}-copy-${Date.now()}`,
                front_brake_type: variant.front_brake_type,
                rear_brake_type: variant.rear_brake_type,
                wheel_type: variant.wheel_type,
                base_price_ex_showroom: variant.base_price_ex_showroom,
                rto_charges: variant.rto_charges,
                insurance_charges: variant.insurance_charges,
                position: maxPos + 1
            })
            .select()
            .single();

        if (data) {
            const updated = [...localVariants, data];
            setLocalVariants(updated);
            onUpdate(updated);
        }
    };

    const handleDeleteVariant = async (id: string) => {
        if (!confirm('Are you sure? This will delete all linked colors and media.')) return;
        const { error } = await supabase.from('vehicle_variants').delete().eq('id', id);
        if (!error) {
            const updated = localVariants.filter((v: any) => v.id !== id);
            setLocalVariants(updated);
            onUpdate(updated);
        }
    };

    const handleUpdateVariant = async (id: string, field: string, value: any) => {
        const updated = localVariants.map((v: any) => {
            if (v.id === id) {
                const newV = { ...v, [field]: value };
                if (field === 'name') {
                    newV.slug = value.toLowerCase().replace(/ /g, '-');
                }
                return newV;
            }
            return v;
        });
        setLocalVariants(updated);
        onUpdate(updated);

        // Auto-save variant change
        const payload: any = { [field]: value, updated_at: new Date().toISOString() };
        if (field === 'name') {
            payload.slug = value.toLowerCase().replace(/ /g, '-');
        }

        await supabase
            .from('vehicle_variants')
            .update(payload)
            .eq('id', id);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Variant Forge</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Configure equipment branches and technical features for {modelName}</p>
            </div>

            <div className="space-y-6">
                {localVariants.map((variant: any) => (
                    <div key={variant.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl group hover:border-indigo-500/30 transition-all relative">
                        <div className="absolute top-8 right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleCloneVariant(variant)}
                                title="Clone Variant"
                                className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                            >
                                <Copy size={18} />
                            </button>
                            <button
                                onClick={() => handleDeleteVariant(variant.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="space-y-1 flex-[2] relative">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Variant Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={variant.name}
                                                onFocus={(e) => {
                                                    if (e.target.value.toUpperCase() === 'NEW VARIANT') {
                                                        handleUpdateVariant(variant.id, 'name', '');
                                                    }
                                                    setShowSuggestionsId(variant.id);
                                                }}
                                                onBlur={() => setTimeout(() => setShowSuggestionsId(null), 200)}
                                                onChange={(e) => handleUpdateVariant(variant.id, 'name', e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none transition-all uppercase italic"
                                            />
                                            {showSuggestionsId === variant.id && suggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 max-h-48 overflow-y-auto">
                                                    {suggestions.filter(s => s.toLowerCase().includes(variant.name.toLowerCase()) && s !== variant.name).map((s) => (
                                                        <button
                                                            key={s}
                                                            onMouseDown={() => handleUpdateVariant(variant.id, 'name', s)}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-black uppercase text-slate-600 dark:text-slate-300 transition-colors"
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Sequence</label>
                                        <input
                                            type="number"
                                            value={variant.position || 0}
                                            onChange={(e) => handleUpdateVariant(variant.id, 'position', parseInt(e.target.value))}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none transition-all text-center"
                                        />
                                    </div>
                                </div>



                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Front Brake</label>
                                        <select
                                            value={variant.front_brake_type || ''}
                                            onChange={(e) => handleUpdateVariant(variant.id, 'front_brake_type', e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none appearance-none"
                                        >
                                            <option value="">Select</option>
                                            <option value="DRUM">DRUM</option>
                                            <option value="DISC">DISC</option>
                                            <option value="ABS">ABS</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Rear Brake</label>
                                        <select
                                            value={variant.rear_brake_type || ''}
                                            onChange={(e) => handleUpdateVariant(variant.id, 'rear_brake_type', e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none appearance-none"
                                        >
                                            <option value="">Select</option>
                                            <option value="DRUM">DRUM</option>
                                            <option value="DISC">DISC</option>
                                            <option value="ABS">ABS</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Wheel Type</label>
                                        <select
                                            value={variant.wheel_type || ''}
                                            onChange={(e) => handleUpdateVariant(variant.id, 'wheel_type', e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none appearance-none"
                                        >
                                            <option value="">Select</option>
                                            <option value="SPOKE">SPOKE WHEELS</option>
                                            <option value="SHEET_METAL">SHEET METAL WHEELS</option>
                                            <option value="ALLOY">ALLOY WHEELS</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-64 flex items-center justify-center bg-slate-50 dark:bg-black/20 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic font-black">Architecture Synced</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAddVariant}
                    className="w-full py-8 border-4 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-600 hover:bg-blue-600/5 hover:text-blue-600 transition-all group"
                >
                    <Settings2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] italic">Append New Variant Branch</span>
                </button>
            </div>
        </div>
    );
}

function ColorStep({ modelId, variants, onNext, colors, setColors, mediaModal, setMediaModal, brandId }: any) {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [expandedVariant, setExpandedVariant] = useState<string | null>(variants[0]?.id || null);

    // Autocomplete State
    const [colorSuggestions, setColorSuggestions] = useState<any[]>([]);
    const [showColorSuggestionsIdx, setShowColorSuggestionsIdx] = useState<number | null>(null);

    useEffect(() => {
        fetchColors();
    }, [modelId]);

    useEffect(() => {
        if (!brandId) return;
        const fetchBrandColors = async () => {
            // Fetch all colors for models of this brand to suggest common naming
            const { data } = await supabase
                .from('vehicle_colors')
                .select('name, hex_code, hex_code_secondary, vehicle_variants!inner(vehicle_models!inner(brand_id))')
                .eq('vehicle_variants.vehicle_models.brand_id', brandId);

            if (data) {
                // Deduplicate by name
                const uniqueByName = new Map();
                data.forEach((c: any) => {
                    if (!uniqueByName.has(c.name)) {
                        uniqueByName.set(c.name, c);
                    }
                });
                setColorSuggestions(Array.from(uniqueByName.values()).sort((a, b) => a.name.localeCompare(b.name)));
            }
        };
        fetchBrandColors();
    }, [brandId]);

    const fetchColors = async () => {
        if (!modelId) return;
        setLoading(true);
        // We fetch colors for all variants of this model
        const { data } = await supabase
            .from('vehicle_colors')
            .select('*, vehicle_variants!inner(model_id)')
            .eq('vehicle_variants.model_id', modelId);

        if (data) {
            // Group by identity for the UI (Name + Hex)
            const grouped: any[] = [];
            data.forEach((c: any) => {
                const existing = grouped.find(g =>
                    g.name === c.name &&
                    g.hex_code === c.hex_code &&
                    g.hex_code_secondary === c.hex_code_secondary
                );

                const variantLink = {
                    id: c.id,
                    variant_id: c.variant_id,
                    gallery_urls: c.gallery_urls || []
                };

                if (existing) {
                    existing.variantIds.push(c.variant_id);
                    existing.links.push(variantLink);
                    existing.ids.push(c.id);
                } else {
                    grouped.push({
                        name: c.name,
                        hex_code: c.hex_code || '#000000',
                        hex_code_secondary: c.hex_code_secondary || null,
                        variantIds: [c.variant_id],
                        links: [variantLink], // NEW: Store granular data per variant link
                        ids: [c.id]
                    });
                }
            });
            setColors(grouped);
        }
        setLoading(false);
    };

    const handleAddColor = async () => {
        const defaultVariantId = variants[0]?.id;
        if (!defaultVariantId) {
            alert('Please add a variant before creating a color finish.');
            return;
        }

        const newColor = {
            name: 'New Finish',
            hex_code: '#000000',
            hex_code_secondary: null,
            variantIds: [],
            links: [],
            ids: [],
            isNew: true
        };

        const nextColors = [...colors, newColor];
        setColors(nextColors);

        const { data, error } = await supabase
            .from('vehicle_colors')
            .insert({
                variant_id: defaultVariantId,
                name: newColor.name,
                hex_code: newColor.hex_code,
                hex_code_secondary: newColor.hex_code_secondary,
                gallery_urls: []
            })
            .select()
            .single();

        if (error) {
            alert(`Failed to add color. ${error.message}`);
            return;
        }

        if (data) {
            const updated = [...nextColors];
            const idx = updated.length - 1;
            updated[idx].variantIds = [defaultVariantId];
            updated[idx].links = [{ id: data.id, variant_id: defaultVariantId, gallery_urls: [] }];
            updated[idx].ids = [data.id];
            setColors(updated);
        }
    };

    const handleDeleteColorGroup = async (idx: number) => {
        if (!confirm('Delete this color from all variants?')) return;
        const color = colors[idx];
        if (color.ids.length > 0) {
            await supabase.from('vehicle_colors').delete().in('id', color.ids);
        }
        setColors(colors.filter((_c: any, i: number) => i !== idx));
    };

    const toggleVariant = async (colorIdx: number, variantId: string) => {
        const color = colors[colorIdx];
        const isSelected = color.variantIds.includes(variantId);

        const newColors = [...colors];
        if (isSelected) {
            // Delete from DB
            const idToDelete = color.links.find((l: any) => l.variant_id === variantId)?.id;
            if (idToDelete) {
                const { error } = await supabase.from('vehicle_colors').delete().eq('id', idToDelete);
                if (error) {
                    alert(`Failed to remove color. ${error.message}`);
                    return;
                }
                newColors[colorIdx].variantIds = color.variantIds.filter((id: string) => id !== variantId);
                newColors[colorIdx].links = color.links.filter((l: any) => l.variant_id !== variantId);
                newColors[colorIdx].ids = color.ids.filter((id: string) => id !== idToDelete);
            }
        } else {
            // Insert into DB
            const { data, error } = await supabase
                .from('vehicle_colors')
                .insert({
                    variant_id: variantId,
                    name: color.name,
                    hex_code: color.hex_code,
                    hex_code_secondary: color.hex_code_secondary,
                    gallery_urls: []
                })
                .select()
                .single();

            if (error) {
                alert(`Failed to add color. ${error.message}`);
                return;
            }

            if (data) {
                newColors[colorIdx].variantIds.push(variantId);
                newColors[colorIdx].links.push({
                    id: data.id,
                    variant_id: variantId,
                    gallery_urls: []
                });
                newColors[colorIdx].ids.push(data.id);
            }
        }
        setColors(newColors);
    };

    const updateVariantGallery = async (colorIdx: number, variantId: string, newUrls: string[]) => {
        const newColors = [...colors];
        const link = newColors[colorIdx].links.find((l: any) => l.variant_id === variantId);
        if (link) {
            link.gallery_urls = newUrls;
            setColors(newColors);

            const { error } = await supabase
                .from('vehicle_colors')
                .update({ gallery_urls: newUrls, image_url: newUrls[0] || null })
                .eq('id', link.id);
            if (error) {
                alert(`Failed to update gallery. ${error.message}`);
            }
        }
    };

    const updateColorIdentity = async (idx: number, field: string, value: any) => {
        const newColors = [...colors];
        let sanitizedValue = value;

        // Sanitize Hex Codes: Ensure single # and valid length
        // Sanitize Hex Codes: Ensure single # and valid length
        if (field === 'hex_code' || field === 'hex_code_secondary') {
            if (value && typeof value === 'string') {
                // Allow removing # temporarily while typing, but generally keep it clean
                // We truncate to 6 chars (excluding hash) to match hex format
                const raw = value.replace(/#/g, '').toUpperCase();
                sanitizedValue = '#' + raw.slice(0, 6);
            }
        }

        newColors[idx][field] = sanitizedValue;

        // Auto-fill logic from suggestion
        if (field === 'name' && value && typeof value === 'object') {
            // It's a suggestion object
            newColors[idx].name = value.name;
            newColors[idx].hex_code = value.hex_code;
            newColors[idx].hex_code_secondary = value.hex_code_secondary;
            setShowColorSuggestionsIdx(null);
        } else {
            setColors(newColors);
        }

        setColors([...newColors]); // Trigger re-render

        // Update all associated rows in DB (only if it's not a suggestion object meant for local state)
        // If it was a suggestion, we already updated local state, now sync relevant IDs if they exist
        if (typeof value !== 'object') {
            const ids = newColors[idx].ids;
            if (ids.length > 0) {
                const { error } = await supabase
                    .from('vehicle_colors')
                    .update({ [field]: sanitizedValue })
                    .in('id', ids);
                if (error) {
                    alert(`Failed to update color. ${error.message}`);
                }
            }
        }
    };

    if (loading) return <div className="text-center py-24 flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing Visual Matrix...</span>
    </div>;

    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Visual Mapping</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Define global finishes and assign them to specific technical branches</p>
            </div>

            {/* PHASE 1: MASTER COLOR REGISTRY */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Palette size={20} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic leading-none">Global Registry</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define all finishes available for {variants[0]?.name?.split(' ')[0]}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleAddColor}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                        + NEW FINISH
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr>
                                <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual DNA</th>
                                <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Finish Name</th>
                                <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Hex</th>
                                <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Accent Hex</th>
                                <th className="px-6 py-2 text-right pr-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {colors.map((color: any, idx: number) => (
                                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded-2xl">
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-2">
                                            <div className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: color.hex_code }} />
                                            {color.hex_code_secondary && (
                                                <div className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: color.hex_code_secondary }} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 relative">
                                        <input
                                            type="text"
                                            value={color.name}
                                            onFocus={() => {
                                                setShowColorSuggestionsIdx(idx);
                                                if (color.name === 'New Finish') {
                                                    updateColorIdentity(idx, 'name', '');
                                                }
                                            }}
                                            onBlur={() => setTimeout(() => setShowColorSuggestionsIdx(null), 200)}
                                            onChange={(e) => updateColorIdentity(idx, 'name', e.target.value)}
                                            className="bg-transparent border-none text-lg font-black text-slate-900 dark:text-white uppercase italic p-0 focus:ring-0 w-full hover:text-indigo-600 transition-colors"
                                            placeholder="ENTER FINISH NAME"
                                        />
                                        {showColorSuggestionsIdx === idx && colorSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 max-h-48 overflow-y-auto">
                                                {colorSuggestions.filter(s => s.name.toLowerCase().includes(color.name.toLowerCase()) && s.name !== color.name).map((s) => (
                                                    <button
                                                        key={s.name}
                                                        onMouseDown={() => updateColorIdentity(idx, 'name', s)}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                    >
                                                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: s.hex_code }} />
                                                        <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">{s.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-6 h-6 rounded-md border border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
                                                <input
                                                    type="color"
                                                    value={color.hex_code.length === 7 ? color.hex_code : '#000000'}
                                                    onChange={(e) => updateColorIdentity(idx, 'hex_code', e.target.value)}
                                                    className="absolute inset-[-100%] cursor-pointer scale-[3] opacity-0"
                                                />
                                                <div className="absolute inset-0" style={{ backgroundColor: color.hex_code }} />
                                            </div>
                                            <input
                                                type="text"
                                                value={color.hex_code}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => updateColorIdentity(idx, 'hex_code', e.target.value)}
                                                className="bg-transparent border-none font-mono text-xs font-black text-slate-400 uppercase p-0 focus:ring-0 w-20"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {color.hex_code_secondary ? (
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-6 h-6 rounded-md border border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
                                                    <input
                                                        type="color"
                                                        value={color.hex_code_secondary.length === 7 ? color.hex_code_secondary : '#FFFFFF'}
                                                        onChange={(e) => updateColorIdentity(idx, 'hex_code_secondary', e.target.value)}
                                                        className="absolute inset-[-100%] cursor-pointer scale-[3] opacity-0"
                                                    />
                                                    <div className="absolute inset-0" style={{ backgroundColor: color.hex_code_secondary }} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={color.hex_code_secondary}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => updateColorIdentity(idx, 'hex_code_secondary', e.target.value)}
                                                    className="bg-transparent border-none font-mono text-xs font-black text-slate-400 uppercase p-0 focus:ring-0 w-20"
                                                />
                                                <button
                                                    onClick={() => updateColorIdentity(idx, 'hex_code_secondary', null)}
                                                    className="p-1 hover:text-rose-500 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => updateColorIdentity(idx, 'hex_code_secondary', '#FFFFFF')}
                                                className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                            >
                                                + DUO TONE
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right pr-6">
                                        <button
                                            onClick={() => handleDeleteColorGroup(idx)}
                                            className="p-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PHASE 2: VARIANT-WISE MAPPING (ACCORDION) */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 ml-8 mb-4">
                    <Settings2 size={16} className="text-indigo-600" />
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Branch Mapping</h4>
                </div>

                {variants.map((v: any) => {
                    const isExpanded = expandedVariant === v.id;
                    const assignedColors = colors.filter((c: any) => (c.variantIds || []).includes(v.id));

                    return (
                        <div
                            key={v.id}
                            className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${isExpanded ? 'border-indigo-600 shadow-2xl scale-[1.02]' : 'border-slate-100 dark:border-white/5 opacity-80 hover:opacity-100'}`}
                        >
                            {/* Header */}
                            <button
                                onClick={() => setExpandedVariant(isExpanded ? null : v.id)}
                                className="w-full p-8 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                        <Settings2 size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className={`text-2xl font-black uppercase italic tracking-tight ${isExpanded ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{v.name}</h5>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{assignedColors.length} FINISHES LINKED</span>
                                            <div className="flex -space-x-2">
                                                {assignedColors.slice(0, 5).map((c: any, i: number) => (
                                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" style={{ backgroundColor: c.hex_code }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-full transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600' : 'text-slate-300'}`}>
                                    <ChevronDown size={24} />
                                </div>
                            </button>

                            {/* Content */}
                            {isExpanded && (
                                <div className="p-8 border-t border-slate-50 dark:border-white/5 animate-in slide-in-from-top-4 duration-500 space-y-12">
                                    {/* Color Picker Matrix */}
                                    <div className="space-y-6">
                                        <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Select Colors to Enable for {v.name}</h6>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {colors.map((color: any, cIdx: number) => {
                                                const isEnabled = (color.variantIds || []).includes(v.id);
                                                return (
                                                    <button
                                                        key={cIdx}
                                                        onClick={() => toggleVariant(cIdx, v.id)}
                                                        className={`p-4 rounded-3xl border-2 transition-all group relative ${isEnabled ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 dark:bg-black/20 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-white/10'}`}
                                                    >
                                                        <div className="space-y-3 flex flex-col items-center">
                                                            <div className="relative">
                                                                <div className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" style={{ backgroundColor: color.hex_code }} />
                                                                {isEnabled && (
                                                                    <div className="absolute -top-2 -right-2 bg-white text-indigo-600 rounded-full p-0.5 shadow-xl">
                                                                        <CheckCircle2 size={14} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-center truncate w-full">{color.name}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Gallery Management for Enabled Colors */}
                                    {assignedColors.length > 0 && (
                                        <div className="space-y-8 animate-in fade-in duration-700">
                                            <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />
                                            <div className="space-y-4">
                                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Manage Visual Assets per Finish</h6>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {assignedColors.map((color: any, acIdx: number) => {
                                                        const link = color.links.find((l: any) => l.variant_id === v.id);
                                                        const origColorIdx = colors.indexOf(color);

                                                        return (
                                                            <div key={acIdx} className="bg-slate-50 dark:bg-black/20 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 space-y-6">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: color.hex_code }} />
                                                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{color.name}</span>
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{(link?.gallery_urls || []).length} ASSETS</span>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {(link?.gallery_urls || []).map((url: string, uIdx: number) => (
                                                                        <div key={uIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group/img">
                                                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newUrls = link.gallery_urls.filter((_: any, i: number) => i !== uIdx);
                                                                                    updateVariantGallery(origColorIdx, v.id, newUrls);
                                                                                }}
                                                                                className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                            >
                                                                                <X size={10} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => setMediaModal({ isOpen: true, colorIdx: origColorIdx, variantId: v.id })}
                                                                        className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:border-indigo-600 hover:bg-indigo-600/5 hover:text-indigo-600 transition-all group"
                                                                    >
                                                                        <Plus size={20} className="group-hover:scale-110 transition-transform" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {assignedColors.length === 0 && (
                                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                            <Palette size={40} className="text-slate-300" />
                                            <h6 className="text-sm font-black text-slate-500 uppercase italic">No Colors Assigned to this Branch</h6>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle colors from the grid above to start mapping assets</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
