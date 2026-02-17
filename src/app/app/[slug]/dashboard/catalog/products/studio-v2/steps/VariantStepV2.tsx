'use client';

import React, { useState } from 'react';
import { Loader2, Plus, Edit2, Trash2, Layers, GripVertical, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getHierarchyLabels } from '@/lib/constants/catalogLabels';
import { createVariant, updateVariant, deleteVariant, reorderVariants } from '@/actions/catalog/catalogV2Actions';
import type { CatalogModel, ProductType } from '@/actions/catalog/catalogV2Actions';
import CopyableId from '@/components/ui/CopyableId';

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Vehicle spec groups for the form
interface SpecField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    placeholder?: string;
    options?: string[];
}

interface SpecGroup {
    title: string;
    fields: SpecField[];
}

const VEHICLE_SPEC_GROUPS: SpecGroup[] = [
    {
        title: 'Engine',
        fields: [
            { key: 'engine_type', label: 'Engine Type', type: 'text' },
            { key: 'displacement', label: 'Displacement (cc)', type: 'number' },
            { key: 'max_power', label: 'Max Power', type: 'text', placeholder: 'e.g. 5.9 KW @ 6500 RPM' },
            { key: 'max_torque', label: 'Max Torque', type: 'text', placeholder: 'e.g. 9.8 Nm @ 4500 RPM' },
            { key: 'num_valves', label: 'Valves', type: 'number' },
            {
                key: 'transmission',
                label: 'Transmission',
                type: 'select',
                options: ['MANUAL', 'CVT_AUTOMATIC', 'AMT', 'DCT'],
            },
            { key: 'mileage', label: 'Mileage (kmpl)', type: 'number' },
            {
                key: 'start_type',
                label: 'Starting',
                type: 'select',
                options: ['KICK', 'ELECTRIC', 'KICK_ELECTRIC', 'SILENT_START'],
            },
        ],
    },
    {
        title: 'Brakes & Suspension',
        fields: [
            { key: 'front_brake', label: 'Front Brake', type: 'text' },
            { key: 'rear_brake', label: 'Rear Brake', type: 'text' },
            {
                key: 'braking_system',
                label: 'Braking System',
                type: 'select',
                options: ['SBT', 'CBS', 'ABS', 'DUAL_ABS'],
            },
            { key: 'front_suspension', label: 'Front Suspension', type: 'text' },
            { key: 'rear_suspension', label: 'Rear Suspension', type: 'text' },
        ],
    },
    {
        title: 'Dimensions',
        fields: [
            { key: 'kerb_weight', label: 'Kerb Weight (kg)', type: 'number' },
            { key: 'seat_height', label: 'Seat Height (mm)', type: 'number' },
            { key: 'ground_clearance', label: 'Ground Clearance (mm)', type: 'number' },
            { key: 'wheelbase', label: 'Wheelbase (mm)', type: 'number' },
            { key: 'fuel_capacity', label: 'Fuel Tank (L)', type: 'number' },
        ],
    },
    {
        title: 'Electrical & Features',
        fields: [
            {
                key: 'console_type',
                label: 'Console',
                type: 'select',
                options: ['ANALOG', 'DIGITAL', 'SEMI_DIGITAL_ANALOG', 'DIGITAL_TFT'],
            },
            { key: 'led_headlamp', label: 'LED Headlamp', type: 'boolean' },
            { key: 'led_tail_lamp', label: 'LED Tail Lamp', type: 'boolean' },
            { key: 'usb_charging', label: 'USB Charging', type: 'boolean' },
            { key: 'bluetooth', label: 'Bluetooth', type: 'boolean' },
            { key: 'navigation', label: 'Navigation', type: 'boolean' },
            { key: 'ride_modes', label: 'Ride Modes', type: 'text' },
        ],
    },
    {
        title: 'Tyres',
        fields: [
            { key: 'front_tyre', label: 'Front Tyre', type: 'text' },
            { key: 'rear_tyre', label: 'Rear Tyre', type: 'text' },
            { key: 'tyre_type', label: 'Tyre Type', type: 'text', placeholder: 'e.g. Tubeless' },
        ],
    },
    {
        title: 'EV',
        fields: [
            { key: 'battery_type', label: 'Battery Type', type: 'text' },
            { key: 'battery_capacity', label: 'Battery Capacity', type: 'text' },
            { key: 'range_km', label: 'Range (km)', type: 'number' },
            { key: 'charging_time', label: 'Charging Time', type: 'text' },
            { key: 'motor_power', label: 'Motor Power', type: 'text' },
        ],
    },
];

