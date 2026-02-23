'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Trash2,
    Loader2,
    ChevronDown,
    ChevronUp,
    Truck,
    Shield,
    Wrench,
    Sparkles,
    GripVertical,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

/* ───────────────────────── Types ───────────────────────── */

type ServiceCategory = 'SIMPLE' | 'DELIVERY' | 'MAINTENANCE';
type DisplayTab = 'SERVICE' | 'WARRANTY';

interface ServiceRow {
    id: string;
    name: string;
    description: string;
    price: number;
    discount_price: number;
    max_qty: number;
    duration_months: number | null;
    status: 'ACTIVE' | 'DRAFT';
    is_mandatory: boolean;
    service_category: ServiceCategory;
    display_tab: DisplayTab;
    parent_id: string | null;
    config: Record<string, any>;
    position: number;
    isNew?: boolean;
    isEditing?: boolean;
}

interface ServiceStepV2Props {
    modelId: string;
    brandName?: string;
}

/* ───────────────────────── Constants ───────────────────────── */

const CATEGORY_META: Record<ServiceCategory, { label: string; icon: any; color: string; description: string }> = {
    SIMPLE: {
        label: 'Simple Service',
        icon: Sparkles,
        color: 'text-blue-500',
        description: 'One-time service (e.g., Teflon Coating, AMC)',
    },
    DELIVERY: {
        label: 'Delivery',
        icon: Truck,
        color: 'text-emerald-500',
        description: 'Delivery options with variants (Standard, Zhatpat)',
    },
    MAINTENANCE: {
        label: 'Maintenance Schedule',
        icon: Wrench,
        color: 'text-amber-500',
        description: 'Scheduled services (km / days based triggers)',
    },
};

const TAB_META: Record<DisplayTab, { label: string; icon: any; color: string }> = {
    SERVICE: { label: 'Services', icon: Sparkles, color: 'text-blue-500' },
    WARRANTY: { label: 'Warranty', icon: Shield, color: 'text-amber-500' },
};

/* ───────────────────────── Component ───────────────────────── */

