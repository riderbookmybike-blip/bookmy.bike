'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import type {
    DiscountPayoutBasis,
    DiscountPayoutEntry,
    DiscountPayoutScope,
    DiscountPayoutVehicleType,
} from '@/types/insurance';
import { createClient } from '@/lib/supabase/client';

interface InsuranceDiscountPayoutProps {
    entries?: DiscountPayoutEntry[];
    onChange: (entries: DiscountPayoutEntry[]) => void;
    readOnly?: boolean;
}

interface BrandOption {
    id: string;
    name: string;
}

interface ModelOption {
    id: string;
    name: string;
    brand_id: string;
    body_type: string | null;
    fuel_type: string | null;
}

interface DraftRule {
    brandId: string;
    vehicleType: DiscountPayoutVehicleType | '';
    modelId: string;
    odDiscount: string;
    payoutPercent: string;
    payoutBasis: DiscountPayoutBasis;
}

const NEW_ROW_KEY = '__new_discount_row__';

const PAYOUT_BASIS_OPTIONS: Array<{ value: DiscountPayoutBasis; label: string }> = [
    { value: 'NET_PREMIUM', label: 'Net Premium' },
    { value: 'GROSS_PREMIUM', label: 'Gross Premium' },
    { value: 'OD_NET', label: 'OD Net' },
];

const VEHICLE_TYPE_OPTIONS: DiscountPayoutVehicleType[] = ['SCOOTER', 'MOTORCYCLE', 'EV'];

const SCOPE_PRIORITY: Record<DiscountPayoutScope, number> = {
    MODEL: 0,
    VEHICLE_TYPE: 1,
    BRAND: 2,
    ALL: 3,
};

const toScopeLabel = (scope: DiscountPayoutScope) => {
    if (scope === 'VEHICLE_TYPE') return 'VEHICLE TYPE';
    return scope;
};

const inferVehicleTypeFromModel = (model?: ModelOption | null): DiscountPayoutVehicleType | undefined => {
    if (!model) return undefined;
    const fuel = String(model.fuel_type || '').toUpperCase();
    const bodyType = String(model.body_type || '').toUpperCase();
    if (fuel.includes('EV') || bodyType.includes('EV')) return 'EV';
    if (bodyType.includes('SCOOTER')) return 'SCOOTER';
    return 'MOTORCYCLE';
};

const createDefaultDraft = (): DraftRule => ({
    brandId: '',
    vehicleType: '',
    modelId: '',
    odDiscount: '',
    payoutPercent: '',
    payoutBasis: 'NET_PREMIUM',
});

const resolveScope = (draft: DraftRule): DiscountPayoutScope => {
    if (draft.modelId) return 'MODEL';
    if (draft.vehicleType) return 'VEHICLE_TYPE';
    if (draft.brandId) return 'BRAND';
    return 'ALL';
};

const basisLabelMap: Record<DiscountPayoutBasis, string> = {
    NET_PREMIUM: 'Net Premium',
    GROSS_PREMIUM: 'Gross Premium',
    OD_NET: 'OD Net',
};

const showOrAll = (value?: string) => {
    const normalized = String(value || '').trim();
    return normalized.length > 0 ? normalized : 'ALL';
};

