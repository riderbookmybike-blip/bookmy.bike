'use client';

import React, { useState, useEffect } from 'react';
// import { HierarchyNode } from '@/lib/productHierarchy'; // Missing
interface HierarchyNode {
    name: string;
    children: Map<string, HierarchyNode>;
    variants: any[];
}
import { ChevronRight, Plus, Folder, Box, Tag, ArrowLeft, Settings } from 'lucide-react';

interface HierarchyDetailProps {
    type: string; // VEHICLE, etc.
    brandNode: HierarchyNode | null;
}

export default function HierarchyDetail({ type, brandNode }: HierarchyDetailProps) {
    const [selectedModel, setSelectedModel] = useState<HierarchyNode | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<HierarchyNode | null>(null);

    // Reset drill-down when brand changes
    useEffect(() => {
        setSelectedModel(null);
        setSelectedVariant(null);
    }, [brandNode]);

    if (!brandNode) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-gray-400 dark:text-slate-500">
                <div className="text-center">
                    <p>Select a Brand to view details</p>
                </div>
            </div>
        );
    }

    // LEVEL 3: VARIANT VIEW
    if (selectedVariant) {
        return (
            <div className="h-full flex flex-col bg-white dark:bg-slate-900">
                {/* Breadcrumb */}
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950">
                    <button onClick={() => setSelectedModel(null)} className="hover:underline">{brandNode.name}</button>
                    <ChevronRight size={14} />
                    <button onClick={() => setSelectedVariant(null)} className="hover:underline">{selectedModel?.name}</button>
                    <ChevronRight size={14} />
                    <span className="font-bold text-gray-900 dark:text-white">{selectedVariant.name}</span>
                </div>

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVariant.name}</h2>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{selectedVariant.variants.length} Configurations (SKUs)</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                            <Plus size={16} /> Add Configuration
                        </button>
                    </div>
                </div>

                {/* SKU List */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVariant.variants.map(sku => (
                        <div key={sku.id} className="border border-gray-200 dark:border-white/10 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-mono text-xs text-gray-500 dark:text-slate-400 mb-1">{sku.sku}</div>
                                    <div className="font-bold text-gray-800 dark:text-white">{type === 'VEHICLE' ? sku.color : sku.size || sku.duration || 'Standard'}</div>
                                    <div className="text-xs text-gray-600 dark:text-slate-400 mt-2">{sku.label}</div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${sku.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                                    {sku.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // LEVEL 2: MODEL VIEW
    if (selectedModel) {
        return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900">
            {/* Breadcrumb */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950">
                <button onClick={() => setSelectedModel(null)} className="hover:underline">{brandNode.name}</button>
                <ChevronRight size={14} />
                <span className="font-bold text-gray-900 dark:text-white">{selectedModel.name}</span>
            </div>

                {/* List of Variants */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Variants</h2>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10">
                            <Plus size={14} /> Add Variant
                        </button>
                    </div>

                    <div className="space-y-2">
                        {Array.from(selectedModel.children.values()).map(variant => (
                            <div
                                key={variant.name}
                                onClick={() => setSelectedVariant(variant)}
                                className="group flex items-center justify-between p-4 border border-gray-200 dark:border-white/10 rounded-lg cursor-pointer hover:border-blue-400 transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 dark:bg-blue-500/10 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{variant.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{variant.variants.length} SKUs defined</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-300 dark:text-slate-500 group-hover:text-blue-500" size={20} />
                            </div>
                        ))}
                        {selectedModel.children.size === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                No variants found. Add one to continue.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // LEVEL 1: BRAND VIEW
    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 flex items-center justify-center text-lg font-bold text-gray-700 dark:text-slate-200">
                            {brandNode.name[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{brandNode.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full font-bold">
                                    {brandNode.children.size} Models
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Model List */}
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Model Lineup</h3>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-900">
                        <Plus size={14} /> Add Model
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(brandNode.children.values()).map(model => (
                        <div
                            key={model.name}
                            onClick={() => setSelectedModel(model)}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-4 rounded-xl cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <Box className="text-gray-400 group-hover:text-blue-600 transition-colors" size={24} />
                            </div>
                            <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{model.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{model.children.size} Variants</p>
                        </div>
                    ))}
                    {brandNode.children.size === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                            No models defined yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
