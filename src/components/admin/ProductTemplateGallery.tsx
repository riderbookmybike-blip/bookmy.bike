'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    LayoutDashboard,
    X,
    Loader2,
    Code,
    Edit,
    ChevronRight,
    Trash2,
    Type,
    List,
    Hash,
    Image as ImageIcon,
    Link as LinkIcon,
    Settings,
    GripVertical,
    Check,
    Building2,
    Car,
    Palette,
    Wrench,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CatalogTemplate {
    id: string;
    name: string;
    code: string;
    category: 'VEHICLE' | 'ACCESSORY' | 'SERVICE';
    hierarchy_config: any;
    attribute_config: any;
    features_config?: {
        suitable_for?: boolean;
        related_products?: boolean;
        suitability_level?: 'BRAND' | 'MODEL' | 'VARIANT';
    };
    created_at: string;
}

const TEMPLATE_CATEGORIES = [
    { value: 'VEHICLE', label: 'Vehicle', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'ACCESSORY', label: 'Accessory', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'SERVICE', label: 'Service', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
];

interface ProductTemplateGalleryProps {
    initialTemplates: CatalogTemplate[];
}

const FIELD_TYPES = [
    { type: 'text', label: 'Text', icon: Type },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'select', label: 'List (Select)', icon: List },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'url', label: 'URL', icon: LinkIcon },
    { type: 'service_schedule', label: 'Service Schedule', icon: Wrench },
    { type: 'warranty', label: 'Warranty Scheme', icon: ShieldCheck },
    // { type: 'reference', label: 'Reference', icon: LinkIcon }, // Advanced, maybe V2
];

const ATTRIBUTE_LEVELS = [
    { key: 'brand', label: 'Brand Level Attributes', description: 'Attributes that apply to the brand', icon: Building2, color: 'indigo' },
    { key: 'model', label: 'Model Level Attributes', description: 'Attributes that apply to all variants of a model', icon: Car, color: 'emerald' },
    { key: 'variant', label: 'Variant Level Attributes', description: 'Attributes specific to each variant', icon: Palette, color: 'purple' }
];

