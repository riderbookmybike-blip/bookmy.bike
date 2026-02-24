'use client';

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    Plus,
    Edit2,
    Trash2,
    Layers,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Save,
    Link2,
    X,
    Image as ImageIcon,
    Upload,
    Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getHierarchyLabels } from '@/lib/constants/catalogLabels';
import { createVariant, updateVariant, deleteVariant, reorderVariants } from '@/actions/catalog/catalogV2Actions';
import type { CatalogModel, ProductType } from '@/actions/catalog/catalogV2Actions';
import CopyableId from '@/components/ui/CopyableId';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import SKUMediaManager from '@/components/catalog/SKUMediaManager';
import { getProxiedUrl } from '@/lib/utils/urlHelper';

// ── Helpers — convert variant flat columns → SKUMediaManager arrays ──
function variantToGalleryArray(v: any): string[] {
    const imgs: string[] = [];
    if (v.primary_image) imgs.push(v.primary_image);
    for (let i = 1; i <= 6; i++) {
        const url = v[`gallery_img_${i}`] as string | null;
        if (url && !imgs.includes(url)) imgs.push(url);
    }
    return imgs;
}
function variantToVideoArray(v: any): string[] {
    const vids: string[] = [];
    if (v.video_url_1) vids.push(v.video_url_1);
    if (v.video_url_2) vids.push(v.video_url_2);
    return vids;
}
function variantToPdfArray(v: any): string[] {
    return v.pdf_url_1 ? [v.pdf_url_1] : [];
}

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
    const [activeMediaVariant, setActiveMediaVariant] = useState<any>(null);
    // For ACCESSORY: targets selected during creation
    const [newCompatTargets, setNewCompatTargets] = useState<any[]>([]);

    // ── Suitable For (ACCESSORY only) ──
    const isAccessory = productType === 'ACCESSORY';
    const [compatMap, setCompatMap] = useState<Record<string, any[]>>({}); // variantId -> entries
    const [compatBrands, setCompatBrands] = useState<any[]>([]);
    const [compatModels, setCompatModels] = useState<any[]>([]);
    const [compatVehicleVariants, setCompatVehicleVariants] = useState<any[]>([]);
    const [selBrand, setSelBrand] = useState('');
    const [selModel, setSelModel] = useState('');
    const [selVehicleVariant, setSelVehicleVariant] = useState('');
    const [isSavingCompat, setIsSavingCompat] = useState<string | null>(null);

    // Fetch brands for compat selector (once)
    useEffect(() => {
        if (!isAccessory) return;
        const supabase = createClient();
        supabase
            .from('cat_brands')
            .select('id, name')
            .eq('is_active', true)
            .order('name')
            .then(({ data }) => {
                if (data) setCompatBrands(data);
            });
    }, [isAccessory]);

    // Fetch models when brand changes
    useEffect(() => {
        if (!selBrand || selBrand === 'UNIVERSAL') {
            setCompatModels([]);
            return;
        }
        const supabase = createClient();
        (supabase as any)
            .from('cat_models')
            .select('id, name')
            .eq('brand_id', selBrand)
            .eq('product_type', 'VEHICLE')
            .order('name')
            .then(({ data }: any) => {
                if (data) setCompatModels(data);
            });
    }, [selBrand]);

    // Fetch vehicle variants when model changes
    useEffect(() => {
        if (!selModel || selModel === 'ALL_MODELS') {
            setCompatVehicleVariants([]);
            return;
        }
        const supabase = createClient();
        (supabase as any)
            .from('cat_variants_vehicle')
            .select('id, name')
            .eq('model_id', selModel)
            .order('name')
            .then(({ data }: any) => {
                if (data) setCompatVehicleVariants(data);
            });
    }, [selModel]);

    // Load compat entries when variant is expanded
    const loadCompatForVariant = async (variantId: string) => {
        const supabase = createClient();
        const { data } = await supabase
            .from('cat_accessory_suitable_for')
            .select('id, variant_id, is_universal, target_brand_id, target_model_id, target_variant_id')
            .eq('variant_id', variantId);
        if (data && data.length > 0) {
            const enriched = await Promise.all(
                data.map(async (c: any) => {
                    let label = '';
                    if (c.is_universal) {
                        label = 'UNIVERSAL / ALL VEHICLES';
                    } else {
                        const parts: string[] = [];
                        if (c.target_brand_id) {
                            const { data: brand } = await supabase
                                .from('cat_brands')
                                .select('name')
                                .eq('id', c.target_brand_id)
                                .single();
                            parts.push(brand?.name || 'Unknown');
                        }
                        if (c.target_family_id) {
                            const { data: fam } = await (supabase as any)
                                .from('cat_models')
                                .select('name')
                                .eq('id', c.target_family_id)
                                .single();
                            parts.push(fam?.name || 'All Models');
                        } else if (c.target_brand_id) {
                            parts.push('(All Models)');
                        }
                        if (c.target_variant_id) {
                            const { data: v } = await (supabase as any)
                                .from('cat_variants_vehicle')
                                .select('name')
                                .eq('id', c.target_variant_id)
                                .single();
                            parts.push(v?.name || '');
                        }
                        label = parts.filter(Boolean).join(' › ');
                    }
                    return { ...c, label };
                })
            );
            setCompatMap(prev => ({ ...prev, [variantId]: enriched }));
        } else {
            setCompatMap(prev => ({ ...prev, [variantId]: [] }));
        }
    };

    const addCompatEntry = (variantId: string) => {
        const entries = compatMap[variantId] || [];
        if (selBrand === 'UNIVERSAL') {
            if (entries.some(c => c.is_universal)) return;
            setCompatMap(prev => ({
                ...prev,
                [variantId]: [
                    ...entries,
                    {
                        id: `new-${Date.now()}`,
                        is_universal: true,
                        target_brand_id: null,
                        target_family_id: null,
                        target_variant_id: null,
                        label: 'UNIVERSAL / ALL VEHICLES',
                    },
                ],
            }));
        } else if (selBrand) {
            const brandName = compatBrands.find(b => b.id === selBrand)?.name || '';
            const modelName =
                selModel && selModel !== 'ALL_MODELS' ? compatModels.find(m => m.id === selModel)?.name || '' : '';
            const variantName =
                selVehicleVariant && selVehicleVariant !== 'ALL_VARIANTS'
                    ? compatVehicleVariants.find(v => v.id === selVehicleVariant)?.name || ''
                    : '';

            const entry = {
                id: `new-${Date.now()}`,
                is_universal: false,
                target_brand_id: selBrand,
                target_family_id: selModel && selModel !== 'ALL_MODELS' ? selModel : null,
                target_variant_id: selVehicleVariant && selVehicleVariant !== 'ALL_VARIANTS' ? selVehicleVariant : null,
                label: [brandName, modelName || '(All Models)', variantName].filter(Boolean).join(' › '),
            };
            if (
                entries.some(
                    c =>
                        c.target_brand_id === entry.target_brand_id &&
                        c.target_family_id === entry.target_family_id &&
                        c.target_variant_id === entry.target_variant_id
                )
            )
                return;
            setCompatMap(prev => ({ ...prev, [variantId]: [...entries, entry] }));
        }
        setSelBrand('');
        setSelModel('');
        setSelVehicleVariant('');
    };

    const removeCompatEntry = (variantId: string, entryId: string) => {
        setCompatMap(prev => ({ ...prev, [variantId]: (prev[variantId] || []).filter(c => c.id !== entryId) }));
    };

    const saveCompat = async (variantId: string) => {
        setIsSavingCompat(variantId);
        try {
            const supabase = createClient();
            await supabase.from('cat_accessory_suitable_for').delete().eq('variant_id', variantId);
            const entries = compatMap[variantId] || [];
            if (entries.length > 0) {
                const inserts = entries.map(e => ({
                    variant_id: variantId,
                    is_universal: e.is_universal || false,
                    target_brand_id: e.target_brand_id || null,
                    target_model_id: e.target_model_id || e.target_family_id || null,
                    target_variant_id: e.target_variant_id || null,
                }));
                const { error } = await supabase.from('cat_accessory_suitable_for').insert(inserts);
                if (error) throw error;
            }
            toast.success('Compatibility saved');
        } catch (err: unknown) {
            toast.error('Failed to save compatibility: ' + (getErrorMessage(err) || 'Unknown'));
        } finally {
            setIsSavingCompat(null);
        }
    };

    const handleCreate = async () => {
        if (isAccessory) {
            await handleCreateAccessory();
            return;
        }
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

    // ACCESSORY-specific: create variant from vehicle targets
    const handleCreateAccessory = async () => {
        if (newCompatTargets.length === 0) {
            toast.error('Select at least one vehicle target');
            return;
        }
        setIsCreating(true);
        try {
            // Auto-generate name from targets
            const name = newCompatTargets.map(t => t.label).join(', ');

            const payload: Record<string, any> = {
                model_id: model.id,
                name,
                slug: slugify(name),
                position: variants.length,
                status: 'DRAFT',
            };

            const created = await createVariant(
                productType,
                payload as { model_id: string; name: string; [key: string]: any }
            );
            if (!created) throw new Error('Variant creation failed');

            // Save compat entries
            const supabase = createClient();
            const inserts = newCompatTargets.map(t => ({
                variant_id: created.id,
                is_universal: t.is_universal || false,
                target_brand_id: t.target_brand_id || null,
                target_model_id: t.target_model_id || t.target_family_id || null,
                target_variant_id: t.target_variant_id || null,
            }));
            if (inserts.length > 0) {
                const { error } = await supabase.from('cat_accessory_suitable_for').insert(inserts);
                if (error) console.error('Compat insert error:', error);
            }

            onUpdate([...variants, created]);
            setNewCompatTargets([]);
            setSelBrand('');
            setSelModel('');
            setSelVehicleVariant('');
            toast.success(`${labels.variant} created: ${name}`);
        } catch (err) {
            console.error('Failed to create accessory variant:', err);
            toast.error('Failed to create');
        } finally {
            setIsCreating(false);
        }
    };

    // Add a target to the creation-time target list
    const addNewTarget = () => {
        if (selBrand === 'UNIVERSAL') {
            if (newCompatTargets.some(t => t.is_universal)) return;
            setNewCompatTargets(prev => [
                ...prev,
                {
                    id: `new-${Date.now()}`,
                    is_universal: true,
                    target_brand_id: null,
                    target_family_id: null,
                    target_variant_id: null,
                    label: 'All Brands (Universal)',
                },
            ]);
            setSelBrand('');
            return;
        }
        if (!selBrand) return;
        const brandName = compatBrands.find(b => b.id === selBrand)?.name || '';
        const modelName =
            selModel && selModel !== 'ALL_MODELS' ? compatModels.find(m => m.id === selModel)?.name || '' : '';
        const vName =
            selVehicleVariant && selVehicleVariant !== 'ALL_VARIANTS'
                ? compatVehicleVariants.find(v => v.id === selVehicleVariant)?.name || ''
                : '';

        const entry = {
            id: `new-${Date.now()}`,
            is_universal: false,
            target_brand_id: selBrand,
            target_family_id: selModel && selModel !== 'ALL_MODELS' ? selModel : null,
            target_variant_id: selVehicleVariant && selVehicleVariant !== 'ALL_VARIANTS' ? selVehicleVariant : null,
            label: [brandName, !selModel || selModel === 'ALL_MODELS' ? '(All)' : modelName, vName]
                .filter(Boolean)
                .join(' › '),
        };
        if (
            newCompatTargets.some(
                t =>
                    t.target_brand_id === entry.target_brand_id &&
                    t.target_family_id === entry.target_family_id &&
                    t.target_variant_id === entry.target_variant_id
            )
        ) {
            toast.error('Already added');
            return;
        }
        setNewCompatTargets(prev => [...prev, entry]);
        setSelBrand('');
        setSelModel('');
        setSelVehicleVariant('');
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
        } catch (err: unknown) {
            console.error('Variant delete failed:', err);
            const msg = getErrorMessage(err) || 'Unknown error';
            toast.error(`Failed to delete: ${msg}`);
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
            // Load compatibility entries for ACCESSORY variants
            if (isAccessory && !compatMap[id]) {
                loadCompatForVariant(id);
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

    // ── Media save handler ──
    const handleVariantMediaSave = async (
        images: string[],
        videos: string[],
        pdfs: string[],
        primary: string | null,
        _applyVideosToAll?: boolean,
        zoomFactor?: number,
        isFlipped?: boolean,
        offsetX?: number,
        offsetY?: number
    ) => {
        if (!activeMediaVariant) return;
        try {
            const mediaUpdate: Record<string, any> = {
                primary_image: primary || images[0] || null,
                gallery_img_1: images[0] || null,
                gallery_img_2: images[1] || null,
                gallery_img_3: images[2] || null,
                gallery_img_4: images[3] || null,
                gallery_img_5: images[4] || null,
                gallery_img_6: images[5] || null,
                video_url_1: videos[0] || null,
                video_url_2: videos[1] || null,
                pdf_url_1: pdfs[0] || null,
                zoom_factor: zoomFactor ?? 1.0,
                is_flipped: isFlipped ?? false,
                offset_x: offsetX ?? 0,
                offset_y: offsetY ?? 0,
            };
            const updated = await updateVariant(activeMediaVariant.id, productType, mediaUpdate);
            if (updated) {
                onUpdate(variants.map(v => (v.id === activeMediaVariant.id ? updated : v)));
                toast.success('Variant media saved');
            }
        } catch (err: unknown) {
            console.error('Variant media save failed:', err);
            toast.error('Failed to save media: ' + getErrorMessage(err));
        }
    };

    const toggleVariantMediaShared = async (variant: any) => {
        try {
            const updated = await updateVariant(variant.id, productType, { media_shared: !variant.media_shared });
            if (updated) {
                onUpdate(variants.map(v => (v.id === updated.id ? updated : v)));
                toast.success(updated.media_shared ? 'Media shared with SKUs' : 'Media sharing disabled');
            }
        } catch (err: unknown) {
            toast.error('Failed to toggle sharing: ' + getErrorMessage(err));
        }
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

            {/* Quick Add — ACCESSORY uses vehicle selector, others use text input */}
            {isAccessory ? (
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Link2 size={12} className="text-indigo-500" /> Select Vehicle Compatibility
                    </label>

                    {/* Selected targets */}
                    {newCompatTargets.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {newCompatTargets.map((t: any) => (
                                <div
                                    key={t.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm"
                                >
                                    {t.label}
                                    <button
                                        onClick={() => setNewCompatTargets(prev => prev.filter(x => x.id !== t.id))}
                                        className="hover:scale-125 transition-transform"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Cascading selectors */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                        <select
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-indigo-500"
                            value={selBrand}
                            onChange={e => {
                                const val = e.target.value;
                                setSelBrand(val);
                                setSelModel('');
                                setSelVehicleVariant('');
                                if (val === 'UNIVERSAL') {
                                    // Directly add universal target (can't call addNewTarget — selBrand state is stale)
                                    if (!newCompatTargets.some(t => t.is_universal)) {
                                        setNewCompatTargets(prev => [
                                            ...prev,
                                            {
                                                id: `new-${Date.now()}`,
                                                is_universal: true,
                                                target_brand_id: null,
                                                target_family_id: null,
                                                target_variant_id: null,
                                                label: 'All Brands (Universal)',
                                            },
                                        ]);
                                    }
                                    setSelBrand('');
                                }
                            }}
                        >
                            <option value="">Brand...</option>
                            <option value="UNIVERSAL">🌍 ALL BRANDS (Universal)</option>
                            {compatBrands.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>

                        {selBrand && selBrand !== 'UNIVERSAL' && (
                            <select
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-indigo-500"
                                value={selModel}
                                onChange={e => {
                                    setSelModel(e.target.value);
                                    setSelVehicleVariant('');
                                }}
                            >
                                <option value="">Model...</option>
                                <option value="ALL_MODELS">All Models</option>
                                {compatModels.map((m: any) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {selModel && selModel !== 'ALL_MODELS' && (
                            <select
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-indigo-500"
                                value={selVehicleVariant}
                                onChange={e => setSelVehicleVariant(e.target.value)}
                            >
                                <option value="">Variant...</option>
                                <option value="ALL_VARIANTS">All Variants</option>
                                {compatVehicleVariants.map((v: any) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {selBrand && selBrand !== 'UNIVERSAL' && (
                            <button
                                onClick={addNewTarget}
                                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                            >
                                + Target
                            </button>
                        )}

                        <button
                            onClick={handleCreate}
                            disabled={isCreating || newCompatTargets.length === 0}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            Add {labels.variant}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleCreate();
                        }}
                        placeholder={`New ${labels.variant} name (e.g. ${productType === 'VEHICLE' ? 'Disc SmartXonnect' : 'Gold Plan'})`}
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
            )}

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
                                {/* Media thumbnail or Layers icon */}
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        setActiveMediaVariant(variant);
                                    }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all overflow-hidden group/media relative ${
                                        variant.primary_image
                                            ? 'border-indigo-500/30 hover:border-indigo-500 bg-white dark:bg-white/5'
                                            : 'bg-indigo-50 dark:bg-indigo-900/20 border-transparent text-indigo-500 hover:border-indigo-400'
                                    }`}
                                    title="Manage Media"
                                >
                                    {variant.primary_image ? (
                                        <>
                                            <img
                                                src={getProxiedUrl(variant.primary_image)}
                                                className="w-full h-full object-contain p-0.5 group-hover/media:scale-110 transition-transform duration-300"
                                                alt={variant.name}
                                            />
                                            <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <Upload size={10} strokeWidth={3} />
                                            </div>
                                        </>
                                    ) : (
                                        <Layers size={18} />
                                    )}
                                </button>
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
                                    {/* Shareable toggle */}
                                    {variant.primary_image && (
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                toggleVariantMediaShared(variant);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${
                                                variant.media_shared
                                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'text-slate-400 hover:text-indigo-600'
                                            }`}
                                            title={
                                                variant.media_shared
                                                    ? 'Shared ✓ (click to unshare)'
                                                    : 'Share media with SKUs'
                                            }
                                        >
                                            <Share2 size={14} />
                                        </button>
                                    )}
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

                                    {/* Suitable For — ACCESSORY only */}
                                    {isAccessory && (
                                        <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                    <Link2 size={12} className="text-indigo-500" /> Suitable For
                                                </label>
                                                <button
                                                    onClick={() => saveCompat(variant.id)}
                                                    disabled={isSavingCompat === variant.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {isSavingCompat === variant.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : null}
                                                    Save Compat
                                                </button>
                                            </div>

                                            {/* Current entries */}
                                            <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/10">
                                                {(compatMap[variant.id] || []).length === 0 && (
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-2 py-0.5">
                                                        No vehicles set — add below
                                                    </span>
                                                )}
                                                {(compatMap[variant.id] || []).map((entry: any) => (
                                                    <div
                                                        key={entry.id}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm"
                                                    >
                                                        {entry.label}
                                                        <button
                                                            onClick={() => removeCompatEntry(variant.id, entry.id)}
                                                            className="hover:scale-125 transition-transform"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Cascading selectors */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                                                <select
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:border-indigo-500"
                                                    value={selBrand}
                                                    onChange={e => {
                                                        setSelBrand(e.target.value);
                                                        setSelModel('');
                                                        setSelVehicleVariant('');
                                                        if (e.target.value === 'UNIVERSAL') {
                                                            setTimeout(() => addCompatEntry(variant.id), 0);
                                                        }
                                                    }}
                                                >
                                                    <option value="">Brand...</option>
                                                    <option value="UNIVERSAL">🌍 UNIVERSAL</option>
                                                    {compatBrands.map(b => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>

                                                {selBrand && selBrand !== 'UNIVERSAL' && (
                                                    <select
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:border-indigo-500"
                                                        value={selModel}
                                                        onChange={e => {
                                                            setSelModel(e.target.value);
                                                            setSelVehicleVariant('');
                                                        }}
                                                    >
                                                        <option value="">Model...</option>
                                                        <option value="ALL_MODELS">All Models</option>
                                                        {compatModels.map(m => (
                                                            <option key={m.id} value={m.id}>
                                                                {m.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                {selModel && selModel !== 'ALL_MODELS' && (
                                                    <select
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:border-indigo-500"
                                                        value={selVehicleVariant}
                                                        onChange={e => setSelVehicleVariant(e.target.value)}
                                                    >
                                                        <option value="">Variant...</option>
                                                        <option value="ALL_VARIANTS">All Variants</option>
                                                        {compatVehicleVariants.map(v => (
                                                            <option key={v.id} value={v.id}>
                                                                {v.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                {selBrand && selBrand !== 'UNIVERSAL' && selModel && (
                                                    <button
                                                        onClick={() => addCompatEntry(variant.id)}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                                                    >
                                                        + Add
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

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

            {/* Variant Media Manager (Full-Screen Overlay) */}
            {activeMediaVariant && (
                <SKUMediaManager
                    skuName={`${activeMediaVariant.name} (Variant)`}
                    initialImages={variantToGalleryArray(activeMediaVariant)}
                    initialVideos={variantToVideoArray(activeMediaVariant)}
                    initialPdfs={variantToPdfArray(activeMediaVariant)}
                    initialPrimary={activeMediaVariant.primary_image || null}
                    initialZoomFactor={activeMediaVariant.zoom_factor || 1.0}
                    initialIsFlipped={activeMediaVariant.is_flipped || false}
                    initialOffsetX={activeMediaVariant.offset_x || 0}
                    initialOffsetY={activeMediaVariant.offset_y || 0}
                    onSave={handleVariantMediaSave}
                    onClose={() => setActiveMediaVariant(null)}
                />
            )}
        </div>
    );
}
