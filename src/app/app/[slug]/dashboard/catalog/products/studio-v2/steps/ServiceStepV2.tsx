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
    Package,
    Globe,
    Building2,
    Cpu,
    X,
    Link2,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

/* ─────────────────────────── Types ─────────────────────────── */

type PackageCategory = 'FREE_SERVICE' | 'SIMPLE' | 'DELIVERY';
type DisplayTab = 'SERVICE' | 'WARRANTY';
type ScopeType = 'GLOBAL' | 'BRAND' | 'MODEL' | 'SKU';
type ServiceMode = 'OPTIONAL' | 'REQUIRED' | 'BUNDLE';

interface ServiceScope {
    id: string;
    package_id: string;
    scope_type: ScopeType;
    target_id: string | null;
}

interface ServiceEntry {
    id: string;
    package_id: string;
    name: string;
    description: string;
    price: number;
    trigger_km: number;
    trigger_days: number;
    config: Record<string, any>;
    position: number;
    isNew?: boolean;
}

interface ServicePackage {
    id: string;
    name: string;
    description: string;
    category: PackageCategory;
    display_tab: DisplayTab;
    is_mandatory: boolean;
    is_bundle: boolean;
    status: 'ACTIVE' | 'DRAFT';
    position: number;
    price: number;
    discount_price: number;
    max_qty: number;
    entries: ServiceEntry[];
    scopes: ServiceScope[];
    isNew?: boolean;
    isExpanded?: boolean;
    scopeExpanded?: boolean;
}