export default function InsuranceDiscountPayout({
    entries = [],
    onChange,
    readOnly = false,
}: InsuranceDiscountPayoutProps) {
    const [brands, setBrands] = useState<BrandOption[]>([]);
    const [models, setModels] = useState<ModelOption[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [catalogError, setCatalogError] = useState('');

    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [draft, setDraft] = useState<DraftRule>(createDefaultDraft());
    const [formError, setFormError] = useState('');

    useEffect(() => {
        const fetchCatalog = async () => {
            setLoadingCatalog(true);
            setCatalogError('');
            const supabase = createClient();

            const [brandResponse, modelResponse] = await Promise.all([
                supabase.from('cat_brands').select('id, name').eq('is_active', true).order('name'),
                supabase.from('cat_models').select('id, name, brand_id, body_type, fuel_type').order('name'),
            ]);

            if (brandResponse.error || modelResponse.error) {
                setCatalogError(brandResponse.error?.message || modelResponse.error?.message || 'Catalog fetch failed');
                setLoadingCatalog(false);
                return;
            }

            setBrands((brandResponse.data || []) as BrandOption[]);
            setModels((modelResponse.data || []) as ModelOption[]);
            setLoadingCatalog(false);
        };

        fetchCatalog();
    }, []);

    useEffect(() => {
        if (!editingKey) return;
        if (editingKey === NEW_ROW_KEY) return;
        const exists = entries.some(entry => entry.id === editingKey);
        if (!exists) {
            setEditingKey(null);
            setDraft(createDefaultDraft());
            setFormError('');
        }
    }, [editingKey, entries]);

    const sortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => {
            const scopeDiff = SCOPE_PRIORITY[a.scope] - SCOPE_PRIORITY[b.scope];
            if (scopeDiff !== 0) return scopeDiff;
            return a.brandName?.localeCompare(b.brandName || '') || 0;
        });
    }, [entries]);

    const scopePreview = resolveScope(draft);
    const hasAllRule = entries.some(entry => entry.scope === 'ALL');

    const filteredModels = useMemo(() => {
        let next = models;
        if (draft.brandId) {
            next = next.filter(model => model.brand_id === draft.brandId);
        }

        if (!draft.vehicleType) return next;

        return next.filter(model => {
            const bodyType = String(model.body_type || '').toUpperCase();
            const fuelType = String(model.fuel_type || '').toUpperCase();
            if (draft.vehicleType === 'EV') return fuelType.includes('EV') || bodyType.includes('EV');
            if (draft.vehicleType === 'SCOOTER') return bodyType.includes('SCOOTER');
            if (draft.vehicleType === 'MOTORCYCLE') return bodyType.includes('MOTORCYCLE') || bodyType === '';
            return true;
        });
    }, [draft.brandId, draft.vehicleType, models]);

    const startCreate = () => {
        setEditingKey(NEW_ROW_KEY);
        setDraft(createDefaultDraft());
        setFormError('');
    };

    const startEdit = (entry: DiscountPayoutEntry) => {
        setEditingKey(entry.id);
        setDraft({
            brandId: entry.brandId || '',
            vehicleType: entry.vehicleType || '',
            modelId: entry.modelId || '',
            odDiscount: String(entry.odDiscount ?? ''),
            payoutPercent: String(entry.payoutPercent ?? ''),
            payoutBasis: entry.payoutBasis || 'NET_PREMIUM',
        });
        setFormError('');
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setDraft(createDefaultDraft());
        setFormError('');
    };

    const handleBrandChange = (brandId: string) => {
        setDraft(prev => {
            if (!prev.modelId) return { ...prev, brandId };
            const selectedModel = models.find(model => model.id === prev.modelId);
            const keepModel = selectedModel?.brand_id === brandId;
            return {
                ...prev,
                brandId,
                modelId: keepModel ? prev.modelId : '',
            };
        });
    };

    const handleModelChange = (modelId: string) => {
        if (!modelId) {
            setDraft(prev => ({ ...prev, modelId: '' }));
            return;
        }

        const selectedModel = models.find(model => model.id === modelId);
        setDraft(prev => ({
            ...prev,
            modelId,
            brandId: selectedModel?.brand_id || prev.brandId,
            vehicleType: prev.vehicleType || inferVehicleTypeFromModel(selectedModel) || '',
        }));
    };

    const handleDelete = (entryId: string) => {
        const nextEntries = entries.filter(entry => entry.id !== entryId);
        onChange(nextEntries);
        if (editingKey === entryId) cancelEdit();
    };

    const saveDraft = () => {
        setFormError('');

        const odDiscount = Number(draft.odDiscount);
        const payoutPercent = Number(draft.payoutPercent);
        const scope = resolveScope(draft);

        if (Number.isNaN(odDiscount) || odDiscount < 0 || odDiscount > 100) {
            setFormError('OD Discount must be between 0 and 100.');
            return;
        }
        if (Number.isNaN(payoutPercent) || payoutPercent < 0 || payoutPercent > 100) {
            setFormError('Payout % must be between 0 and 100.');
            return;
        }
        if (scope === 'BRAND' && !draft.brandId) {
            setFormError('Select a brand for a brand-level rule.');
            return;
        }
        if (scope === 'VEHICLE_TYPE' && !draft.vehicleType) {
            setFormError('Select a vehicle type for this rule.');
            return;
        }
        if (scope === 'MODEL' && !draft.modelId) {
            setFormError('Select a model for a model-level rule.');
            return;
        }

        const selectedBrand = brands.find(brand => brand.id === draft.brandId);
        const selectedModel = models.find(model => model.id === draft.modelId);
        const resolvedVehicleType =
            draft.vehicleType || (scope === 'MODEL' ? inferVehicleTypeFromModel(selectedModel) : undefined);

        const nextEntry: DiscountPayoutEntry = {
            id: editingKey === NEW_ROW_KEY ? crypto.randomUUID() : String(editingKey),
            scope,
            odDiscount,
            payoutPercent,
            payoutBasis: draft.payoutBasis,
            brandId: draft.brandId || undefined,
            brandName: selectedBrand?.name,
            vehicleType: resolvedVehicleType,
            modelId: draft.modelId || undefined,
            modelName: selectedModel?.name,
        };

        const isUpdate = editingKey && editingKey !== NEW_ROW_KEY;
        const nextEntries = isUpdate
            ? entries.map(entry => (entry.id === editingKey ? nextEntry : entry))
            : [...entries, nextEntry];

        onChange(nextEntries);
        cancelEdit();
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Discount & Payout</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Resolution: Model {'>'} Vehicle Type {'>'} Brand {'>'} All
                    </p>
                </div>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={startCreate}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                    >
                        <Plus size={14} />
                        Add Rule
                    </button>
                )}
            </div>

            <div className="space-y-3 p-4">
                {!hasAllRule && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">
                            No ALL fallback rule found. Simulator fallback may be inconsistent without a default.
                        </p>
                    </div>
                )}

                {catalogError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-700">
                        Failed to load brands/models: {catalogError}
                    </div>
                )}

                {editingKey && !readOnly && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                            <label className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Brand
                                </span>
                                <select
                                    value={draft.brandId}
                                    onChange={e => handleBrandChange(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-400"
                                >
                                    <option value="">All Brands</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Vehicle Type
                                </span>
                                <select
                                    value={draft.vehicleType}
                                    onChange={e =>
                                        setDraft(prev => ({
                                            ...prev,
                                            vehicleType: e.target.value as DiscountPayoutVehicleType | '',
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-400"
                                >
                                    <option value="">All Types</option>
                                    {VEHICLE_TYPE_OPTIONS.map(type => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Model
                                </span>
                                <select
                                    value={draft.modelId}
                                    onChange={e => handleModelChange(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-400"
                                >
                                    <option value="">All Models</option>
                                    {filteredModels.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    OD Disc %
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    value={draft.odDiscount}
                                    onChange={e => setDraft(prev => ({ ...prev, odDiscount: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-400"
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Payout %
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    value={draft.payoutPercent}
                                    onChange={e => setDraft(prev => ({ ...prev, payoutPercent: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-400"
                                />
                            </label>

                            <label className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Payout Basis
                                </span>
                                <select
                                    value={draft.payoutBasis}
                                    onChange={e =>
                                        setDraft(prev => ({
                                            ...prev,
                                            payoutBasis: e.target.value as DiscountPayoutBasis,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-400"
                                >
                                    {PAYOUT_BASIS_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                                Scope Auto-detected: {toScopeLabel(scopePreview)}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-slate-300"
                                >
                                    <X size={12} /> Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={saveDraft}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-500 bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-700"
                                >
                                    <Save size={12} /> Save Rule
                                </button>
                            </div>
                        </div>

                        {formError && (
                            <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-red-600">
                                {formError}
                            </p>
                        )}
                    </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {[
                                    'Scope',
                                    'Brand',
                                    'Type',
                                    'Model',
                                    'OD Disc %',
                                    'Payout %',
                                    'Payout Basis',
                                    'Actions',
                                ].map(col => (
                                    <th
                                        key={col}
                                        className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-500"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loadingCatalog && (
                                <tr>
                                    <td colSpan={8} className="px-3 py-6">
                                        <div className="flex items-center justify-center gap-2 text-slate-500">
                                            <Loader2 size={14} className="animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                Loading brands and models...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loadingCatalog && sortedEntries.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-3 py-8 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            No discount/payout rules added yet.
                                        </p>
                                    </td>
                                </tr>
                            )}

                            {!loadingCatalog &&
                                sortedEntries.map(entry => (
                                    <tr key={entry.id}>
                                        <td className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700">
                                            {toScopeLabel(entry.scope)}
                                        </td>
                                        <td className="px-3 py-2 text-xs font-bold text-slate-800">
                                            {showOrAll(entry.brandName)}
                                        </td>
                                        <td className="px-3 py-2 text-xs font-bold text-slate-700">
                                            {showOrAll(entry.vehicleType)}
                                        </td>
                                        <td className="px-3 py-2 text-xs font-bold text-slate-700">
                                            {showOrAll(entry.modelName)}
                                        </td>
                                        <td className="px-3 py-2 text-xs font-black text-slate-900">
                                            {entry.odDiscount.toFixed(2)}%
                                        </td>
                                        <td className="px-3 py-2 text-xs font-black text-slate-900">
                                            {entry.payoutPercent.toFixed(2)}%
                                        </td>
                                        <td className="px-3 py-2 text-xs font-bold text-slate-700">
                                            {basisLabelMap[entry.payoutBasis]}
                                        </td>
                                        <td className="px-3 py-2">
                                            {!readOnly ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(entry)}
                                                        className="inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-blue-300 hover:text-blue-700"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-red-300 hover:text-red-700"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Read only
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
