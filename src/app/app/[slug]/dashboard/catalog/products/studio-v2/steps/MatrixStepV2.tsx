'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Grid3X3, Palette, Layers, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { getHierarchyLabels } from '@/lib/constants/catalogLabels';
import { updateSku } from '@/actions/catalog/catalogV2Actions';
import type { CatalogModel, CatalogSku, CatalogColour, ProductType } from '@/actions/catalog/catalogV2Actions';

interface MatrixStepProps {
    model: CatalogModel;
    variants: any[];
    colours: CatalogColour[];
    skus: CatalogSku[];
    onUpdate: (skus: CatalogSku[]) => void;
}

export default function MatrixStepV2({ model, variants, colours, skus, onUpdate }: MatrixStepProps) {
    const productType = (model.product_type || 'VEHICLE') as ProductType;
    const labels = getHierarchyLabels(productType);
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [priceInput, setPriceInput] = useState('');

    const variantFkField =
        productType === 'VEHICLE'
            ? 'vehicle_variant_id'
            : productType === 'ACCESSORY'
              ? 'accessory_variant_id'
              : 'service_variant_id';

    // Get all unique SKU names
    const uniqueSkuNames = [...new Set(skus.map(s => s.name))].sort();

    // Build matrix: variant-rows × sku-columns
    const getSkuForCell = (variantId: string, skuName: string) =>
        skus.find(s => (s as any)[variantFkField] === variantId && s.name === skuName);

    const handlePriceUpdate = async (skuId: string) => {
        const price = Number(priceInput);
        if (isNaN(price) || price < 0) {
            toast.error('Invalid price');
            return;
        }
        try {
            const updated = await updateSku(skuId, { price_base: price });
            if (updated) {
                onUpdate(skus.map(s => (s.id === skuId ? updated : s)));
                toast.success('Price updated');
            }
        } catch {
            toast.error('Failed to update');
        }
        setEditingCell(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                    {model.name} — SKU Matrix
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Cross-reference of {labels.variant.toLowerCase()}s × {labels.sku.toLowerCase()}s · Click any price
                    to edit
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                            <Layers size={18} className="text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{variants.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {labels.variant}s
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                            <Palette size={18} className="text-pink-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                {uniqueSkuNames.length}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Unique {labels.sku}s
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <Grid3X3 size={18} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{skus.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total SKUs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            {skus.length > 0 ? (
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5">
                                    <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 dark:bg-white/[0.02] sticky left-0">
                                        {labels.variant} ↓ / {labels.sku} →
                                    </th>
                                    {uniqueSkuNames.map(name => (
                                        <th
                                            key={name}
                                            className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center whitespace-nowrap"
                                        >
                                            {name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map(variant => (
                                    <tr
                                        key={variant.id}
                                        className="border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 whitespace-nowrap">
                                            {variant.name}
                                        </td>
                                        {uniqueSkuNames.map(skuName => {
                                            const sku = getSkuForCell(variant.id, skuName);
                                            const cellKey = `${variant.id}-${skuName}`;

                                            if (!sku) {
                                                return (
                                                    <td key={cellKey} className="px-4 py-3 text-center">
                                                        <div className="flex justify-center">
                                                            <XCircle size={14} className="text-slate-200" />
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={cellKey} className="px-4 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {(() => {
                                                            const linkedColour = sku.colour_id
                                                                ? colours.find(c => c.id === sku.colour_id)
                                                                : null;
                                                            const hexColor =
                                                                linkedColour?.hex_primary || sku.hex_primary;
                                                            return hexColor ? (
                                                                <div
                                                                    className="w-5 h-5 rounded-md border border-white shadow-sm"
                                                                    style={{ backgroundColor: hexColor }}
                                                                    title={linkedColour?.name || sku.color_name || ''}
                                                                />
                                                            ) : null;
                                                        })()}
                                                        {editingCell === sku.id ? (
                                                            <input
                                                                type="number"
                                                                value={priceInput}
                                                                onChange={e => setPriceInput(e.target.value)}
                                                                onBlur={() => handlePriceUpdate(sku.id)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') handlePriceUpdate(sku.id);
                                                                }}
                                                                className="w-24 px-2 py-1 text-xs font-mono text-center border border-indigo-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCell(sku.id);
                                                                    setPriceInput(String(sku.price_base || 0));
                                                                }}
                                                                className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 cursor-pointer group flex items-center gap-1"
                                                            >
                                                                ₹{(sku.price_base || 0).toLocaleString('en-IN')}
                                                                <Edit2
                                                                    size={10}
                                                                    className="opacity-0 group-hover:opacity-60"
                                                                />
                                                            </button>
                                                        )}
                                                        <span
                                                            className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                                                sku.status === 'ACTIVE'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                            }`}
                                                        >
                                                            {sku.status}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-slate-400">
                    <Grid3X3 size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold text-sm">No SKUs to display</p>
                    <p className="text-xs mt-1">Go back and add {labels.sku.toLowerCase()}s first</p>
                </div>
            )}
        </div>
    );
}
