'use client';

import React, { useState } from 'react';
import { X, Loader2, ShoppingBag, Globe, ChevronRight, Settings2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AttributeInput from '@/components/catalog/AttributeInput';

interface AddBrandModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (brandName: string) => void;
    initialData?: any; // NEW for editing
    template?: any; // NEW for template-driven specs
}

export default function AddBrandModal({ isOpen, onClose, onSuccess, initialData, template }: AddBrandModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        landingUrl: '',
        logo_svg: '', // Keep for backward compat
        brand_logos: { original: '', dark: '', light: '' } as Record<string, string>,
        specifications: {} as Record<string, any>
    });

    const [activeTheme, setActiveTheme] = useState<'original' | 'dark' | 'light'>('original');

    const [isAdaptive, setIsAdaptive] = useState(false);
    const supabase = createClient();

    React.useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                landingUrl: initialData.website_url || '',
                logo_svg: initialData.logo_svg || '',
                brand_logos: initialData.brand_logos || { original: initialData.logo_svg || '', dark: '', light: '' },
                specifications: initialData.specifications || {}
            });
            setIsAdaptive(false);
        } else {
            setFormData({
                name: '',
                landingUrl: '',
                logo_svg: '',
                brand_logos: { original: '', dark: '', light: '' },
                specifications: {}
            });
            setIsAdaptive(false);
        }
    }, [initialData, isOpen]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                let svgCode = event.target?.result as string;

                // --- SVG Scaling Fix ---
                // If viewBox is missing but width/height exist, inject viewBox
                if (!svgCode.includes('viewBox') && svgCode.includes('width=') && svgCode.includes('height=')) {
                    const wMatch = svgCode.match(/width="([^"]+)"/);
                    const hMatch = svgCode.match(/height="([^"]+)"/);
                    if (wMatch && hMatch) {
                        const w = wMatch[1].replace('px', '');
                        const h = hMatch[1].replace('px', '');
                        svgCode = svgCode.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`);
                    }
                }
                // --- Adaptive Logic ---
                if (isAdaptive) {
                    svgCode = svgCode
                        .replace(/fill="[^"]*"/g, 'fill="currentColor"')
                        .replace(/stroke="[^"]*"/g, 'stroke="currentColor"');
                    if (!svgCode.includes('fill="currentColor"')) {
                        svgCode = svgCode.replace('<svg', '<svg fill="currentColor"');
                    }
                }
                setFormData(prev => ({
                    ...prev,
                    brand_logos: {
                        ...prev.brand_logos,
                        [activeTheme]: svgCode
                    },
                    // Sync original to legacy field if editing original
                    logo_svg: activeTheme === 'original' ? svgCode : prev.logo_svg
                }));
            };
            reader.readAsText(file);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let brandId = initialData?.id;

            if (initialData?.id) {
                const { error } = await supabase
                    .from('cat_brands')
                    .update({
                        name: formData.name,
                        website_url: formData.landingUrl,
                        logo_svg: formData.brand_logos.original, // Sync original
                        brand_logos: formData.brand_logos,
                        specifications: formData.specifications
                    })
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('cat_brands').insert([{
                    name: formData.name,
                    slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                    website_url: formData.landingUrl,
                    logo_svg: formData.brand_logos.original,
                    brand_logos: formData.brand_logos,
                    specifications: formData.specifications,
                    is_active: true
                }]).select('id').single();
                if (error) throw error;
                if (data) brandId = data.id;
            }

            onSuccess(formData.name);
            onClose();
            setFormData({
                name: '',
                landingUrl: '',
                logo_svg: '',
                brand_logos: { original: '', dark: '', 'light': '' },
                specifications: {}
            });

        } catch (error: any) {
            console.error('Error adding brand:', error);
            alert('Failed to add brand: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/5">
                {/* Header Section */}
                <div className="p-12 pb-0 text-center space-y-4">
                    <div className="w-20 h-20 rounded-[2rem] bg-indigo-600/10 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="text-indigo-600" size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2">Structural Inventory</p>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            {initialData ? 'Modify Brand' : 'Register Brand'}
                        </h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] max-w-xs mx-auto">Establish a new manufacturer branch in the master catalog system</p>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="p-12 pt-8 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Manufacturer Identity (Make)</label>
                            <input
                                required
                                autoFocus
                                placeholder="e.g. HONDA, TVS, HERO"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                className="w-full px-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] text-lg font-black text-slate-900 dark:text-white outline-none transition-all uppercase italic"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Official Landing URL</label>
                            <div className="relative group">
                                <Globe size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    placeholder="https://www.honda2wheelers.com"
                                    value={formData.landingUrl}
                                    onChange={e => setFormData({ ...formData, landingUrl: e.target.value })}
                                    className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] text-sm font-black text-slate-900 dark:text-white outline-none transition-all italic"
                                />
                            </div>
                        </div>

                        {/* Template-driven Brand Specifications */}
                        {template?.attribute_config?.brand?.length > 0 && (
                            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4 ml-4">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                                        <Settings2 className="text-indigo-600" size={16} />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest italic">
                                        Manufacturer Specifications
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-6 px-4">
                                    {template.attribute_config.brand.map((attr: any) => (
                                        <AttributeInput
                                            key={attr.name}
                                            attr={attr}
                                            value={formData.specifications[attr.name]}
                                            onChange={(val) => setFormData(prev => ({
                                                ...prev,
                                                specifications: { ...prev.specifications, [attr.name]: val }
                                            }))}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between ml-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Logo Identity</label>

                                <div className="flex bg-slate-100 dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-white/5">
                                    {(['original', 'dark', 'light'] as const).map(theme => (
                                        <button
                                            key={theme}
                                            type="button"
                                            onClick={() => {
                                                setActiveTheme(theme);
                                                // Auto-toggle adaptive depending on theme
                                                setIsAdaptive(theme !== 'original');
                                            }}
                                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${activeTheme === theme
                                                ? 'bg-white dark:bg-indigo-500 text-indigo-600 dark:text-white shadow-md'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end mb-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdaptive(!isAdaptive)}
                                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${isAdaptive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-transparent'}`}
                                >
                                    {isAdaptive ? 'Start with Adaptive Logic' : 'Start with Raw Colors'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative group/upload h-40">
                                    <input
                                        type="file"
                                        accept=".svg"
                                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                        onChange={handleFileUpload}
                                    />
                                    <div className="w-full h-full border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-2 group-hover/upload:border-indigo-600 group-hover/upload:bg-indigo-600/5 transition-all text-slate-400 group-hover/upload:text-indigo-600">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                                            <Globe size={18} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-center">
                                            Click to Upload<br />
                                            <span className="text-indigo-500">{activeTheme.toUpperCase()}</span> SVG
                                        </span>
                                    </div>
                                </div>

                                <div className={`h-40 rounded-[3rem] border-2 border-transparent p-6 flex items-center justify-center overflow-hidden relative group shadow-inner transition-colors duration-500 ${activeTheme === 'dark' ? 'bg-slate-900 border-indigo-500/30' :
                                    activeTheme === 'light' ? 'bg-white border-slate-200' :
                                        'bg-slate-50 dark:bg-black/20'
                                    }`}>
                                    {formData.brand_logos[activeTheme] ? (
                                        <>
                                            <div
                                                className={`w-full h-full flex items-center justify-center 
                                                    [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full 
                                                    ${isAdaptive ? '[&>svg]:fill-current' : ''} 
                                                    ${activeTheme === 'dark' ? 'text-white' :
                                                        activeTheme === 'light' ? 'text-slate-900' :
                                                            'text-slate-900 dark:text-white'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: formData.brand_logos[activeTheme] }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    brand_logos: { ...prev.brand_logos, [activeTheme]: '' }
                                                }))}
                                                className="absolute top-4 right-4 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Globe size={24} className={activeTheme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest italic ${activeTheme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {activeTheme} Preview
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <textarea
                                placeholder={`Edit raw SVG code for ${activeTheme} theme`}
                                value={formData.brand_logos[activeTheme]}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    brand_logos: { ...prev.brand_logos, [activeTheme]: e.target.value }
                                }))}
                                className="w-full px-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] text-[9px] font-mono text-slate-900 dark:text-white outline-none transition-all h-24 resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-5 rounded-[2rem] bg-slate-100 dark:bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name}
                            className="flex-[2] px-8 py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3 italic disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>
                                    {initialData ? 'Apply Updates' : 'Initialize Brand Identity'} <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
