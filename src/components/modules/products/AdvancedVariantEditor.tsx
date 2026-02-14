// @ts-nocheck
'use client';

import React, { useState } from 'react';
import {
    Box,
    ChevronDown,
    ChevronRight,
    Copy,
    Trash2,
    Plus,
    Info,
    Settings2,
    ShieldCheck,
    Zap,
    FileCheck,
    Check,
} from 'lucide-react';

// Local Spec interface for the editor's internal logic
interface Specification {
    [key: string]: string | number;
}

import { ModelVariant, ModelColor } from '@/types/productMaster';

interface AdvancedVariantEditorProps {
    modelName: string;
    variants: ModelVariant[];
    brandColors: ModelColor[];
    onAddVariant: (data: Partial<ModelVariant>) => void;
    onUpdateVariant: (variantId: string, field: string, value: any) => void;
    onDeleteVariant: (variantId: string) => void;
    onCloneVariant: (variantId: string) => void;
    onUpdateColor: (colorId: string, field: string, value: any) => void;
}

const SPEC_CATEGORIES = [
    {
        id: 'engine',
        name: 'Engine & Performance',
        icon: Zap,
        fields: ['Displacement', 'Max Power', 'Max Torque', 'Cooling System', 'Fuel System'],
    },
    {
        id: 'transmission',
        name: 'Transmission & Brakes',
        icon: Settings2,
        fields: ['Clutch Type', 'Transmission Type', 'Front Brake', 'Rear Brake', 'ABS'],
    },
    {
        id: 'dimensions',
        name: 'Dimensions & Weight',
        icon: Info,
        fields: ['Length', 'Width', 'Height', 'Wheelbase', 'Ground Clearance', 'Kerb Weight'],
    },
    {
        id: 'safety',
        name: 'Safety & Security',
        icon: ShieldCheck,
        fields: ['Odometer', 'Speedometer', 'Fuel Gauge', 'Low Fuel Indicator', 'Pass Light'],
    },
    {
        id: 'compliance',
        name: 'Regulatory & Compliance',
        icon: FileCheck, // Note: I need to import this or use another icon
        fields: ['HSN Code', 'GST Rate (%)'],
    },
];