export interface ServiceStepV2Props {
    modelId: string;
    brandId?: string;
    brandName?: string;
    modelName?: string;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function getMode(pkg: ServicePackage): ServiceMode {
    if (pkg.is_mandatory) return 'REQUIRED';
    if (pkg.is_bundle) return 'BUNDLE';
    return 'OPTIONAL';
}

function cycleMode(pkg: ServicePackage): Partial<ServicePackage> {
    const mode = getMode(pkg);
    if (mode === 'OPTIONAL') return { is_mandatory: true, is_bundle: false };
    if (mode === 'REQUIRED') return { is_mandatory: false, is_bundle: true };
    return { is_mandatory: false, is_bundle: false };
}

const MODE_STYLES: Record<ServiceMode, string> = {
    OPTIONAL: 'bg-slate-50 text-slate-400 dark:bg-white/5',
    REQUIRED: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    BUNDLE: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
};

const SCOPE_STYLES: Record<ScopeType, string> = {
    GLOBAL: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
    BRAND: 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
    MODEL: 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
    SKU: 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
};

const SCOPE_ICONS: Record<ScopeType, any> = {
    GLOBAL: Globe,
    BRAND: Building2,
    MODEL: Cpu,
    SKU: Package,
};

const CAT_META: Record<PackageCategory, { label: string; icon: any; color: string; desc: string }> = {
    FREE_SERVICE: {
        label: 'Free Service Schedule',
        icon: Wrench,
        color: 'text-amber-500',
        desc: 'KM / Day triggered maintenance schedule',
    },
    SIMPLE: {
        label: 'Simple Service',
        icon: Sparkles,
        color: 'text-blue-500',
        desc: 'One-time service (Teflon, AMC, etc.)',
    },
    DELIVERY: {
        label: 'Delivery Option',
        icon: Truck,
        color: 'text-emerald-500',
        desc: 'Delivery variants (Doorstep, Dealership)',
    },
};

/* ─────────────────────────── Component ─────────────────────────── */

export default function ServiceStepV2({ modelId, brandId, brandName, modelName }: ServiceStepV2Props) {
    const supabase = createClient();
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    /* ── Fetch ── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        const [pkgRes, entryRes, scopeRes] = await Promise.all([
            supabase.from('cat_service_packages').select('*').order('position'),
            supabase.from('cat_service_entries').select('*').order('position'),
            supabase.from('cat_service_scope').select('*'),
        ]);

        if (pkgRes.error || entryRes.error || scopeRes.error) {
            toast.error('Failed to load services');
            setLoading(false);
            return;
        }

        const entriesByPkg: Record<string, ServiceEntry[]> = {};
        (entryRes.data || []).forEach((e: any) => {
            if (!entriesByPkg[e.package_id]) entriesByPkg[e.package_id] = [];
            entriesByPkg[e.package_id].push({
                ...e,
                price: Number(e.price ?? 0),
                trigger_km: Number(e.trigger_km ?? 0),
                trigger_days: Number(e.trigger_days ?? 0),
                config: e.config || {},
            });
        });

        const scopesByPkg: Record<string, ServiceScope[]> = {};
        (scopeRes.data || []).forEach((s: any) => {
            if (!scopesByPkg[s.package_id]) scopesByPkg[s.package_id] = [];
            scopesByPkg[s.package_id].push(s);
        });

        setPackages(
            (pkgRes.data || []).map((p: any) => ({
                ...p,
                price: Number(p.price ?? 0),
                discount_price: Number(p.discount_price ?? 0),
                entries: entriesByPkg[p.id] || [],
                scopes: scopesByPkg[p.id] || [],
                isExpanded: true,
                scopeExpanded: false,
            }))
        );
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    /* ── Local state helpers ── */
    const updatePkg = (id: string, changes: Partial<ServicePackage>) =>
        setPackages(prev => prev.map(p => (p.id === id ? { ...p, ...changes } : p)));

    const updateEntry = (pkgId: string, entryId: string, changes: Partial<ServiceEntry>) =>
        setPackages(prev =>
            prev.map(p =>
                p.id === pkgId
                    ? {
                          ...p,
                          entries: p.entries.map(e => (e.id === entryId ? { ...e, ...changes } : e)),
                      }
                    : p
            )
        );

    /* ── Save Package ── */
    const savePackage = async (pkg: ServicePackage) => {
        if (!pkg.name.trim()) {
            toast.error('Name required');
            return;
        }
        setSaving(pkg.id);
        const payload = {
            name: pkg.name,
            description: pkg.description,
            category: pkg.category,
            display_tab: pkg.display_tab,
            is_mandatory: pkg.is_mandatory,
            is_bundle: pkg.is_bundle,
            status: pkg.status,
            position: pkg.position,
            price: String(pkg.price),
            discount_price: String(pkg.discount_price),
            max_qty: pkg.max_qty,
        };

        if (pkg.isNew) {
            const { error } = await supabase.from('cat_service_packages').insert({ id: pkg.id, ...payload });
            if (error) {
                toast.error(`Create failed: ${error.message}`);
                setSaving(null);
                return;
            }
            toast.success(`Created "${pkg.name}"`);
        } else {
            const { error } = await supabase.from('cat_service_packages').update(payload).eq('id', pkg.id);
            if (error) {
                toast.error(`Save failed: ${error.message}`);
                setSaving(null);
                return;
            }
            toast.success(`Saved "${pkg.name}"`);
        }
        setSaving(null);
        await fetchAll();
    };

    /* ── Delete Package ── */
    const deletePackage = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        const { error } = await supabase.from('cat_service_packages').delete().eq('id', id);
        if (error) toast.error(`Delete failed: ${error.message}`);
        else toast.success(`Deleted "${name}"`);
        await fetchAll();
    };

    /* ── Add new package ── */
    const addPackage = (category: PackageCategory) => {
        const id = `pkg-${Date.now()}`;
        const newPkg: ServicePackage = {
            id,
            name: '',
            description: '',
            category,
            display_tab: category === 'FREE_SERVICE' ? 'WARRANTY' : 'SERVICE',
            is_mandatory: false,
            is_bundle: false,
            status: 'DRAFT',
            position: packages.length,
            price: 0,
            discount_price: 0,
            max_qty: 1,
            entries: [],
            scopes: [],
            isNew: true,
            isExpanded: true,
            scopeExpanded: true,
        };
        setPackages(prev => [...prev, newPkg]);
        setShowAddForm(false);
    };

    /* ── Save Entry ── */
    const saveEntry = async (entry: ServiceEntry) => {
        const payload = {
            package_id: entry.package_id,
            name: entry.name,
            description: entry.description,
            price: String(entry.price),
            trigger_km: entry.trigger_km,
            trigger_days: entry.trigger_days,
            config: entry.config,
            position: entry.position,
        };
        if (entry.isNew) {
            const { error } = await supabase.from('cat_service_entries').insert({ id: entry.id, ...payload });
            if (error) {
                toast.error(`Entry create failed: ${error.message}`);
                return;
            }
            toast.success('Entry added');
        } else {
            const { error } = await supabase.from('cat_service_entries').update(payload).eq('id', entry.id);
            if (error) {
                toast.error(`Entry save failed: ${error.message}`);
                return;
            }
            toast.success('Entry saved');
        }
        await fetchAll();
    };

