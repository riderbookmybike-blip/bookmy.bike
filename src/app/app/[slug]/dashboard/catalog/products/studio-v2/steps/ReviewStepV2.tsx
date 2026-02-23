'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Layers, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getFullProductTree, deleteSku } from '@/actions/catalog/catalogV2Actions';
import { getHierarchyLabels } from '@/lib/constants/catalogLabels';
import type { ProductType } from '@/actions/catalog/catalogV2Actions';

interface ReviewStepProps {
    modelId: string;
}

interface TreeData {
    brand: any;
    model: any;
    variants: any[];
    allSkus: any[];
}

export default function ReviewStepV2({ modelId }: ReviewStepProps) {
    const [tree, setTree] = useState<TreeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTree();
    }, [modelId]);

    const loadTree = async () => {
        setIsLoading(true);
        try {
            const data = await getFullProductTree(modelId);
            setTree(data);
        } catch (err) {
            console.error('Failed to load tree:', err);
            toast.error('Failed to load product tree');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSku = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete SKU "${name}"?`)) return;
        try {
            await deleteSku(id);
            toast.success(`Deleted SKU ${name}`);
            loadTree();
        } catch (err) {
            toast.error('Failed to delete SKU');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    if (!tree || !tree.model) {
        return (
            <div className="text-center py-20 text-slate-400">
                <AlertTriangle size={48} className="mx-auto mb-4" />
                <p className="font-bold">Could not load product data</p>
            </div>
        );
    }

    const productType = (tree.model.product_type || 'VEHICLE') as ProductType;
    const labels = getHierarchyLabels(productType);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                    Review — {tree.model.name}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Verify product tree before publishing
                </p>
            </div>

            {/* Variant → SKU Tree */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-6 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Product Tree</h3>
                <div className="space-y-4">
                    {tree.variants.map((variant: any) => {
                        const variantSkus = tree.allSkus.filter(
                            (s: any) =>
                                s.vehicle_variant_id === variant.id ||
                                s.accessory_variant_id === variant.id ||
                                s.service_variant_id === variant.id
                        );
                        return (
                            <div
                                key={variant.id}
                                className="border border-slate-100 dark:border-white/5 rounded-xl p-4"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <Layers size={16} className="text-indigo-500" />
                                    <span className="font-bold text-slate-900 dark:text-white">{variant.name}</span>
                                    <span
                                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                            variant.status === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {variant.status}
                                    </span>
                                </div>
                                {variantSkus.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-7">
                                        {variantSkus.map((sku: any) => (
                                            <div
                                                key={sku.id}
                                                className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.03] p-2 rounded-lg"
                                            >
                                                {sku.hex_primary && (
                                                    <div
                                                        className="w-4 h-4 rounded"
                                                        style={{ backgroundColor: sku.hex_primary }}
                                                    />
                                                )}
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                                    {sku.name}
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-400">
                                                    ₹{(sku.price_base || 0).toLocaleString('en-IN')}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteSku(sku.id, sku.name)}
                                                    className="p-1 px-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Permanently delete SKU"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="ml-7 text-xs text-slate-400 italic">No {labels.sku.toLowerCase()}s</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Orphaned SKUs cleanup (if any exist) */}
            {tree.allSkus.some(
                s =>
                    !tree.variants.some(
                        v =>
                            v.id === s.vehicle_variant_id ||
                            v.id === s.accessory_variant_id ||
                            v.id === s.service_variant_id
                    )
            ) && (
                <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-rose-500" size={20} />
                        <h3 className="text-sm font-black uppercase tracking-tight text-rose-900 dark:text-rose-400">
                            Orphaned SKUs Detected
                        </h3>
                    </div>
                    <p className="text-xs text-rose-600 dark:text-rose-500/80 italic">
                        The following SKUs are not linked to any active variant. You should delete them to keep the
                        catalog clean.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {tree.allSkus
                            .filter(
                                s =>
                                    !tree.variants.some(
                                        v =>
                                            v.id === s.vehicle_variant_id ||
                                            v.id === s.accessory_variant_id ||
                                            v.id === s.service_variant_id
                                    )
                            )
                            .map(sku => (
                                <div
                                    key={sku.id}
                                    className="flex items-center gap-2 bg-white dark:bg-black/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30"
                                >
                                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 truncate">
                                        {sku.name}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteSku(sku.id, sku.name)}
                                        className="ml-auto p-1 text-rose-300 hover:text-rose-600 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
