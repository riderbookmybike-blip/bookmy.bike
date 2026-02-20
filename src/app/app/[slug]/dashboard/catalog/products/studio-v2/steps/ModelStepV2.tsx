'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Box, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getHierarchyLabels } from '@/lib/constants/catalogLabels';
import { listModels, createModel, updateModel, deleteModel } from '@/actions/catalog/catalogV2Actions';
import type { CatalogModel, ProductType } from '@/actions/catalog/catalogV2Actions';
import CopyableId from '@/components/ui/CopyableId';
import Modal from '@/components/ui/Modal';

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

interface ModelStepProps {
    brand: any;
    category: ProductType;
    modelData: CatalogModel | null;
    onSave: (model: CatalogModel | null) => void;
}

export default function ModelStepV2({ brand, category, modelData, onSave }: ModelStepProps) {
    const labels = getHierarchyLabels(category);
    const [models, setModels] = useState<CatalogModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<CatalogModel | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        product_type: category as string,
        body_type: 'MOTORCYCLE',
        engine_cc: '',
        fuel_type: 'PETROL',
        emission_standard: 'BS6',
        hsn_code: '',
        item_tax_rate: '18',
    });

    useEffect(() => {
        loadModels();
    }, [brand?.id, category]);

    const loadModels = async () => {
        if (!brand?.id) return;
        setIsLoading(true);
        try {
            const data = await listModels(brand.id, category);
            setModels(data || []);
        } catch (err) {
            console.error('Failed to load models:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingModel(null);
        setFormData({
            name: '',
            product_type: category,
            body_type: 'MOTORCYCLE',
            engine_cc: '',
            fuel_type: 'PETROL',
            emission_standard: 'BS6',
            hsn_code: '',
            item_tax_rate: '18',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (model: CatalogModel) => {
        setEditingModel(model);
        setFormData({
            name: model.name,
            product_type: model.product_type,
            body_type: model.body_type || 'MOTORCYCLE',
            engine_cc: String(model.engine_cc || ''),
            fuel_type: model.fuel_type || 'PETROL',
            emission_standard: model.emission_standard || 'BS6',
            hsn_code: model.hsn_code || '',
            item_tax_rate: String(model.item_tax_rate ?? 18),
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error(`${labels.model} name is required`);
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                slug: slugify(formData.name),
                product_type: formData.product_type as ProductType,
                brand_id: brand.id,
                body_type: category === 'VEHICLE' ? formData.body_type : undefined,
                engine_cc: category === 'VEHICLE' && formData.engine_cc ? Number(formData.engine_cc) : undefined,
                fuel_type: category === 'VEHICLE' ? formData.fuel_type : undefined,
                emission_standard: category === 'VEHICLE' ? formData.emission_standard : undefined,
                hsn_code: formData.hsn_code || undefined,
                item_tax_rate: Number(formData.item_tax_rate) || 18,
                status: 'DRAFT' as const,
            };

            if (editingModel) {
                const updated = await updateModel(editingModel.id, payload);
                if (updated) {
                    toast.success(`${labels.model} updated`);
                    setModels(prev => prev.map(m => (m.id === updated.id ? updated : m)));
                    if (modelData?.id === updated.id) onSave(updated);
                }
            } else {
                const created = await createModel(payload);
                if (created) {
                    toast.success(`${labels.model} created`);
                    setModels(prev => [created, ...prev]);
                }
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error('Failed to save model:', err);
            toast.error('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (
            !confirm(
                `Delete this ${labels.model}? This will delete all associated ${labels.variant}s and ${labels.sku}s.`
            )
        )
            return;
        try {
            await deleteModel(id);
            setModels(prev => prev.filter(m => m.id !== id));
            if (modelData?.id === id) onSave(null);
            toast.success(`${labels.model} deleted`);
        } catch (err) {
            console.error('Failed to delete:', err);
            toast.error('Failed to delete');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                        {brand.name} — {labels.model}s
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Select or create a {labels.model.toLowerCase()}
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={16} /> New {labels.model}
                </button>
            </div>

            {/* Model Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {[...models]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(model => {
                        const isSelected = modelData?.id === model.id;
                        return (
                            <div
                                key={model.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onSave(model)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') onSave(model);
                                }}
                                className={`group relative p-4 rounded-2xl border-2 transition-all duration-500 cursor-pointer ${
                                    isSelected
                                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20 shadow-xl shadow-indigo-500/10'
                                        : 'border-slate-100 bg-white dark:bg-white/5 dark:border-white/10 hover:border-indigo-200 hover:shadow-md'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10">
                                        <Box size={20} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase italic leading-tight">
                                            {model.name}
                                        </h4>
                                        {category === 'VEHICLE' && (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {model.engine_cc ? `${model.engine_cc}cc` : ''}{' '}
                                                {model.fuel_type ? `• ${model.fuel_type}` : ''}{' '}
                                                {model.body_type ? `• ${model.body_type}` : ''}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span
                                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                    model.status === 'ACTIVE'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}
                                            >
                                                {model.status}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <CopyableId id={model.id} />
                                        </div>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-emerald-500">
                                        <CheckCircle2
                                            size={18}
                                            fill="currentColor"
                                            strokeWidth={1}
                                            className="text-white"
                                        />
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            openEditModal(model);
                                        }}
                                        className="p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-indigo-600 rounded-xl border border-transparent hover:border-indigo-100 hover:shadow-sm"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleDelete(model.id);
                                        }}
                                        className="p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-600 rounded-xl border border-transparent hover:border-red-100 hover:shadow-sm"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                {/* Create Card */}
                <button
                    onClick={openCreateModal}
                    className="group p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all text-slate-400 hover:text-indigo-600"
                >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">New {labels.model}</span>
                </button>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingModel ? `Edit ${labels.model}` : `New ${labels.model}`}
                >
                    <div className="space-y-5 p-6">
                        {/* Name */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                {labels.model} Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder={
                                    category === 'VEHICLE'
                                        ? 'e.g. Jupiter, Pulsar NS200'
                                        : category === 'ACCESSORY'
                                          ? 'e.g. Helmet, Crash Guard'
                                          : 'e.g. Extended Warranty'
                                }
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                autoFocus
                            />
                        </div>

                        {/* Vehicle-specific fields */}
                        {category === 'VEHICLE' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                            Body Type
                                        </label>
                                        <select
                                            value={formData.body_type}
                                            onChange={e => setFormData({ ...formData, body_type: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                                        >
                                            <option value="MOTORCYCLE">Motorcycle</option>
                                            <option value="SCOOTER">Scooter</option>
                                            <option value="MOPED">Moped</option>
                                            <option value="ELECTRIC">Electric</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                            Engine CC
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.engine_cc}
                                            onChange={e => setFormData({ ...formData, engine_cc: e.target.value })}
                                            placeholder="e.g. 124.73"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                            Fuel Type
                                        </label>
                                        <select
                                            value={formData.fuel_type}
                                            onChange={e => setFormData({ ...formData, fuel_type: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                                        >
                                            <option value="PETROL">Petrol</option>
                                            <option value="EV">Electric (EV)</option>
                                            <option value="CNG">CNG</option>
                                            <option value="DIESEL">Diesel</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                            Emission
                                        </label>
                                        <select
                                            value={formData.emission_standard}
                                            onChange={e =>
                                                setFormData({ ...formData, emission_standard: e.target.value })
                                            }
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                                        >
                                            <option value="BS6">BS6</option>
                                            <option value="BS6_STAGE2">BS6 Stage 2</option>
                                            <option value="BS4">BS4</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Tax fields (all types) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                    HSN Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.hsn_code}
                                    onChange={e => setFormData({ ...formData, hsn_code: e.target.value })}
                                    placeholder="e.g. 87112019"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                    Tax Rate %
                                </label>
                                <input
                                    type="number"
                                    value={formData.item_tax_rate}
                                    onChange={e => setFormData({ ...formData, item_tax_rate: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-wider hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !formData.name.trim()}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : editingModel ? (
                                    'Update'
                                ) : (
                                    'Create'
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