    /* ── Delete Entry ── */
    const deleteEntry = async (entryId: string) => {
        const { error } = await supabase.from('cat_service_entries').delete().eq('id', entryId);
        if (error) toast.error(`Delete failed: ${error.message}`);
        await fetchAll();
    };

    /* ── Add entry locally ── */
    const addEntry = (pkgId: string, category: PackageCategory) => {
        const id = `ent-${Date.now()}`;
        const newEntry: ServiceEntry = {
            id,
            package_id: pkgId,
            name: '',
            description: '',
            price: 0,
            trigger_km: 0,
            trigger_days: 0,
            config: category === 'DELIVERY' ? { method: 'DOORSTEP', timeline: '' } : {},
            position: 0,
            isNew: true,
        };
        setPackages(prev => prev.map(p => (p.id === pkgId ? { ...p, entries: [...p.entries, newEntry] } : p)));
    };

    /* ── Scope: Add ── */
    const addScope = async (pkgId: string, scopeType: ScopeType, targetId?: string) => {
        const pkg = packages.find(p => p.id === pkgId);
        if (!pkg) return;

        // Check if already exists
        const exists = pkg.scopes.some(s => s.scope_type === scopeType && (s.target_id ?? '') === (targetId ?? ''));
        if (exists) {
            toast.info('Already linked');
            return;
        }

        // For new packages, save package first
        if (pkg.isNew) {
            toast.error('Save the package first before adding scope');
            return;
        }

        const { error } = await supabase.from('cat_service_scope').insert({
            package_id: pkgId,
            scope_type: scopeType,
            target_id: targetId || null,
        });
        if (error) toast.error(`Scope add failed: ${error.message}`);
        else toast.success('Scope added');
        await fetchAll();
    };

    /* ── Scope: Remove ── */
    const removeScope = async (scopeId: string) => {
        const { error } = await supabase.from('cat_service_scope').delete().eq('id', scopeId);
        if (error) toast.error(`Remove failed: ${error.message}`);
        await fetchAll();
    };

    /* ── Scope label ── */
    const getScopeLabel = (scope: ServiceScope): string => {
        if (scope.scope_type === 'GLOBAL') return 'Global';
        if (scope.scope_type === 'BRAND') {
            if (scope.target_id === brandId) return `Brand: ${brandName || scope.target_id}`;
            return `Brand: ${scope.target_id?.slice(0, 8)}…`;
        }
        if (scope.scope_type === 'MODEL') {
            if (scope.target_id === modelId) return `Model: ${modelName || scope.target_id?.slice(0, 8)}…`;
            return `Model: ${scope.target_id?.slice(0, 8)}…`;
        }
        return `SKU: ${scope.target_id?.slice(0, 8)}…`;
    };

    /* ── Is linked to current context ── */
    const isLinkedToContext = (pkg: ServicePackage): { linked: boolean; label: string } => {
        if (pkg.scopes.some(s => s.scope_type === 'GLOBAL')) return { linked: true, label: 'Global' };
        if (brandId && pkg.scopes.some(s => s.scope_type === 'BRAND' && s.target_id === brandId))
            return { linked: true, label: `Brand: ${brandName}` };
        if (modelId && pkg.scopes.some(s => s.scope_type === 'MODEL' && s.target_id === modelId))
            return { linked: true, label: 'This Model' };
        return { linked: false, label: '' };
    };

    /* ──────── Group by category ──────── */
    const byCategory = (cat: PackageCategory) =>
        packages.filter(p => p.category === cat).sort((a, b) => a.position - b.position);

