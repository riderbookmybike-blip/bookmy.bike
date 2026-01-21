'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ShieldCheck, ImageIcon, Video, FileText, Plus, Edit2, Box, CheckCircle2, ChevronLeft, Layers, Grid3X3, Palette, Fuel, Gauge, Zap, Upload, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SKUMediaManager from '@/components/catalog/SKUMediaManager';
import Modal from '@/components/ui/Modal';
import AttributeInput from '@/components/catalog/AttributeInput';
import { toast } from 'sonner';

const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : null;
};

// Start of Helper Function
function toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}
// End of Helper Function

export default function FamilyStep({ brand, template, familyData, families = [], stats = {}, onSave, onDelete }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: familyData?.name || '',
        specs: {
            ...familyData?.specs,
            engine_cc: familyData?.specs?.engine_cc || familyData?.specs?.engine_capacity || '',
            fuel_capacity: familyData?.specs?.fuel_capacity || familyData?.specs?.fuel_tank_capacity || familyData?.specs?.tank_capacity || familyData?.specs?.fuel_tank || '',
            mileage: familyData?.specs?.mileage || familyData?.specs?.arai_mileage || ''
        },
        price_base: familyData?.price_base || 0,
        item_tax_rate: familyData?.item_tax_rate || 18,
        hsn_code: familyData?.hsn_code || ''
    });
    const [isMediaOpen, setIsMediaOpen] = useState(false);

    const [hsnList, setHsnList] = useState<any[]>([]);
    const [hsnSearch, setHsnSearch] = useState('');
    const [isHsnOpen, setIsHsnOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchHSN = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('hsn_codes').select('*').eq('is_active', true);
            if (data) setHsnList(data);
        };
        fetchHSN();
    }, []);

    useEffect(() => {
        if (formData.hsn_code && hsnList.length > 0) {
            const selected = hsnList.find(h => h.code === formData.hsn_code);
            if (selected) setHsnSearch(`${selected.code} • ${selected.class || selected.description} (${selected.gst_rate}%)`);
        }
    }, [formData.hsn_code, hsnList]);

    const handleAutoSave = async () => {
        if (!formData.name) return;
        setIsSaving(true);
        try {
            const supabase = createClient();
            const payload = {
                ...formData,
                name: toTitleCase(formData.name), // Enforce Title Case
                template_id: template.id,
                brand_id: brand.id,
                type: 'FAMILY',
                slug: (brand.name + '-' + formData.name)
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
                    .replace(/\s+/g, '-')           // Spaces to dashes
                    .replace(/-+/g, '-')            // Multiple dashes to single
                    .replace(/^-|-$/g, ''),         // Trim leading/trailing dashes
                status: 'ACTIVE'
            };

            let data, error;

            if (familyData?.id) {
                // UPDATE existing record
                const result = await supabase.from('catalog_items')
                    .update(payload)
                    .eq('id', familyData.id)
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            } else {
                // INSERT new record
                const result = await supabase.from('catalog_items')
                    .insert(payload)
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            }

            if (error) throw error;

            if (data) {
                onSave(data);
                toast.success('Model saved successfully');
            }
        } catch (error: any) {
            console.error('Save failed details:', JSON.stringify(error, null, 2));
            toast.error('Failed to save model: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    const saveRef = useRef(handleAutoSave);
    saveRef.current = handleAutoSave;

    useEffect(() => {
        if (!formData.name) return;
        const timer = setTimeout(() => saveRef.current(), 1500);
        return () => clearTimeout(timer);
    }, [formData]);

    useEffect(() => {
        return () => {
            saveRef.current();
        };
    }, []);

    const hsnRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (hsnRef.current && !hsnRef.current.contains(e.target as Node)) {
                setIsHsnOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">Select Model from {brand.name}</label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {families && families.map((fam: any) => {
                        // Dynamic key specs derived from template attributes
                        // We take the first 3 attributes of any type for the quick view
                        const keyAttributes = template?.attribute_config?.model?.slice(0, 3) || [];

                        return (
                            <div
                                key={fam.id}
                                className={`group relative p-5 rounded-[2.5rem] border-2 transition-all duration-300 text-left overflow-hidden flex flex-col justify-between gap-4 min-h-[300px] hover:-translate-y-1 ${familyData?.id === fam.id
                                    ? 'border-indigo-600 bg-indigo-50/10'
                                    : 'border-slate-100 bg-white dark:bg-white/5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5'
                                    }`}
                            >
                                <div className="w-full aspect-[4/3] rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-white/5 group-hover:border-indigo-100 transition-all relative">
                                    {fam.specs?.primary_image ? (
                                        <>
                                            <img src={fam.specs.primary_image} alt={fam.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            {/* Media Strip Overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                                                <Upload size={24} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Overlay */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData({
                                                    name: fam.name,
                                                    specs: {
                                                        ...fam.specs,
                                                        engine_cc: fam.specs?.engine_cc || fam.specs?.engine_capacity || '',
                                                        fuel_capacity: fam.specs?.fuel_capacity || fam.specs?.fuel_tank_capacity || fam.specs?.tank_capacity || fam.specs?.fuel_tank || '',
                                                        mileage: fam.specs?.mileage || fam.specs?.arai_mileage || ''
                                                    },
                                                    price_base: fam.price_base || 0,
                                                    item_tax_rate: fam.item_tax_rate || 18,
                                                    hsn_code: fam.hsn_code || ''
                                                });
                                                onSave(fam);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-2 bg-white dark:bg-slate-900 rounded-full text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-white/10 hover:border-indigo-500 transition-colors"
                                            title="Edit Model"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("Are you sure you want to delete this model?")) {
                                                    const deleteModel = async () => {
                                                        try {
                                                            onDelete && await onDelete(fam.id);
                                                            toast.success('Model deleted');
                                                        } catch (err) {
                                                            toast.error('Failed to delete model');
                                                        }
                                                    };
                                                    deleteModel();
                                                }
                                            }}
                                            className="p-2 bg-white dark:bg-slate-900 rounded-full text-slate-400 hover:text-rose-600 shadow-sm border border-slate-100 dark:border-white/10 hover:border-rose-500 transition-colors"
                                            title="Delete Model"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>

                                </div>
                                <div className="w-full">
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase italic text-xl leading-none mb-1">{fam.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Model Family</p>

                                    {/* Quick Specs Preview - Dynamic */}
                                    {keyAttributes.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-t border-slate-100 dark:border-white/5">
                                            {keyAttributes.map((attr: any, i: number) => (
                                                <div key={attr.key} className={`text-center ${i < keyAttributes.length - 1 ? 'border-r border-slate-100 dark:border-white/5' : ''}`}>
                                                    <div className="flex items-center justify-center gap-1 text-[9px] uppercase text-slate-400 font-bold mb-0.5">
                                                        {attr.type === 'number' ? <Gauge size={10} /> : <Box size={10} />}
                                                        {attr.label?.split(' ')[0] || attr.key}
                                                    </div>
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                        {fam.specs?.[attr.key] ? (
                                                            Array.isArray(fam.specs[attr.key])
                                                                ? `${fam.specs[attr.key].length} Items`
                                                                : `${fam.specs[attr.key]}${(attr.suffix && !attr.label?.toLowerCase().includes('material') && !(attr.key === 'weight' && attr.type === 'select')) ? attr.suffix : ''}`
                                                        ) : '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // Fallback / No Specs logic or cleaner spacing
                                        <div className="mb-4 py-3 border-t border-slate-100 dark:border-white/5 flex justify-center">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                                {template.name}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
                                        {/* Media Assets (Left) */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-slate-400" title="Gallery Images">
                                                <ImageIcon size={14} />
                                                <span className="text-[10px] font-bold">{fam.specs?.gallery?.length || 0}</span>
                                            </div>
                                            {fam.specs?.video_urls?.length > 0 && (
                                                <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center border border-rose-100 dark:border-rose-500/20" title="Videos Available">
                                                    <Video size={12} fill="currentColor" />
                                                </div>
                                            )}
                                            {fam.specs?.pdf_urls?.length > 0 && (
                                                <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center border border-blue-100 dark:border-blue-500/20" title="Documents Available">
                                                    <FileText size={12} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Matrix Stats (Right) */}
                                        <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-1" title="Variants">
                                                <Layers size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{stats[fam.id]?.variants || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1" title="Colors">
                                                <Palette size={14} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{stats[fam.id]?.colors || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1" title="SKUs">
                                                <Grid3X3 size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{stats[fam.id]?.skus || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {familyData?.id === fam.id && (
                                    <div className="absolute top-6 right-6 text-emerald-500 pointer-events-none">
                                        <CheckCircle2 size={24} fill="currentColor" className="text-white" />
                                    </div>
                                )}
                                {/* Hitbox for standard selection */}
                                <div
                                    className="absolute inset-0 z-0 cursor-pointer"
                                    onClick={() => {
                                        onSave(fam);
                                    }}
                                />
                            </div>
                        );
                    })}

                    {/* Create Model Card */}
                    <button
                        onClick={() => {
                            setFormData({
                                name: '',
                                specs: {},
                                price_base: 0,
                                item_tax_rate: 18,
                                hsn_code: ''
                            });
                            onSave(null);
                            setIsModalOpen(true);
                        }}
                        className="group relative h-full border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-indigo-600 shadow-sm min-h-[300px]"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                            <Plus size={32} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">Create New Model</span>
                    </button>
                </div>

                {/* Empty State Helper */}
                {
                    (!families || families.length === 0) && (
                        <div className="text-center py-12 opacity-50">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">No models found for this brand. Create one to get started.</p>
                        </div>
                    )
                }

                {/* Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={familyData?.id ? `Edit ${familyData.name}` : 'Create New Model'}
                    size="xl"
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex items-end justify-between">
                            <div className="space-y-2 text-left w-full">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Model Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="text-4xl font-black uppercase italic bg-transparent border-b-2 border-slate-100 dark:border-white/10 focus:border-indigo-500 outline-none w-full placeholder:text-slate-200 dark:placeholder:text-white/10"
                                    placeholder="e.g. JUPITER"
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isSaving ? 'text-indigo-500' : 'text-emerald-500 opacity-0'}`}>
                                    {isSaving ? 'Saving...' : 'Saved'}
                                </span>
                                {familyData?.id && (
                                    <button
                                        onClick={() => {
                                            if (confirm("Delete this model?")) {
                                                try {
                                                    onDelete && onDelete(familyData.id);
                                                    setIsModalOpen(false);
                                                    toast.success('Model deleted');
                                                } catch (e) {
                                                    toast.error('Failed to delete');
                                                }
                                            }
                                        }}
                                        className="p-2 ml-4 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors bg-rose-50/50"
                                        title="Delete Model"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                            {/* Dynamic Attribute Inputs */}
                            {(Array.isArray(template?.attribute_config) ? template.attribute_config : (template?.attribute_config?.model || [])).map((attr: any) => (
                                <div key={attr.key} className={`space-y-2 ${attr.type === 'service_schedule' || attr.type === 'warranty' ? 'col-span-full' : ''}`}>
                                    <label
                                        className="text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-help dashed-underline decoration-slate-300"
                                        title={`Key: ${attr.key} | Type: ${attr.type} | Suffix: ${attr.suffix || 'None'}`}
                                    >
                                        {attr.label}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <AttributeInput
                                            attr={attr}
                                            value={formData.specs[attr.key]}
                                            onChange={(val) => setFormData({
                                                ...formData,
                                                specs: { ...formData.specs, [attr.key]: val }
                                            })}
                                        />
                                        {attr.suffix && !attr.label?.toLowerCase().includes('material') && !(attr.key === 'weight' && attr.type === 'select') && (
                                            <span className="text-xs font-bold text-indigo-400 text-[10px] uppercase tracking-wider">{attr.suffix}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="space-y-2 relative" ref={hsnRef}>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">HSN Code & Tax Class</label>
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setIsHsnOpen(true); setHsnSearch(''); }}>
                                    <span className="font-bold text-sm">{formData.hsn_code || 'Select HSN...'}</span>
                                    {formData.item_tax_rate > 0 && <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded">{formData.item_tax_rate}% GST</span>}
                                </div>
                                {isHsnOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-20">
                                        <div className="p-2 border-b border-slate-100 dark:border-white/5 sticky top-0 bg-white dark:bg-slate-900">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search HSN code..."
                                                className="w-full text-xs p-2 bg-slate-50 dark:bg-white/5 rounded-lg outline-none"
                                                value={hsnSearch}
                                                onChange={(e) => setHsnSearch(e.target.value)}
                                            />
                                        </div>
                                        {hsnList.filter(h => !hsnSearch || h.code.includes(hsnSearch) || h.description.toLowerCase().includes(hsnSearch.toLowerCase())).map(h => (
                                            <button
                                                key={h.code}
                                                onClick={() => {
                                                    setFormData({ ...formData, hsn_code: h.code, item_tax_rate: h.gst_rate });
                                                    setIsHsnOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold border-b border-slate-100 dark:border-white/10 last:border-0"
                                            >
                                                <div className="flex justify-between">
                                                    <span>{h.code}</span>
                                                    <span className="text-indigo-500">{h.gst_rate}% GST</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 truncate">{h.class || h.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>



                        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic mb-3">Product Assets</h4>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {/* Image Previews */}
                                    {formData.specs.gallery?.length > 0 ? (
                                        formData.specs.gallery.slice(0, 4).map((img: string, i: number) => (
                                            <div key={i} className="w-12 h-12 shrink-0 rounded-lg bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 overflow-hidden">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-12 h-12 shrink-0 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                            <ImageIcon size={16} className="text-slate-400" />
                                        </div>
                                    )}

                                    {/* Video Previews */}
                                    {formData.specs.video_urls?.map((vid: string, i: number) => (
                                        <div key={`v-${i}`} className="w-12 h-12 shrink-0 rounded-lg bg-black relative overflow-hidden border border-slate-200 dark:border-white/10 group">
                                            <img src={getYoutubeThumbnail(vid) || ''} alt="" className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                    <Video size={10} className="text-white fill-current" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* PDF Previews */}
                                    {formData.specs.pdf_urls?.map((pdf: string, i: number) => (
                                        <div key={`p-${i}`} className="w-12 h-12 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center" title="Document">
                                            <FileText size={16} className="text-blue-500" />
                                        </div>
                                    ))}

                                    {(!formData.specs.gallery?.length && !formData.specs.video_urls?.length && !formData.specs.pdf_urls?.length) && (
                                        <span className="text-[10px] uppercase font-bold text-slate-400">No assets uploaded yet</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMediaOpen(true)}
                                className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-colors shadow-sm flex items-center gap-2 shrink-0 whitespace-nowrap"
                            >
                                <ImageIcon size={14} /> Manage Media
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end pt-8 border-t border-slate-100 dark:border-white/5 mt-8">
                        <button
                            onClick={async () => {
                                await handleAutoSave(); // Force save before closing
                                setIsModalOpen(false);
                            }}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                        >
                            {isSaving ? 'Saving...' : 'Done'}
                        </button>
                    </div>
                    {/* Debug Info */}
                    <div className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-black/50 p-4 rounded-xl overflow-x-auto mt-4">
                        DEBUG: {JSON.stringify(formData.specs)}
                    </div>
                </Modal>

                {
                    isMediaOpen && (
                        <SKUMediaManager
                            skuName={formData.name || 'Product Family'}
                            initialImages={formData.specs.gallery || []}
                            initialVideos={formData.specs.video_urls || []}
                            initialPdfs={formData.specs.pdf_urls || []}
                            initialPrimary={formData.specs.primary_image}
                            onSave={async (images, videos, pdfs, primary, applyToAll) => {
                                setFormData({
                                    ...formData,
                                    specs: {
                                        ...formData.specs,
                                        gallery: images,
                                        video_urls: videos,
                                        pdf_urls: pdfs,
                                        primary_image: primary
                                    }
                                });

                                if (applyToAll && familyData?.id) {
                                    const supabase = createClient();
                                    // Fetch all SKUs for this family
                                    const { data: allSkus } = await supabase
                                        .from('catalog_items')
                                        .select('id, specs')
                                        .eq('brand_id', brand.id)
                                        .eq('template_id', template.id)
                                        .eq('type', 'SKU');

                                    // Filter locally for family (since family_id is not a direct column, parent_id links to variant, variant links to family)
                                    // Actually, we can just use the catalogItems from state or fetch variants first.
                                    // But a simpler way is to just let the user use the "Sync" button in MatrixStep.
                                    // Actually, user wants it to work. 
                                    // Let's simplify: if they check "Apply to All", we'll tell them to use the Sync button in SKU Matrix for now, 
                                    // OR we can implement a more robust broadcast here.

                                    // Better: Update all SKUs that belong to this family.
                                    // Find variants of this family first.
                                    const { data: variants } = await supabase
                                        .from('catalog_items')
                                        .select('id')
                                        .eq('parent_id', familyData.id)
                                        .eq('type', 'VARIANT');

                                    if (variants && variants.length > 0) {
                                        const variantIds = variants.map(v => v.id);
                                        const { data: skusToUpdate } = await supabase
                                            .from('catalog_items')
                                            .select('id, specs')
                                            .in('parent_id', variantIds)
                                            .eq('type', 'SKU');

                                        if (skusToUpdate) {
                                            const updates = skusToUpdate.map(sku => {
                                                return supabase.from('catalog_items').update({
                                                    video_url: videos[0] || null,
                                                    specs: {
                                                        ...sku.specs,
                                                        video_urls: videos,
                                                        pdf_urls: pdfs
                                                    }
                                                }).eq('id', sku.id);
                                            });
                                            await Promise.all(updates);
                                        }
                                    }
                                }
                            }}
                            onClose={() => setIsMediaOpen(false)}
                        />
                    )
                }
            </div >
        </div >
    );
}