export function ProductTemplateGallery({ initialTemplates }: ProductTemplateGalleryProps) {
    const [templates, setTemplates] = useState<CatalogTemplate[]>(initialTemplates);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<CatalogTemplate | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [step, setStep] = useState(1); // 1: Identity, 2: Hierarchy, 3: Attributes
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'VEHICLE' as 'VEHICLE' | 'ACCESSORY' | 'SERVICE',
        hierarchy: { l1: 'Variant', l2: 'Color', l1_input_type: 'text' as 'text' | 'lookup' },
        attributes: {
            brand: [] as any[],
            model: [] as any[],
            variant: [] as any[]
        },
        features: {
            suitable_for: false,
            related_products: false,
            suitability_level: 'VARIANT' as 'BRAND' | 'MODEL' | 'VARIANT'
        }
    });

    const refreshTemplates = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('cat_templates').select('*').order('name');
        if (data) setTemplates(data);
    };

    const openCreateModal = () => {
        setEditingTemplate(null);
        setStep(1);
        setFormData({
            name: '',
            code: '',
            category: 'VEHICLE',
            hierarchy: { l1: 'Variant', l2: 'Color', l1_input_type: 'text' },
            attributes: {
                brand: [],
                model: [
                    { key: 'item_code', label: 'Item Code', type: 'text' },
                    { key: 'weight', label: 'Weight', type: 'number', suffix: 'kg' }
                ],
                variant: []
            },
            features: {
                suitable_for: false,
                related_products: false,
                suitability_level: 'VARIANT'
            }
        });
        setIsModalOpen(true);
    };

    const openEditModal = (tmpl: CatalogTemplate) => {
        setEditingTemplate(tmpl);
        setStep(1);

        // Handle both old flat array format and new object format
        const attrConfig = tmpl.attribute_config;
        let attributes: { brand: any[]; model: any[]; variant: any[] };

        if (Array.isArray(attrConfig)) {
            // Old format: migrate flat array to model level
            attributes = { brand: [], model: attrConfig, variant: [] };
        } else if (attrConfig && typeof attrConfig === 'object') {
            // New format: use as-is with defaults
            attributes = {
                brand: attrConfig.brand || [],
                model: attrConfig.model || [],
                variant: attrConfig.variant || []
            };
        } else {
            attributes = { brand: [], model: [], variant: [] };
        }

        setFormData({
            name: tmpl.name,
            code: tmpl.code,
            category: tmpl.category || 'VEHICLE',
            hierarchy: {
                l1: tmpl.hierarchy_config?.l1 || 'Variant',
                l2: tmpl.hierarchy_config?.l2 || 'Color',
                l1_input_type: tmpl.hierarchy_config?.l1_input_type || 'text'
            },
            attributes,
            features: {
                suitable_for: tmpl.features_config?.suitable_for || false,
                related_products: tmpl.features_config?.related_products || false,
                suitability_level: tmpl.features_config?.suitability_level || 'VARIANT'
            }
        });
        setIsModalOpen(true);
    };

    const formatUUIDToCode = (uuid: string) => {
        if (!uuid) return '';
        const cleanId = uuid.replace(/-/g, '').toUpperCase();
        const last9 = cleanId.slice(-9);
        const matches = last9.match(/.{1,3}/g);
        return matches ? matches.join('-') : last9;
    };

    const handleSave = async () => {
        try {
            setSaveLoading(true);
            setError(null);

            const supabase = createClient();

            // Clean attributes for each level (trim options)
            const cleanLevel = (attrs: any[]) => attrs.map(attr => {
                if (attr.type === 'select' && attr.options) {
                    return { ...attr, options: attr.options.map((s: string) => s.trim()).filter(Boolean) };
                }
                return attr;
            });

            const cleanAttributes = {
                brand: cleanLevel(formData.attributes.brand),
                model: cleanLevel(formData.attributes.model),
                variant: cleanLevel(formData.attributes.variant)
            };

            const payload = {
                name: formData.name,
                code: (formData.code || '').toUpperCase().trim(),
                category: formData.category,
                hierarchy_config: formData.hierarchy,
                attribute_config: cleanAttributes,
                features_config: formData.features
            };

            if (editingTemplate) {
                const { error: updateError } = await supabase
                    .from('cat_templates')
                    .update(payload)
                    .eq('id', editingTemplate.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('cat_templates')
                    .insert(payload);
                if (insertError) throw insertError;
            }

            setIsModalOpen(false);
            setEditingTemplate(null);
            refreshTemplates();

        } catch (err: any) {
            setError(err.message || "Failed to save template");
        } finally {
            setSaveLoading(false);
        }
    };

    // --- SUB-COMPONENTS FOR EDITOR ---

    const addAttribute = (level: 'brand' | 'model' | 'variant') => {
        const newAttr = {
            key: `field_${Date.now()}`,
            label: 'New Field',
            type: 'text'
        };
        setFormData({
            ...formData,
            attributes: {
                ...formData.attributes,
                [level]: [...formData.attributes[level], newAttr]
            }
        });
    };

    const updateAttribute = (level: 'brand' | 'model' | 'variant', index: number, updates: any) => {
        const newAttrs = [...formData.attributes[level]];
        newAttrs[index] = { ...newAttrs[index], ...updates };

        // Auto-generate key from label if it looks like a default key or empty
        if (updates.label && (newAttrs[index].key.startsWith('field_') || !newAttrs[index].key)) {
            newAttrs[index].key = updates.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        }

        setFormData({
            ...formData,
            attributes: {
                ...formData.attributes,
                [level]: newAttrs
            }
        });
    };

    const deleteAttribute = (level: 'brand' | 'model' | 'variant', index: number) => {
        const newAttrs = formData.attributes[level].filter((_: any, i: number) => i !== index);
        setFormData({
            ...formData,
            attributes: {
                ...formData.attributes,
                [level]: newAttrs
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={openCreateModal}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all"
                >
                    <Plus size={16} />
                    New Product Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(t => (
                    <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group hover:shadow-lg relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <LayoutDashboard size={24} />
                            </div>

                            <button
                                onClick={() => openEditModal(t)}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            >
                                <Edit size={16} />
                            </button>
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors block mb-1">
                            {t.code}
                        </span>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {t.name}
                        </h3>
                        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${TEMPLATE_CATEGORIES.find(c => c.value === t.category)?.color || 'bg-slate-100 text-slate-500'
                            }`}>
                            {t.category || 'VEHICLE'}
                        </span>
                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between text-xs text-slate-500 border-b border-slate-100 dark:border-white/5 pb-2">
                                <span>Hierarchy</span>
                                <span className="font-mono text-indigo-600">
                                    {Object.values(t.hierarchy_config || {}).join(' → ')}
                                </span>
                            </div>
                            <div className="pt-2">
                                <div className="flex justify-between text-[10px] items-center mb-1">
                                    <span className="text-slate-400 uppercase font-bold tracking-tight">Attributes Breakup</span>
                                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                                        {(() => {
                                            const config = t.attribute_config;
                                            if (Array.isArray(config)) return config.length;
                                            if (!config || typeof config !== 'object') return 0;
                                            return (config.brand?.length || 0) + (config.model?.length || 0) + (config.variant?.length || 0);
                                        })()} Fields
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    {(() => {
                                        const config = t.attribute_config;
                                        const stats = Array.isArray(config)
                                            ? { b: 0, m: config.length, v: 0 }
                                            : {
                                                b: config?.brand?.length || 0,
                                                m: config?.model?.length || 0,
                                                v: config?.variant?.length || 0
                                            };

                                        return (
                                            <>
                                                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-1 rounded text-[9px] text-center">
                                                    <span className="block text-indigo-400 font-black uppercase">BR</span>
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-300">{stats.b}</span>
                                                </div>
                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-1 rounded text-[9px] text-center">
                                                    <span className="block text-emerald-400 font-black uppercase">MO</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-300">{stats.m}</span>
                                                </div>
                                                <div className="bg-purple-50 dark:bg-purple-900/20 px-1.5 py-1 rounded text-[9px] text-center">
                                                    <span className="block text-purple-400 font-black uppercase">VA</span>
                                                    <span className="font-bold text-purple-600 dark:text-purple-300">{stats.v}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual Editor Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10 shrink-0">
                                <div>
                                    <h2 className="text-xl font-black italic uppercase text-slate-900 dark:text-white tracking-tighter">
                                        {editingTemplate ? 'Edit Product Template' : 'Create Product Template'}
                                    </h2>
                                    <div className="flex gap-4 mt-2">
                                        <button onClick={() => setStep(1)} className={`text-xs font-bold uppercase tracking-wider transition-colors ${step === 1 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>1. Identity</button>
                                        <button onClick={() => setStep(2)} className={`text-xs font-bold uppercase tracking-wider transition-colors ${step === 2 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>2. Hierarchy</button>
                                        <button onClick={() => setStep(3)} className={`text-xs font-bold uppercase tracking-wider transition-colors ${step === 3 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>3. Attributes</button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-black/20">
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium mb-6">
                                        {error}
                                    </div>
                                )}

                                {/* STEP 1: IDENTITY */}
                                {step === 1 && (
                                    <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-right-8 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-400">Template Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Engine Oil"
                                                className="w-full h-14 px-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-black text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <label className="text-xs font-bold uppercase text-slate-400">Unique Code (System ID)</label>
                                                {editingTemplate && (
                                                    <button
                                                        onClick={() => setFormData({ ...formData, code: formatUUIDToCode(editingTemplate.id) })}
                                                        className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                                                    >
                                                        Use UUID Format
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                placeholder="e.g. XXX-XXX-XXX"
                                                className="w-full h-14 px-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-mono text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-400">Category</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {TEMPLATE_CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, category: cat.value as any })}
                                                        className={`p-4 rounded-xl border-2 transition-all font-bold uppercase text-sm tracking-wide ${formData.category === cat.value
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        {cat.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: HIERARCHY */}
                                {step === 2 && (
                                    <div className="space-y-8 max-w-2xl mx-auto animate-in slide-in-from-right-8 duration-300">
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xl">1</div>
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Level 1 (Grouping)</label>
                                                    <input
                                                        value={formData.hierarchy.l1}
                                                        onChange={(e) => setFormData({ ...formData, hierarchy: { ...formData.hierarchy, l1: e.target.value } })}
                                                        className="w-full text-2xl font-black text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-200"
                                                        placeholder="Variant"
                                                    />
                                                    <p className="text-[10px] text-slate-400">The parent container (e.g. 'Variant', 'Style', 'Type').</p>
                                                </div>
                                            </div>

                                            {/* L1 Input Type Toggle */}
                                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                                <label className="text-xs font-bold uppercase text-slate-400 mb-3 block">Input Mode for {formData.hierarchy.l1 || 'Level 1'}</label>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, hierarchy: { ...formData.hierarchy, l1_input_type: 'text' } })}
                                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${formData.hierarchy.l1_input_type === 'text'
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hierarchy.l1_input_type === 'text'
                                                                ? 'border-indigo-500 bg-indigo-500'
                                                                : 'border-slate-300'
                                                                }`}>
                                                                {formData.hierarchy.l1_input_type === 'text' && (
                                                                    <Check size={12} className="text-white" />
                                                                )}
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                                    <Type size={14} /> Free Text
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">User types the name manually</p>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, hierarchy: { ...formData.hierarchy, l1_input_type: 'lookup' } })}
                                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${formData.hierarchy.l1_input_type === 'lookup'
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hierarchy.l1_input_type === 'lookup'
                                                                ? 'border-indigo-500 bg-indigo-500'
                                                                : 'border-slate-300'
                                                                }`}>
                                                                {formData.hierarchy.l1_input_type === 'lookup' && (
                                                                    <Check size={12} className="text-white" />
                                                                )}
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                                    <List size={14} /> Global Lookup
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">Select from the global catalog</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <ChevronRight className="rotate-90 text-slate-300" size={32} />
                                        </div>

                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 font-black text-xl">2</div>
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold uppercase text-slate-400">Level 2 (Unit)</label>
                                                    <input
                                                        value={formData.hierarchy.l2}
                                                        onChange={(e) => setFormData({ ...formData, hierarchy: { ...formData.hierarchy, l2: e.target.value } })}
                                                        className="w-full text-2xl font-black text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-200"
                                                        placeholder="Color"
                                                    />
                                                    <p className="text-[10px] text-slate-400">The individual sellable unit (e.g. 'Color', 'Size', 'Finish').</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: ATTRIBUTES */}
                                {step === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                                        {ATTRIBUTE_LEVELS.map((level) => {
                                            const LevelIcon = level.icon;
                                            const levelKey = level.key as 'brand' | 'model' | 'variant';
                                            const attrs = formData.attributes[levelKey];
                                            const colorClasses = {
                                                indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/30',
                                                emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30',
                                                purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30'
                                            };
                                            const iconColors = {
                                                indigo: 'text-indigo-600 dark:text-indigo-400',
                                                emerald: 'text-emerald-600 dark:text-emerald-400',
                                                purple: 'text-purple-600 dark:text-purple-400'
                                            };
                                            const buttonColors = {
                                                indigo: 'hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50',
                                                emerald: 'hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50',
                                                purple: 'hover:text-purple-600 hover:border-purple-600 hover:bg-purple-50'
                                            };

                                            return (
                                                <div key={level.key} className={`rounded-2xl border ${colorClasses[level.color as keyof typeof colorClasses]} overflow-hidden`}>
                                                    {/* Section Header */}
                                                    <div className="px-6 py-4 flex items-center gap-3">
                                                        <LevelIcon size={20} className={iconColors[level.color as keyof typeof iconColors]} />
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">{level.label}</h4>
                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{level.description}</p>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400">{attrs.length} fields</span>
                                                    </div>

                                                    {/* Attribute List */}
                                                    <div className="bg-white dark:bg-slate-900 px-4 py-2 space-y-3">
                                                        {attrs.map((attr: any, idx: number) => (
                                                            <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 group hover:ring-2 hover:ring-slate-200 transition-all">
                                                                <div className="grid grid-cols-12 gap-4 items-start">
                                                                    <div className="col-span-1 pt-2 text-slate-300 cursor-move">
                                                                        <GripVertical size={18} />
                                                                    </div>

                                                                    <div className="col-span-4 space-y-1">
                                                                        <label className="text-[10px] uppercase font-bold text-slate-400">Label</label>
                                                                        <input
                                                                            value={attr.label}
                                                                            onChange={(e) => updateAttribute(levelKey, idx, { label: e.target.value })}
                                                                            placeholder="Field Label"
                                                                            className="w-full font-bold text-slate-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
                                                                        />
                                                                    </div>

                                                                    <div className="col-span-3 space-y-1">
                                                                        <label className="text-[10px] uppercase font-bold text-slate-400">Type</label>
                                                                        <select
                                                                            value={attr.type}
                                                                            onChange={(e) => updateAttribute(levelKey, idx, { type: e.target.value })}
                                                                            className="w-full text-sm font-medium bg-white dark:bg-black/20 rounded-lg px-2 py-1 outline-none appearance-none"
                                                                        >
                                                                            {FIELD_TYPES.map(ft => (
                                                                                <option key={ft.type} value={ft.type}>{ft.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div className="col-span-3">
                                                                        {attr.type === 'select' && (
                                                                            <div className="space-y-1">
                                                                                <label className="text-[10px] uppercase font-bold text-slate-400">Options</label>
                                                                                <input
                                                                                    value={attr.options ? attr.options.join(',') : ''}
                                                                                    onChange={(e) => updateAttribute(levelKey, idx, { options: e.target.value.split(',') })}
                                                                                    placeholder="Opt A, Opt B"
                                                                                    className="w-full text-sm bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {attr.type === 'number' && (
                                                                            <div className="space-y-1">
                                                                                <label className="text-[10px] uppercase font-bold text-slate-400">Unit Suffix</label>
                                                                                <input
                                                                                    value={attr.suffix || ''}
                                                                                    onChange={(e) => updateAttribute(levelKey, idx, { suffix: e.target.value })}
                                                                                    placeholder="kg, cc"
                                                                                    className="w-full text-sm bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="col-span-1 flex justify-end pt-1">
                                                                        <button
                                                                            onClick={() => deleteAttribute(levelKey, idx)}
                                                                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Add Button */}
                                                        <button
                                                            onClick={() => addAttribute(levelKey)}
                                                            className={`w-full py-3 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 ${buttonColors[level.color as keyof typeof buttonColors]} dark:hover:bg-opacity-10 transition-all font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2`}
                                                        >
                                                            <Plus size={14} /> Add {level.key.charAt(0).toUpperCase() + level.key.slice(1)} Attribute
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
                                <div className="text-xs font-medium text-slate-400">
                                    {step === 1 ? 'Start with the template name.' : step === 2 ? 'Define the 2-level structure.' : 'Add custom data fields.'}
                                </div>
                                <div className="flex gap-3">
                                    {step > 1 && (
                                        <button
                                            onClick={() => setStep(step - 1)}
                                            className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200"
                                        >
                                            Back
                                        </button>
                                    )}
                                    {step < 3 ? (
                                        <button
                                            onClick={() => setStep(step + 1)}
                                            disabled={!formData.name}
                                            className="px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 disabled:opacity-50"
                                        >
                                            Next Step <ChevronRight size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSave}
                                            disabled={saveLoading}
                                            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {saveLoading && <Loader2 className="animate-spin" size={14} />}
                                            <Check size={16} /> Save Template
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