    /* ──── Loading ──── */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Services…</span>
            </div>
        );
    }

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    return (
        <div className="max-w-[1200px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                        Services & Warranty
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Manage service packages with scope — Global, Brand, Model, or SKU-level
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={14} /> Add Package
                </button>
            </div>

            {/* Add Package Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                        Choose Package Type
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        {(Object.entries(CAT_META) as [PackageCategory, (typeof CAT_META)[PackageCategory]][]).map(
                            ([key, meta]) => {
                                const Icon = meta.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => addPackage(key)}
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
                                            <p className="text-[10px] text-slate-400 mt-1">{meta.desc}</p>
                                        </div>
                                    </button>
                                );
                            }
                        )}
                    </div>
                    <button
                        onClick={() => setShowAddForm(false)}
                        className="mt-4 text-xs text-slate-400 hover:text-slate-600"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* ─── Sections ─── */}
            {(['FREE_SERVICE', 'SIMPLE', 'DELIVERY'] as PackageCategory[]).map(cat => {
                const catPkgs = byCategory(cat);
                const meta = CAT_META[cat];
                const CatIcon = meta.icon;

                return (
                    <div key={cat}>
                        {/* Section header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className={`w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center ${meta.color}`}
                            >
                                <CatIcon size={16} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                    {meta.label}
                                </h3>
                                <p className="text-[9px] text-slate-400">{meta.desc}</p>
                            </div>
                        </div>

                        {catPkgs.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                No {meta.label} packages yet — click &quot;Add Package&quot; to create one
                            </div>
                        )}

                        <div className="space-y-3">
                            {catPkgs.map(pkg => {
                                const mode = getMode(pkg);
                                const ctx = isLinkedToContext(pkg);
                                const hasEntries = cat === 'FREE_SERVICE' || cat === 'DELIVERY';

                                return (
                                    <PackageCard
                                        key={pkg.id}
                                        pkg={pkg}
                                        mode={mode}
                                        ctxLinked={ctx}
                                        hasEntries={hasEntries}
                                        saving={saving === pkg.id}
                                        brandId={brandId}
                                        brandName={brandName}
                                        modelId={modelId}
                                        modelName={modelName}
                                        onUpdate={changes => updatePkg(pkg.id, changes)}
                                        onUpdateEntry={(eid, ch) => updateEntry(pkg.id, eid, ch)}
                                        onSave={() => savePackage(pkg)}
                                        onDelete={() => deletePackage(pkg.id, pkg.name)}
                                        onAddEntry={() => addEntry(pkg.id, pkg.category)}
                                        onSaveEntry={entry => saveEntry(entry)}
                                        onDeleteEntry={eid => deleteEntry(eid)}
                                        onAddScope={(st, tid) => addScope(pkg.id, st, tid)}
                                        onRemoveScope={sid => removeScope(sid)}
                                        getScopeLabel={getScopeLabel}
                                        onCycleMode={() => updatePkg(pkg.id, cycleMode(pkg))}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════ PackageCard ═══════════════════════════ */

interface PackageCardProps {
    pkg: ServicePackage;
    mode: ServiceMode;
    ctxLinked: { linked: boolean; label: string };
    hasEntries: boolean;
    saving: boolean;
    brandId?: string;
    brandName?: string;
    modelId: string;
    modelName?: string;
    onUpdate: (ch: Partial<ServicePackage>) => void;
    onUpdateEntry: (eid: string, ch: Partial<ServiceEntry>) => void;
    onSave: () => void;
    onDelete: () => void;
    onAddEntry: () => void;
    onSaveEntry: (e: ServiceEntry) => void;
    onDeleteEntry: (eid: string) => void;
    onAddScope: (st: ScopeType, tid?: string) => void;
    onRemoveScope: (sid: string) => void;
    getScopeLabel: (s: ServiceScope) => string;
    onCycleMode: () => void;
}

function PackageCard({
    pkg,
    mode,
    ctxLinked,
    hasEntries,
    saving,
    brandId,
    brandName,
    modelId,
    modelName,
    onUpdate,
    onUpdateEntry,
    onSave,
    onDelete,
    onAddEntry,
    onSaveEntry,
    onDeleteEntry,
    onAddScope,
    onRemoveScope,
    getScopeLabel,
    onCycleMode,
}: PackageCardProps) {
    const isExpanded = pkg.isExpanded ?? true;
    const scopeExpanded = pkg.scopeExpanded ?? false;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* ── Package Header Row ── */}
            <div className="flex items-center gap-4 px-6 py-4">
                {/* Name + Description */}
                <div className="flex-1 min-w-0">
                    <input
                        value={pkg.name}
                        onChange={e => onUpdate({ name: e.target.value })}
                        placeholder="Package name…"
                        className="text-sm font-black text-slate-900 dark:text-white bg-transparent border-0 outline-none w-full placeholder:text-slate-300"
                    />
                    <input
                        value={pkg.description}
                        onChange={e => onUpdate({ description: e.target.value })}
                        placeholder="Short description…"
                        className="text-[11px] text-slate-400 bg-transparent border-0 outline-none w-full mt-0.5 placeholder:text-slate-200"
                    />
                </div>

                {/* SIMPLE: price + offer */}
                {pkg.category === 'SIMPLE' && (
                    <>
                        <div className="shrink-0">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Price ₹
                            </label>
                            <input
                                type="number"
                                value={pkg.price != null ? pkg.price : ''}
                                onChange={e => onUpdate({ price: Number(e.target.value) })}
                                className="w-24 text-sm font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-100 dark:border-white/10 block"
                            />
                        </div>
                        <div className="shrink-0">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Offer ₹
                            </label>
                            <input
                                type="number"
                                value={pkg.discount_price != null ? pkg.discount_price : ''}
                                onChange={e => onUpdate({ discount_price: Number(e.target.value) })}
                                className="w-24 text-sm font-bold text-emerald-600 bg-slate-50 dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-100 dark:border-white/10 block"
                            />
                        </div>
                    </>
                )}

                {/* Display Tab */}
                <select
                    value={pkg.display_tab}
                    onChange={e => onUpdate({ display_tab: e.target.value as DisplayTab })}
                    className="shrink-0 text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-white/5 rounded-lg px-2 py-1.5 border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300"
                >
                    <option value="SERVICE">
                        <Shield size={10} /> Services
                    </option>
                    <option value="WARRANTY">Warranty</option>
                </select>

                {/* Mode cycler */}
                <button
                    onClick={onCycleMode}
                    title={
                        mode === 'REQUIRED'
                            ? 'Required — click for Bundle'
                            : mode === 'BUNDLE'
                              ? 'Bundle (auto-selected) — click for Optional'
                              : 'Optional — click for Required'
                    }
                    className={`shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-lg transition-all ${MODE_STYLES[mode]}`}
                >
                    {mode === 'REQUIRED' ? (
                        <ToggleRight size={14} />
                    ) : mode === 'BUNDLE' ? (
                        <Package size={14} />
                    ) : (
                        <ToggleLeft size={14} />
                    )}
                    {mode === 'REQUIRED' ? 'Required' : mode === 'BUNDLE' ? 'Bundle' : 'Optional'}
                </button>

                {/* Context Link badge */}
                {ctxLinked.linked && (
                    <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200">
                        <Link2 size={10} />
                        {ctxLinked.label}
                    </span>
                )}

                {/* Expand entries toggle */}
                {hasEntries && (
                    <button
                        onClick={() => onUpdate({ isExpanded: !isExpanded })}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 shrink-0"
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                )}

                {/* Save */}
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all"
                >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                </button>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* ── Entries (FREE_SERVICE / DELIVERY) ── */}
            {hasEntries && isExpanded && (
                <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                    {pkg.entries.map(entry => (
                        <EntryRow
                            key={entry.id}
                            entry={entry}
                            category={pkg.category}
                            onUpdate={ch => onUpdateEntry(entry.id, ch)}
                            onSave={() => onSaveEntry(entry)}
                            onDelete={() => onDeleteEntry(entry.id)}
                        />
                    ))}
                    <div className="px-6 py-3">
                        <button
                            onClick={onAddEntry}
                            className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                        >
                            <Plus size={12} />
                            {pkg.category === 'FREE_SERVICE' ? 'Add Service Entry' : 'Add Delivery Variant'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Scope Section ── */}
            <div className="border-t border-slate-100 dark:border-white/5">
                <button
                    onClick={() => onUpdate({ scopeExpanded: !scopeExpanded })}
                    className="w-full flex items-center justify-between px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <Globe size={12} />
                        Scope & Assignment
                        {pkg.scopes.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[9px]">
                                {pkg.scopes.length}
                            </span>
                        )}
                    </span>
                    <ChevronRight size={12} className={`transition-transform ${scopeExpanded ? 'rotate-90' : ''}`} />
                </button>

                {scopeExpanded && (
                    <div className="px-6 pb-4 space-y-3">
                        {/* Current scope tags */}
                        <div className="flex flex-wrap gap-2">
                            {pkg.scopes.map(scope => {
                                const Icon = SCOPE_ICONS[scope.scope_type];
                                return (
                                    <span
                                        key={scope.id}
                                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${SCOPE_STYLES[scope.scope_type]}`}
                                    >
                                        <Icon size={10} />
                                        {getScopeLabel(scope)}
                                        <button
                                            onClick={() => onRemoveScope(scope.id)}
                                            className="ml-0.5 hover:text-red-500 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                );
                            })}
                            {pkg.scopes.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">
                                    No scope — not visible anywhere yet
                                </span>
                            )}
                        </div>

                        {/* Quick assign buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => onAddScope('GLOBAL')}
                                className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                                <Globe size={10} /> Make Global
                            </button>
                            {brandId && (
                                <button
                                    onClick={() => onAddScope('BRAND', brandId)}
                                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <Building2 size={10} /> Link to {brandName || 'Brand'}
                                </button>
                            )}
                            {modelId && (
                                <button
                                    onClick={() => onAddScope('MODEL', modelId)}
                                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                >
                                    <Cpu size={10} /> Link to {modelName || 'This Model'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════ EntryRow ═══════════════════════════ */

interface EntryRowProps {
    entry: ServiceEntry;
    category: PackageCategory;
    onUpdate: (ch: Partial<ServiceEntry>) => void;
    onSave: () => void;
    onDelete: () => void;
}

function EntryRow({ entry, category, onUpdate, onSave, onDelete }: EntryRowProps) {
    return (
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-100/80 dark:border-white/5 last:border-b-0">
            <div className="w-8 flex items-center justify-center text-slate-300 shrink-0">
                <GripVertical size={14} />
            </div>

            {/* Name + Desc */}
            <div className="flex-1 min-w-0">
                <input
                    value={entry.name}
                    onChange={e => onUpdate({ name: e.target.value })}
                    placeholder="Entry name…"
                    className="text-sm font-bold text-slate-800 dark:text-white bg-transparent border-0 outline-none w-full placeholder:text-slate-300"
                />
                <input
                    value={entry.description}
                    onChange={e => onUpdate({ description: e.target.value })}
                    placeholder="Description…"
                    className="text-[11px] text-slate-400 bg-transparent border-0 outline-none w-full mt-0.5 placeholder:text-slate-200"
                />
            </div>

            {/* FREE_SERVICE: KM + Days + Price */}
            {category === 'FREE_SERVICE' && (
                <>
                    <div className="shrink-0">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">KM</label>
                        <input
                            type="number"
                            value={entry.trigger_km != null ? entry.trigger_km : ''}
                            onChange={e => onUpdate({ trigger_km: Number(e.target.value) })}
                            className="w-20 text-xs font-bold bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10 block"
                        />
                    </div>
                    <div className="shrink-0">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Days</label>
                        <input
                            type="number"
                            value={entry.trigger_days != null ? entry.trigger_days : ''}
                            onChange={e => onUpdate({ trigger_days: Number(e.target.value) })}
                            className="w-16 text-xs font-bold bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10 block"
                        />
                    </div>
                    <div className="shrink-0">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Price ₹</label>
                        <input
                            type="number"
                            value={entry.price != null ? entry.price : ''}
                            onChange={e => onUpdate({ price: Number(e.target.value) })}
                            className="w-20 text-xs font-bold bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10 block"
                        />
                    </div>
                </>
            )}

            {/* DELIVERY: Method + Timeline + Price */}
            {category === 'DELIVERY' && (
                <>
                    <select
                        value={entry.config?.method || 'DOORSTEP'}
                        onChange={e => onUpdate({ config: { ...entry.config, method: e.target.value } })}
                        className="shrink-0 text-[10px] font-bold bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10"
                    >
                        <option value="DOORSTEP">Doorstep</option>
                        <option value="DEALERSHIP">Dealership</option>
                    </select>
                    <input
                        value={entry.config?.timeline || ''}
                        onChange={e => onUpdate({ config: { ...entry.config, timeline: e.target.value } })}
                        placeholder="Timeline…"
                        className="shrink-0 text-xs bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10 w-24"
                    />
                    <div className="shrink-0">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Price ₹</label>
                        <input
                            type="number"
                            value={entry.price != null ? entry.price : ''}
                            onChange={e => onUpdate({ price: Number(e.target.value) })}
                            className="w-20 text-xs font-bold bg-white dark:bg-white/5 rounded-lg px-2 py-1 border border-slate-200 dark:border-white/10 block"
                        />
                    </div>
                </>
            )}

            {/* Entry Save + Delete */}
            <button
                onClick={onSave}
                className="shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
            >
                Save
            </button>
            <button
                onClick={onDelete}
                className="shrink-0 p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}
