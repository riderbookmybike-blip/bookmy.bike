'use client';

import React, { useState } from 'react';
import { Search, Download, FileText, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

import { VehicleModel, ModelVariant, ModelColor } from '@/types/productMaster';

interface SKUItem {
    id: string;
    modelName: string;
    variantName: string;
    colorName: string;
    colorCode: string;
    fullName: string;
    status: 'ACTIVE' | 'PENDING' | 'INCOMPLETE';
}

interface VehicleSKUListViewProps {
    models: VehicleModel[];
    colors: ModelColor[];
    brandName: string;
}

export default function VehicleSKUListView({ models, colors, brandName }: VehicleSKUListViewProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Flatten logic
    const allSkus: SKUItem[] = [];
    models.forEach(model => {
        model.variants.forEach((variant: ModelVariant) => {
            const applicableColors = colors.filter(c => c.variantIds?.includes(variant.id));

            // If no colors assigned, we still show an 'INCOMPLETE' variant row maybe?
            // But per user request, he wants Model + Variant + Color combinations.
            applicableColors.forEach(color => {
                allSkus.push({
                    id: `${model.id}-${variant.id}-${color.id}`,
                    modelName: model.name,
                    variantName: variant.name,
                    colorName: color.name,
                    colorCode: color.code,
                    fullName: `${brandName} ${model.name} ${variant.name} ${color.name}`,
                    status: 'ACTIVE', // Simplified for mock
                });
            });
        });
    });

    // Helper to get 9-char default SKU
    const getDisplaySku = (item: SKUItem) => {
        // In a real app, this would check item.sku
        // Here we'll generate one from the ID if not explicit
        const hash = item.id
            .split('-')
            .map(s => s.substring(0, 2))
            .join('')
            .toUpperCase();
        return `MB-${hash.substring(0, 4)}-${hash.substring(4, 5) || 'X'}`;
    };

    const handleExportCSV = () => {
        const headers = ['SKU ID', 'Model', 'Variant', 'Color', 'Status'];
        const rows = filteredSkus.map(sku => [
            getDisplaySku(sku),
            sku.modelName,
            sku.variantName,
            sku.colorName,
            sku.status,
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `skus_${brandName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredSkus = allSkus.filter(sku => {
        const displaySku = getDisplaySku(sku);
        return (
            displaySku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sku.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sku.variantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sku.colorName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-4 rounded-[32px] shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by SKU, Model, Variant or Color..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 transition-all uppercase tracking-tight"
                    />
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                        <Filter size={14} /> Filter
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-950">
                            <th className="px-8 py-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                #
                            </th>
                            <th className="px-8 py-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                SKU ID
                            </th>
                            <th className="px-8 py-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                Model Name
                            </th>
                            <th className="px-8 py-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                Variant Spec
                            </th>
                            <th className="px-8 py-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                COLOUR
                            </th>
                            <th className="px-8 py-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 text-right">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSkus.length > 0 ? (
                            filteredSkus.map((sku, idx) => (
                                <tr
                                    key={sku.id}
                                    className="group hover:bg-blue-50/30 dark:hover:bg-blue-600/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/[0.02] last:border-none"
                                >
                                    <td className="px-8 py-8 text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                                <FileText size={18} className="text-slate-400" />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                                                {getDisplaySku(sku)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        {sku.modelName}
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight italic bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl">
                                            {sku.variantName}
                                        </span>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-white/20 dark:border-slate-800 shadow-xl"
                                                style={{ backgroundColor: sku.colorCode }}
                                            />
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                                                {sku.colorName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 text-right">
                                        <div className="flex items-center justify-end gap-2 text-emerald-500">
                                            <span className="text-xs font-black uppercase tracking-widest">Active</span>
                                            <CheckCircle2 size={16} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <FileText size={48} className="text-slate-300" />
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-400 italic">
                                            No SKU Combinations Found
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Stats */}
            <div className="flex items-center justify-between px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex gap-6">
                    <p>
                        Total Combinations:{' '}
                        <span className="text-slate-800 dark:text-white ml-1">{allSkus.length}</span>
                    </p>
                    <p>
                        Active SKUs: <span className="text-emerald-500 ml-1">{allSkus.length}</span>
                    </p>
                </div>
                <p>Last Sync: Today, 12:45 PM</p>
            </div>
        </div>
    );
}