export default function AdvancedVariantEditor({
    modelName,
    variants,
    brandColors,
    onAddVariant,
    onUpdateVariant,
    onDeleteVariant,
    onCloneVariant,
    onUpdateColor,
}: AdvancedVariantEditorProps) {
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [editingColorsForVariantId, setEditingColorsForVariantId] = useState<string | null>(null);

    const handleToggleColorForVariant = (color: ModelColor, variantId: string) => {
        const currentVariantIds = color.variantIds || [];
        let newVariantIds;
        if (currentVariantIds.includes(variantId)) {
            newVariantIds = currentVariantIds.filter(id => id !== variantId);
        } else {
            newVariantIds = [...currentVariantIds, variantId];
        }
        onUpdateColor(color.id, 'variantIds', newVariantIds);
    };

    const toggleSection = (id: string) => {
        setExpandedSections(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));
    };

    const [expandedVariantIds, setExpandedVariantIds] = useState<string[]>([]);

    const toggleVariantExpand = (id: string) => {
        setExpandedVariantIds(prev => (prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]));
    };

    const [isModelExpanded, setIsModelExpanded] = useState(true);

    return (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tree Root: Model Node */}
            <div className="relative">
                <div
                    onClick={() => setIsModelExpanded(!isModelExpanded)}
                    className={`relative z-10 p-4 bg-white dark:bg-slate-900 border-[3px] ${isModelExpanded ? 'border-blue-600 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] bg-blue-500/[0.02]' : 'border-slate-200 dark:border-white/5'} rounded-[2rem] flex items-center justify-between shadow-xl cursor-pointer transition-all duration-500 group`}
                >
                    <div className="flex gap-3 items-center">
                        <div
                            className={`p-3 rounded-xl transition-all duration-500 ${isModelExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-blue-500'}`}
                        >
                            <Box size={22} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none italic">
                                Parent Model Entity
                            </p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic group-hover:text-blue-600 transition-colors">
                                {modelName}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                {variants.length} Variants
                            </span>
                        </div>
                        <div
                            className={`p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 transition-transform duration-500 ${isModelExpanded ? 'rotate-180' : ''}`}
                        >
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>

                {/* Vertical Tree Line */}
                {isModelExpanded && variants.length > 0 && (
                    <div className="absolute left-[34px] top-[60px] bottom-0 w-[2px] bg-gradient-to-b from-blue-600/50 via-blue-500/30 to-transparent z-0 blur-[0.5px]" />
                )}

                {/* Tree Branches: Variants */}
                {isModelExpanded && (
                    <div className="mt-4 space-y-4 pl-16 animate-in slide-in-from-top-4 duration-500">
                        {variants.map((v, idx) => {
                            const isExpandedVariant = expandedVariantIds.includes(v.id);
                            return (
                                <div key={v.id} className="relative group/var">
                                    {/* Horizontal Branch Line */}
                                    <div className="absolute -left-[30px] top-[32px] w-[30px] h-[2px] bg-blue-500/20 group-hover/var:bg-blue-600/40 transition-colors blur-[0.5px]" />

                                    <div
                                        className={`bg-white dark:bg-slate-900 rounded-[1.5rem] border ${isExpandedVariant ? 'border-blue-500 shadow-2xl shadow-blue-500/10' : 'border-slate-200 dark:border-white/5'} overflow-hidden transition-all duration-500`}
                                    >
                                        {/* Variant Header Slot */}
                                        <div
                                            onClick={() => toggleVariantExpand(v.id)}
                                            className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm italic transition-all duration-500 shadow-inner ${isExpandedVariant ? 'bg-blue-600 text-white shadow-blue-500/40' : 'bg-slate-100 dark:bg-white/5 text-slate-300 group-hover/var:text-blue-500'}`}
                                                >
                                                    {v.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={v.name}
                                                            onClick={e => e.stopPropagation()}
                                                            onChange={e =>
                                                                onUpdateVariant(v.id, 'name', e.target.value)
                                                            }
                                                            className="text-base font-black text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 hover:text-blue-600 transition-colors uppercase tracking-tight w-full max-w-xs"
                                                        />
                                                        <div className="flex gap-1 opacity-40">
                                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                                            <div className="w-1 h-1 rounded-full bg-blue-400" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                                        <div className="w-3 h-[1px] bg-slate-200 dark:bg-white/10" />
                                                        Core Variant Branch
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {/* Metadata Pillars - Industrial Feel */}
                                                <div className="hidden xl:flex items-center gap-6 mr-4 border-l border-slate-100 dark:border-white/5 pl-6">
                                                    <div className="text-right">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                                            Distribution
                                                        </p>
                                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase italic">
                                                            14 Dealers
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                                            Inventory
                                                        </p>
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase italic tracking-wider">
                                                            In Stock
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Color Availability Circles */}
                                                {/* Color Availability Circles */}
                                                <div className="relative">
                                                    {/* Collapsed View */}
                                                    {editingColorsForVariantId !== v.id && (
                                                        <div
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setEditingColorsForVariantId(v.id);
                                                            }}
                                                            className="flex -space-x-2 mr-4 group-hover/var:mr-2 transition-all cursor-pointer hover:scale-105"
                                                            title="Manage Colors"
                                                        >
                                                            {brandColors.filter(c => c.variantIds.includes(v.id))
                                                                .length > 0 ? (
                                                                brandColors
                                                                    .filter(c => c.variantIds.includes(v.id))
                                                                    .map(c => (
                                                                        <div
                                                                            key={c.id}
                                                                            title={c.name}
                                                                            className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
                                                                            style={{ backgroundColor: c.code }}
                                                                        />
                                                                    ))
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center">
                                                                    <Plus size={10} className="text-slate-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Expanded 'Edit Mode' Popover (Inline) */}
                                                    {editingColorsForVariantId === v.id && (
                                                        <div
                                                            className="absolute right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 animate-in zoom-in-95 duration-200"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <div className="flex gap-1.5 max-w-[200px] flex-wrap">
                                                                {brandColors.map(c => {
                                                                    const isActive = c.variantIds.includes(v.id);
                                                                    return (
                                                                        <button
                                                                            key={c.id}
                                                                            onClick={() =>
                                                                                handleToggleColorForVariant(c, v.id)
                                                                            }
                                                                            title={c.name}
                                                                            className={`w-6 h-6 rounded-full border-2 transition-all relative ${isActive ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                                                                            style={{ backgroundColor: c.code }}
                                                                        >
                                                                            {isActive && (
                                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                                    <div className="w-1.5 h-1.5 bg-white dark:bg-white rounded-full shadow-sm" />
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                                                            <button
                                                                onClick={() => setEditingColorsForVariantId(null)}
                                                                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                <Check size={14} className="text-green-500" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onCloneVariant(v.id);
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-blue-600 hover:border-blue-500/20 border border-transparent rounded-lg transition-all flex items-center gap-2 text-[8px] font-black uppercase tracking-wider"
                                                >
                                                    <Copy size={12} /> <span>Clone</span>
                                                </button>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onDeleteVariant(v.id);
                                                    }}
                                                    className="p-1.5 text-slate-300 hover:rose-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <div
                                                    className={`ml-1 p-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 transition-transform duration-500 ${isExpandedVariant ? 'rotate-90' : ''}`}
                                                >
                                                    <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deep Specs: Leaf Nodes */}
                                        {isExpandedVariant && (
                                            <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-300">
                                                {/* Compliance & Taxation Section */}
                                                <div className="mb-6 p-6 bg-blue-500/[0.03] border border-blue-500/10 rounded-[2rem] space-y-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <FileCheck size={18} className="text-blue-500" />
                                                        <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic">
                                                            Compliance & Taxation
                                                        </h4>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                                                HSN Code (6-Digit, e.g. 871120)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 871120"
                                                                value={v.hsnCode || ''}
                                                                onChange={e =>
                                                                    onUpdateVariant(v.id, 'hsnCode', e.target.value)
                                                                }
                                                                className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all uppercase"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                                                GST Rate (%)
                                                            </label>
                                                            <div className="relative group">
                                                                <input
                                                                    type="number"
                                                                    placeholder="28"
                                                                    value={v.gstRate || ''}
                                                                    onChange={e =>
                                                                        onUpdateVariant(
                                                                            v.id,
                                                                            'gstRate',
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                    className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                                                />
                                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500">
                                                                    %
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* GST Split Preview (Visual Only) */}
                                                    {v.gstRate ? (
                                                        <div className="flex gap-4 items-center p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 border-dashed">
                                                            <div className="flex-1">
                                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                                    Tax Split
                                                                </p>
                                                                <div className="flex gap-4">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                                            CGST: {v.gstRate / 2}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                                            SGST: {v.gstRate / 2}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="px-3 py-1 bg-blue-500/10 rounded-lg">
                                                                <span className="text-[9px] font-black text-blue-600">
                                                                    STATE REVENUE ELIGIBLE
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[8px] font-medium text-slate-400 italic">
                                                            Configure GST rate to see revenue breakdown.
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 gap-2">
                                                    {SPEC_CATEGORIES.map(cat => {
                                                        const Icon = cat.icon;
                                                        const isSecExpanded = expandedSections.includes(
                                                            `${v.id}-${cat.id}`
                                                        );
                                                        return (
                                                            <div key={cat.id} className="relative pl-6">
                                                                {/* Vertical Sub-Line */}
                                                                <div className="absolute left-2 top-0 bottom-0 w-[1px] bg-slate-200 dark:bg-white/5" />
                                                                {/* Horizontal Sub-Line */}
                                                                <div className="absolute left-2 top-6 w-3 h-[1px] bg-slate-200 dark:bg-white/5" />

                                                                <button
                                                                    onClick={() => toggleSection(`${v.id}-${cat.id}`)}
                                                                    className={`w-full px-6 py-4 flex items-center justify-between rounded-2xl transition-all ${isSecExpanded ? 'bg-white dark:bg-white/[0.03] shadow-sm border border-slate-200 dark:border-white/10' : 'hover:bg-white/50 border border-transparent'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Icon
                                                                            size={16}
                                                                            className={`${isSecExpanded ? 'text-blue-500' : 'text-slate-400'}`}
                                                                        />
                                                                        <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest italic">
                                                                            {cat.name}
                                                                        </span>
                                                                    </div>
                                                                    <ChevronRight
                                                                        size={14}
                                                                        className={`text-slate-300 transition-transform ${isSecExpanded ? 'rotate-90' : ''}`}
                                                                    />
                                                                </button>

                                                                {isSecExpanded && (
                                                                    <div className="mt-3 ml-6 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                                                                        {cat.fields.map(field => (
                                                                            <div key={field} className="space-y-1.5">
                                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                                                                    {field}
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Pending..."
                                                                                    value={
                                                                                        v.specifications?.[cat.id]?.[
                                                                                            field
                                                                                        ] || ''
                                                                                    }
                                                                                    onChange={e =>
                                                                                        onUpdateVariant(
                                                                                            v.id,
                                                                                            'specifications',
                                                                                            {
                                                                                                ...v.specifications,
                                                                                                [cat.id]: {
                                                                                                    ...(v
                                                                                                        .specifications?.[
                                                                                                        cat.id
                                                                                                    ] || {}),
                                                                                                    [field]:
                                                                                                        e.target.value,
                                                                                                },
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                    className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Shadow Add Branch */}
                        <button
                            onClick={() => onAddVariant({ name: 'Standard' })}
                            className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-500/5 group/add transition-all"
                        >
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-300 group-hover/add:bg-blue-600 group-hover/add:text-white transition-all">
                                <Plus size={14} />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover/add:text-blue-500">
                                Append New Branch
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {variants.length === 0 && !isModelExpanded && (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[40px]">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No active branches configured
                    </p>
                </div>
            )}
        </div>
    );
}
// @ts-nocheck
