'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Plus, Loader2, AlertCircle, CheckCircle2, Users, Package, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sanitizeSvg } from '@/lib/utils/sanitizeSvg';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenantId: string;
}

export default function NewRequisitionModal({ isOpen, onClose, onSuccess, tenantId }: ModalProps) {
    const supabase = createClient();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Catalog Data
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [variants, setVariants] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);

    // Selections
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [customerName, setCustomerName] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchBrands();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setStep(1);
        setSelectedBrand(null);
        setSelectedModel(null);
        setSelectedVariant(null);
        setSelectedColor(null);
        setQuantity(1);
        setCustomerName('');
        setNotes('');
        setError(null);
    };

    const fetchBrands = async () => {
        setLoading(true);
        const { data } = await supabase.from('cat_brands').select('*').eq('is_active', true).order('name');
        setBrands(data || []);
        setLoading(false);
    };

    const fetchModels = async (brandId: string) => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('cat_models')
            .select('*')
            .eq('brand_id', brandId)
            .eq('status', 'ACTIVE');
        setModels(data || []);
        setLoading(false);
    };

    const fetchVariants = async (modelId: string) => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('cat_variants_vehicle')
            .select('*')
            .eq('model_id', modelId)
            .eq('status', 'ACTIVE');
        setVariants(data || []);
        setLoading(false);
    };

    const fetchColors = async (variantId: string) => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('cat_skus')
            .select('*')
            .eq('vehicle_variant_id', variantId)
            .eq('status', 'ACTIVE');
        setColors(data || []);
        setLoading(false);
    };

    const handleBrandSelect = (id: string) => {
        setSelectedBrand(id);
        fetchModels(id);
        setStep(2);
    };

    const handleModelSelect = (id: string) => {
        setSelectedModel(id);
        fetchVariants(id);
        setStep(3);
    };

    const handleVariantSelect = (id: string) => {
        setSelectedVariant(id);
        fetchColors(id);
        setStep(4);
    };

    const handleColorSelect = (id: string) => {
        setSelectedColor(id);
        setStep(5);
    };

    const handleSubmit = async () => {
        if (!selectedColor || !tenantId) return;
        setLoading(true);
        setError(null);

        try {
            const { createRequest } = await import('@/actions/inventory');

            // For vehicles, we create multiple per-unit requests for strict tracking
            for (let i = 0; i < quantity; i++) {
                const res = await createRequest({
                    tenant_id: tenantId,
                    sku_id: selectedColor,
                    source_type: 'DIRECT',
                    items: [], // Baseline costs can be added in a refinement phase
                });

                if (!res.success) throw new Error(res.message);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission Error:', err);
            setError(err.message || 'Failed to create requisition');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/5 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                New Requisition
                            </h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Step {step} of 5 • {step === 5 ? 'Finalize Details' : 'Select Product'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 shrink-0">
                    <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-none">
                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
                            <AlertCircle size={20} />
                            <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
                        </div>
                    )}

                    {/* Step 1: Select Brand */}
                    {step === 1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {brands.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => handleBrandSelect(b.id)}
                                    className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl hover:border-purple-500 hover:bg-purple-500/5 transition-all group flex flex-col items-center gap-4"
                                >
                                    {b.logo_svg ? (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: sanitizeSvg(b.logo_svg) }}
                                            className="w-12 h-12 [&>svg]:w-full [&>svg]:h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-black text-slate-400">
                                            {b.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate w-full text-center">
                                        {b.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Select Model */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 gap-3">
                            {models.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleModelSelect(m.id)}
                                    className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-purple-500 hover:bg-purple-500/5 transition-all flex items-center justify-between group"
                                >
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                        {m.name}
                                    </span>
                                    <ChevronRight className="text-slate-300 group-hover:text-purple-500" size={18} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 3: Select Variant */}
                    {step === 3 && (
                        <div className="grid grid-cols-1 gap-3">
                            {variants.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => handleVariantSelect(v.id)}
                                    className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-purple-500 hover:bg-purple-500/5 transition-all flex flex-col gap-1 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">
                                            {v.name}
                                        </span>
                                        <ChevronRight
                                            className="text-slate-300 group-hover:text-purple-500"
                                            size={18}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {v.engine_cc ? `${v.engine_cc}cc` : '—'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 4: Select Color */}
                    {step === 4 && (
                        <div className="grid grid-cols-1 gap-3">
                            {colors.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleColorSelect(c.id)}
                                    className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-purple-500 hover:bg-purple-500/5 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/20"
                                            style={{ backgroundColor: c.hex_primary || '#ccc' }}
                                        />
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">
                                            {c.name}
                                        </span>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-purple-500" size={18} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 5: Finalize */}
                    {step === 5 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Card */}
                            <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-[2rem] flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-500">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest">
                                            Target Vehicle
                                        </h4>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase italic">
                                            {brands.find(b => b.id === selectedBrand)?.name}{' '}
                                            {models.find(m => m.id === selectedModel)?.name}
                                        </p>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase">
                                            {variants.find(v => v.id === selectedVariant)?.name} •{' '}
                                            {colors.find(c => c.id === selectedColor)?.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                        <ArrowRight size={10} className="text-purple-500" /> Quantity
                                    </label>
                                    <div className="flex items-center gap-4 p-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 font-black text-xl hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            -
                                        </button>
                                        <span className="flex-1 text-center font-black text-xl text-slate-900 dark:text-white">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl hover:scale-105 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                        <Users size={12} className="text-indigo-500" /> Customer Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="EX: RAHUL SHARMA..."
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:ring-2 focus:ring-purple-500/20 uppercase tracking-widest placeholder:text-slate-400/50"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                        <AlertCircle size={12} className="text-amber-500" /> Internal Notes
                                    </label>
                                    <textarea
                                        placeholder="ANY SPECIFIC DELIVERY TIMELINE OR ACCESSORY REQUIREMENTS..."
                                        rows={3}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl py-4 px-6 text-sm font-black focus:outline-none focus:ring-2 focus:ring-purple-500/20 uppercase tracking-widest placeholder:text-slate-400/50"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-4 shrink-0 mt-auto">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 px-8 py-5 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            Back
                        </button>
                    )}

                    {step === 5 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-[2] px-8 py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:scale-105 disabled:opacity-50 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3 italic"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            {loading ? 'Initiating Demand...' : 'Confirm Requisition'}
                        </button>
                    ) : (
                        <button
                            disabled={
                                step === 5 ||
                                (step === 1 && !selectedBrand) ||
                                (step === 2 && !selectedModel) ||
                                (step === 3 && !selectedVariant) ||
                                (step === 4 && !selectedColor)
                            }
                            className="flex-[2] px-8 py-5 rounded-[2rem] bg-slate-100 dark:bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                        >
                            Select Options to Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