export default function ServiceStepV2({ modelId, brandName }: ServiceStepV2Props) {
    const supabase = createClient();
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCategory, setNewCategory] = useState<ServiceCategory>('SIMPLE');

    // ── Fetch all services ──
    const fetchServices = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cat_services' as any)
            .select('*')
            .order('position', { ascending: true });
        if (error) {
            toast.error('Failed to load services');
            console.error(error);
        } else {
            setServices(
                (data || []).map((s: any) => ({
                    ...s,
                    price: Number(s.price || 0),
                    discount_price: Number(s.discount_price || 0),
                    config: s.config || {},
                }))
            );
            // Auto-expand groups
            const groups = new Set<string>();
            (data || []).forEach((s: any) => {
                if (!s.parent_id) groups.add(s.id);
            });
            setExpandedGroups(groups);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // ── Save a single service ──
    const saveService = async (service: ServiceRow) => {
        setSaving(service.id);
        const payload: any = {
            name: service.name,
            description: service.description,
            price: String(service.price),
            discount_price: String(service.discount_price),
            max_qty: service.max_qty,
            duration_months: service.duration_months,
            status: service.status,
            is_mandatory: service.is_mandatory,
            service_category: service.service_category,
            display_tab: service.display_tab,
            parent_id: service.parent_id,
            config: service.config,
            position: service.position,
        };

        if (service.isNew) {
            const { error } = await supabase.from('cat_services' as any).insert({ id: service.id, ...payload });
            if (error) {
                toast.error(`Failed to create: ${error.message}`);
            } else {
                toast.success(`Created "${service.name}"`);
            }
        } else {
            const { error } = await supabase
                .from('cat_services' as any)
                .update(payload)
                .eq('id', service.id);
            if (error) {
                toast.error(`Failed to save: ${error.message}`);
            } else {
                toast.success(`Saved "${service.name}"`);
            }
        }
        setSaving(null);
        await fetchServices();
    };

    // ── Delete a service ──
    const deleteService = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        // Delete children first
        const children = services.filter(s => s.parent_id === id);
        for (const child of children) {
            await supabase
                .from('cat_services' as any)
                .delete()
                .eq('id', child.id);
        }
        const { error } = await supabase
            .from('cat_services' as any)
            .delete()
            .eq('id', id);
        if (error) {
            toast.error(`Failed to delete: ${error.message}`);
        } else {
            toast.success(`Deleted "${name}"`);
        }
        await fetchServices();
    };

    // ── Add new service ──
    const addNewService = (category: ServiceCategory) => {
        const id = `srv-${Date.now()}`;
        const newService: ServiceRow = {
            id,
            name: '',
            description: '',
            price: 0,
            discount_price: 0,
            max_qty: 1,
            duration_months: null,
            status: 'DRAFT',
            is_mandatory: false,
            service_category: category,
            display_tab: category === 'MAINTENANCE' ? 'WARRANTY' : 'SERVICE',
            parent_id: null,
            config: category === 'MAINTENANCE' ? { trigger_km: 0, trigger_days: 0 } : {},
            position: services.length,
            isNew: true,
            isEditing: true,
        };
        setServices(prev => [...prev, newService]);
        setShowAddForm(false);
    };

    // ── Add child to parent ──
    const addChild = (parentId: string, category: ServiceCategory) => {
        const id = `srv-${Date.now()}`;
        const parent = services.find(s => s.id === parentId);
        const childCount = services.filter(s => s.parent_id === parentId).length;
        const newChild: ServiceRow = {
            id,
            name: '',
            description: '',
            price: 0,
            discount_price: 0,
            max_qty: 1,
            duration_months: null,
            status: 'DRAFT',
            is_mandatory: parent?.is_mandatory || false,
            service_category: category,
            display_tab: parent?.display_tab || 'SERVICE',
            parent_id: parentId,
            config:
                category === 'MAINTENANCE'
                    ? { trigger_km: 0, trigger_days: 0 }
                    : category === 'DELIVERY'
                      ? { method: 'DOORSTEP', timeline: '' }
                      : {},
            position: childCount + 1,
            isNew: true,
            isEditing: true,
        };
        setServices(prev => [...prev, newChild]);
        setExpandedGroups(prev => new Set([...prev, parentId]));
    };

    // ── Update field locally ──
    const updateField = (id: string, field: keyof ServiceRow, value: any) => {
        setServices(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)));
    };
    const updateConfig = (id: string, key: string, value: any) => {
        setServices(prev => prev.map(s => (s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s)));
    };

    // ── Grouping ──
    const parents = services.filter(s => !s.parent_id);
    const getChildren = (parentId: string) =>
        services.filter(s => s.parent_id === parentId).sort((a, b) => a.position - b.position);

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Services...</span>
            </div>
        );
    }

    /* ═══════════════════════ RENDER ═══════════════════════ */

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                        Services & Warranty
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Manage services, delivery options, and warranty schedules
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={14} /> Add Service
                </button>
            </div>

            {/* Add Service Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 mb-6 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                        Choose Service Type
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        {(
                            Object.entries(CATEGORY_META) as [
                                ServiceCategory,
                                (typeof CATEGORY_META)[ServiceCategory],
                            ][]
                        ).map(([key, meta]) => {
                            const Icon = meta.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => addNewService(key)}
                                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-100 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all group hover:shadow-lg"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center ${meta.color} group-hover:scale-110 transition-transform`}
                                    >
                                        <Icon size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-slate-800 dark:text-white">
                                            {meta.label}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">{meta.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setShowAddForm(false)}
                        className="mt-4 text-xs text-slate-400 hover:text-slate-600"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Service Groups */}
            <div className="space-y-4">
                {parents
                    .sort((a, b) => a.position - b.position)
                    .map(parent => {
                        const children = getChildren(parent.id);
                        const isExpanded = expandedGroups.has(parent.id);
                        const catMeta = CATEGORY_META[parent.service_category] || CATEGORY_META.SIMPLE;
                        const tabMeta = TAB_META[parent.display_tab] || TAB_META.SERVICE;
                        const CatIcon = catMeta.icon;
                        const hasChildren = children.length > 0;

                        return (
                            <div
                                key={parent.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Parent Row */}
                                <div className="flex items-center gap-4 px-6 py-4">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${catMeta.color} bg-slate-50 dark:bg-white/5 shrink-0`}
                                    >
                                        <CatIcon size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0 grid grid-cols-[1fr_120px_120px_100px_100px] gap-4 items-center">
                                        {/* Name */}
                                        <div>
                                            <input
                                                value={parent.name}
                                                onChange={e => updateField(parent.id, 'name', e.target.value)}
                                                placeholder="Service name..."
                                                className="text-sm font-black text-slate-900 dark:text-white bg-transparent border-0 outline-none w-full placeholder:text-slate-300"
                                            />
                                            <input
                                                value={parent.description}
                                                onChange={e => updateField(parent.id, 'description', e.target.value)}
                                                placeholder="Description..."
                                                className="text-[11px] text-slate-400 bg-transparent border-0 outline-none w-full mt-0.5 placeholder:text-slate-200"
                                            />
                                        </div>

                                        {/* Price (only for non-group parents) */}
                                        {!hasChildren ? (
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Price ₹
                                                </label>
                                                <input
                                                    type="number"
                                                    value={parent.price || ''}
                                                    onChange={e =>
                                                        updateField(parent.id, 'price', Number(e.target.value))
                                                    }
                                                    className="w-full text-sm font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-100 dark:border-white/10"
                                                />
                                            </div>
                                        ) : (
                                            <div />
                                        )}

                                        {/* Discount */}
                                        {!hasChildren ? (
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Offer ₹
                                                </label>
                                                <input
                                                    type="number"
                                                    value={parent.discount_price || ''}
                                                    onChange={e =>
                                                        updateField(parent.id, 'discount_price', Number(e.target.value))
                                                    }
                                                    className="w-full text-sm font-bold text-emerald-600 bg-slate-50 dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-100 dark:border-white/10"
                                                />
                                            </div>
                                        ) : (
                                            <div />
                                        )}

                                        {/* Display Tab */}
                                        <select
                                            value={parent.display_tab}
                                            onChange={e => updateField(parent.id, 'display_tab', e.target.value)}
                                            className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-white/5 rounded-lg px-2 py-1.5 border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300"
                                        >
                                            <option value="SERVICE">Services</option>
                                            <option value="WARRANTY">Warranty</option>
                                        </select>

                                        {/* Mandatory */}
                                        <button
                                            onClick={() => updateField(parent.id, 'is_mandatory', !parent.is_mandatory)}
                                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-lg transition-colors ${
                                                parent.is_mandatory
                                                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                                    : 'bg-slate-50 text-slate-400 dark:bg-white/5'
                                            }`}
                                        >
                                            {parent.is_mandatory ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                            {parent.is_mandatory ? 'Required' : 'Optional'}
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {hasChildren && (
                                            <button
                                                onClick={() => toggleGroup(parent.id)}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => saveService(parent)}
                                            disabled={saving === parent.id}
                                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all"
                                        >
                                            {saving === parent.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                'Save'
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteService(parent.id, parent.name)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Children (expanded) */}
                                {isExpanded && hasChildren && (
                                    <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                                        {children.map((child, ci) => (
                                            <div
                                                key={child.id}
                                                className="flex items-center gap-4 px-6 py-3 border-b border-slate-100/80 dark:border-white/5 last:border-b-0"
                                            >
                                                <div className="w-10 flex items-center justify-center text-slate-300 shrink-0">
                                                    <GripVertical size={14} />
                                                </div>

                                                <div className="flex-1 min-w-0 grid grid-cols-[1fr_120px_120px_auto] gap-4 items-center">
                                                    {/* Name + Description */}
                                                    <div>
                                                        <input
                                                            value={child.name}
                                                            onChange={e =>
                                                                updateField(child.id, 'name', e.target.value)
                                                            }
                                                            placeholder="Entry name..."
                                                            className="text-sm font-bold text-slate-800 dark:text-white bg-transparent border-0 outline-none w-full placeholder:text-slate-300"
                                                        />
                                                        <input
                                                            value={child.description}
                                                            onChange={e =>
                                                                updateField(child.id, 'description', e.target.value)
                                                            }
                                                            placeholder="Description..."
                                                            className="text-[11px] text-slate-400 bg-transparent border-0 outline-none w-full mt-0.5 placeholder:text-slate-200"
                                                        />
                                                    </div>

                                                    {/* Price */}
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={child.price || ''}
                                                            onChange={e =>
                                                                updateField(child.id, 'price', Number(e.target.value))
                                                            }
                                                            placeholder="₹"
                                                            className="w-full text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10"
                                                        />
                                                    </div>

                                                    {/* Config fields */}
                                                    {parent.service_category === 'MAINTENANCE' && (
                                                        <div className="flex gap-2">
                                                            <div>
                                                                <label className="text-[8px] font-bold text-slate-400 uppercase">
                                                                    KM
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={child.config?.trigger_km || ''}
                                                                    onChange={e =>
                                                                        updateConfig(
                                                                            child.id,
                                                                            'trigger_km',
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                    className="w-full text-xs font-bold bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-bold text-slate-400 uppercase">
                                                                    Days
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={child.config?.trigger_days || ''}
                                                                    onChange={e =>
                                                                        updateConfig(
                                                                            child.id,
                                                                            'trigger_days',
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                    className="w-full text-xs font-bold bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {parent.service_category === 'DELIVERY' && (
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={child.config?.method || 'DOORSTEP'}
                                                                onChange={e =>
                                                                    updateConfig(child.id, 'method', e.target.value)
                                                                }
                                                                className="text-[10px] font-bold bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10"
                                                            >
                                                                <option value="DOORSTEP">Doorstep</option>
                                                                <option value="DEALERSHIP">Dealership</option>
                                                            </select>
                                                            <input
                                                                value={child.config?.timeline || ''}
                                                                onChange={e =>
                                                                    updateConfig(child.id, 'timeline', e.target.value)
                                                                }
                                                                placeholder="Timeline..."
                                                                className="text-xs bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10 w-24"
                                                            />
                                                        </div>
                                                    )}
                                                    {parent.service_category === 'SIMPLE' && <div />}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => saveService(child)}
                                                        disabled={saving === child.id}
                                                        className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                                                    >
                                                        {saving === child.id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            'Save'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteService(child.id, child.name)}
                                                        className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Child Button */}
                                        <div className="px-6 py-3">
                                            <button
                                                onClick={() => addChild(parent.id, parent.service_category)}
                                                className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                                            >
                                                <Plus size={12} /> Add{' '}
                                                {parent.service_category === 'MAINTENANCE'
                                                    ? 'Service Entry'
                                                    : 'Variant'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Expand trigger for items without children (potential groups) */}
                                {!hasChildren &&
                                    (parent.service_category === 'DELIVERY' ||
                                        parent.service_category === 'MAINTENANCE') && (
                                        <div className="border-t border-slate-100 dark:border-white/5 px-6 py-2">
                                            <button
                                                onClick={() => addChild(parent.id, parent.service_category)}
                                                className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700"
                                            >
                                                <Plus size={12} /> Add{' '}
                                                {parent.service_category === 'MAINTENANCE'
                                                    ? 'Schedule Entry'
                                                    : 'Delivery Variant'}
                                            </button>
                                        </div>
                                    )}
                            </div>
                        );
                    })}
            </div>

            {/* Empty State */}
            {parents.length === 0 && !showAddForm && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                        <Sparkles size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-600 dark:text-slate-300 uppercase italic tracking-tight">
                        No Services Yet
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Add delivery, maintenance, or coating services</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={12} className="inline mr-1" /> Add First Service
                    </button>
                </div>
            )}
        </div>
    );
}