const ACCESSORY_FIELDS: SpecField[] = [
    { key: 'material', label: 'Material', type: 'text' },
    { key: 'weight', label: 'Weight (gm)', type: 'number' },
    { key: 'finish', label: 'Finish', type: 'select', options: ['GLOSS', 'MATTE', 'CHROME', 'CARBON'] },
];

const SERVICE_FIELDS: SpecField[] = [
    { key: 'duration_months', label: 'Duration (months)', type: 'number' },
    { key: 'coverage_type', label: 'Coverage', type: 'select', options: ['COMPREHENSIVE', 'THIRD_PARTY'] },
    { key: 'labor_included', label: 'Labor Included', type: 'boolean' },
];

interface VariantStepProps {
    model: CatalogModel;
    variants: any[];
    onUpdate: (variants: any[]) => void;
}

export default function VariantStepV2({ model, variants, onUpdate }: VariantStepProps) {
    const productType = (model.product_type || 'VEHICLE') as ProductType;
    const labels = getHierarchyLabels(productType);

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsCreating(true);
        try {
            const payload: Record<string, any> = {
                model_id: model.id,
                name: newName.trim(),
                slug: slugify(newName),
                position: variants.length,
                status: 'DRAFT',
            };

            const created = await createVariant(
                productType,
                payload as { model_id: string; name: string; [key: string]: any }
            );
            if (created) {
                onUpdate([...variants, created]);
                setNewName('');
                toast.success(`${labels.variant} created`);
            }
        } catch (err) {
            console.error('Failed to create variant:', err);
            toast.error('Failed to create');
        } finally {
            setIsCreating(false);
        }
    };

    const handleSaveSpecs = async (variantId: string) => {
        const data = editData[variantId];
        if (!data) return;
        setIsSaving(variantId);
        try {
            const updated = await updateVariant(variantId, productType, data as Record<string, any>);
            if (updated) {
                onUpdate(variants.map(v => (v.id === variantId ? updated : v)));
                toast.success(`${labels.variant} saved`);
            }
        } catch (err) {
            console.error('Failed to save:', err);
            toast.error('Failed to save');
        } finally {
            setIsSaving(null);
        }
    };

    const handleDelete = async (variantId: string) => {
        if (!confirm(`Delete this ${labels.variant}?`)) return;
        try {
            await deleteVariant(variantId, productType);
            onUpdate(variants.filter(v => v.id !== variantId));
            toast.success(`${labels.variant} deleted`);
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const handleReposition = async (currentIndex: number, newPosition: number) => {
        // Clamp to valid range (1-based for user, 0-based internally)
        const targetIdx = Math.max(0, Math.min(variants.length - 1, newPosition - 1));
        if (targetIdx === currentIndex) return;

        const newOrder = [...variants];
        const [moved] = newOrder.splice(currentIndex, 1);
        newOrder.splice(targetIdx, 0, moved);
        onUpdate(newOrder);
        try {
            await reorderVariants(
                model.id,
                productType,
                newOrder.map((v: any) => v.id)
            );
            toast.success(`Moved to position ${targetIdx + 1}`);
        } catch {
            toast.error('Failed to reorder');
        }
    };

    const toggleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            // Initialize edit data from current variant
            const variant = variants.find(v => v.id === id);
            if (variant && !editData[id]) {
                setEditData(prev => ({ ...prev, [id]: { ...variant } }));
            }
        }
    };

    const updateField = (variantId: string, key: string, value: any) => {
        setEditData(prev => ({
            ...prev,
            [variantId]: { ...prev[variantId], [key]: value },
        }));
    };

    // Pick the right spec fields based on product type
    const getSpecFields = () => {
        if (productType === 'ACCESSORY') return [{ title: 'Accessory Specifications', fields: ACCESSORY_FIELDS }];
        if (productType === 'SERVICE') return [{ title: 'Service Specifications', fields: SERVICE_FIELDS }];
        return VEHICLE_SPEC_GROUPS;
    };

    const specGroups = getSpecFields();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                        {model.name} — {labels.variant}s
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Add {labels.variant.toLowerCase()}s and their specifications
                    </p>
                </div>
            </div>

            {/* Quick Add */}
            <div className="flex gap-3">
                <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleCreate();
                    }}
                    placeholder={`New ${labels.variant} name (e.g. ${productType === 'VEHICLE' ? 'Disc SmartXonnect' : productType === 'ACCESSORY' ? 'Half Face' : 'Gold Plan'})`}
                    className="flex-1 px-5 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                    onClick={handleCreate}
                    disabled={isCreating || !newName.trim()}
                    className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
                >
                    {isCreating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    Add
                </button>
            </div>

            {/* Variant List (Accordion) */}
            <div className="space-y-3">
                {variants.map((variant, idx) => {
                    const isExpanded = expandedId === variant.id;
                    const data = editData[variant.id] || variant;

                    return (
                        <div
                            key={variant.id}
                            className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                                isExpanded
                                    ? 'border-indigo-200 dark:border-indigo-500/30 shadow-lg'
                                    : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5'
                            }`}
                        >
                            {/* Variant Header */}
                            <div
                                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                                onClick={() => toggleExpand(variant.id)}
                            >
                                <GripVertical size={16} className="text-slate-300 cursor-grab" />
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                    <Layers size={18} className="text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase italic text-sm">
                                        {variant.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span
                                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                variant.status === 'ACTIVE'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {variant.status}
                                        </span>
                                        <CopyableId id={variant.id} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={variants.length}
                                        defaultValue={idx + 1}
                                        key={`${variant.id}-${idx}`}
                                        onClick={e => e.stopPropagation()}
                                        onBlur={e => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val)) handleReposition(idx, val);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = parseInt((e.target as HTMLInputElement).value);
                                                if (!isNaN(val)) handleReposition(idx, val);
                                            }
                                        }}
                                        className="w-10 h-8 text-center text-xs font-black bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 dark:text-white"
                                        title={`Position ${idx + 1} — type to reorder`}
                                    />
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleDelete(variant.id);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    {isExpanded ? (
                                        <ChevronUp size={16} className="text-slate-400" />
                                    ) : (
                                        <ChevronDown size={16} className="text-slate-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Spec Editor */}
                            {isExpanded && (
                                <div className="px-6 pb-6 border-t border-slate-100 dark:border-white/5 space-y-6 pt-5 bg-slate-50/30 dark:bg-white/[0.02]">
                                    {/* Name edit */}
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name || ''}
                                            onChange={e => updateField(variant.id, 'name', e.target.value)}
                                            className="w-full max-w-md px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    {/* Spec groups */}
                                    {specGroups.map(group => (
                                        <div key={group.title}>
                                            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">
                                                {group.title}
                                            </h5>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {group.fields.map(field => (
                                                    <div key={field.key}>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                                                            {field.label}
                                                        </label>
                                                        {field.type === 'select' ? (
                                                            <select
                                                                value={data[field.key] || ''}
                                                                onChange={e =>
                                                                    updateField(
                                                                        variant.id,
                                                                        field.key,
                                                                        e.target.value || null
                                                                    )
                                                                }
                                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold outline-none"
                                                            >
                                                                <option value="">—</option>
                                                                {field.options?.map(opt => (
                                                                    <option key={opt} value={opt}>
                                                                        {opt.replace(/_/g, ' ')}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'boolean' ? (
                                                            <button
                                                                onClick={() =>
                                                                    updateField(variant.id, field.key, !data[field.key])
                                                                }
                                                                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-colors w-full text-center ${
                                                                    data[field.key]
                                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/30'
                                                                        : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-white/5 dark:border-white/10'
                                                                }`}
                                                            >
                                                                {data[field.key] ? 'Yes' : 'No'}
                                                            </button>
                                                        ) : (
                                                            <input
                                                                type={field.type === 'number' ? 'number' : 'text'}
                                                                value={data[field.key] ?? ''}
                                                                onChange={e => {
                                                                    const val =
                                                                        field.type === 'number'
                                                                            ? e.target.value
                                                                                ? Number(e.target.value)
                                                                                : null
                                                                            : e.target.value || null;
                                                                    updateField(variant.id, field.key, val);
                                                                }}
                                                                placeholder={field.placeholder || ''}
                                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Save button */}
                                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                                        <button
                                            onClick={() => handleSaveSpecs(variant.id)}
                                            disabled={isSaving === variant.id}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
                                        >
                                            {isSaving === variant.id ? (
                                                <Loader2 className="animate-spin" size={14} />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                            Save {labels.variant}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {variants.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <Layers size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-bold text-sm">No {labels.variant.toLowerCase()}s yet</p>
                        <p className="text-xs mt-1 text-slate-300">
                            Use the field above to add your first {labels.variant.toLowerCase()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
