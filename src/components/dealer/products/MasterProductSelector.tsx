'use client';

import React, { useState } from 'react';
import { MOCK_VEHICLES, MOCK_ACCESSORIES, MOCK_SERVICES, ProductVariant } from '@/types/productMaster';
import { Search, Plus, Check } from 'lucide-react';

interface MasterProductSelectorProps {
    onSelect: (product: ProductVariant) => void;
    existingIds: string[]; // To disable already added products
}

export default function MasterProductSelector({ onSelect, existingIds }: MasterProductSelectorProps) {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'VEHICLE' | 'ACCESSORY' | 'SERVICE'>('ALL');

    // Combine all master products
    const allMasterProducts = [...MOCK_VEHICLES, ...MOCK_ACCESSORIES, ...MOCK_SERVICES];

    const filtered = allMasterProducts.filter(p => {
        const matchesType = filterType === 'ALL' || p.type === filterType;
        const matchesSearch = p.label.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200 space-y-3 bg-gray-50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Master Catalog..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                {/* Type Toggles */}
                <div className="flex gap-2">
                    {['ALL', 'VEHICLE', 'ACCESSORY', 'SERVICE'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t as any)}
                            className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${filterType === t
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No active master products found matching your criteria.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map(product => {
                            const isAdded = existingIds.includes(product.id);
                            return (
                                <div key={product.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group">
                                    <div className="pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${product.type === 'VEHICLE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    product.type === 'ACCESSORY' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                        'bg-purple-50 text-purple-700 border-purple-100'
                                                }`}>
                                                {product.type}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">{product.sku}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900">{product.label}</h4>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {product.make} • {product.model} • {product.variant}
                                        </div>
                                    </div>

                                    <button
                                        disabled={isAdded}
                                        onClick={() => onSelect(product)}
                                        className={`shrink-0 p-2 rounded-lg border transition-all ${isAdded
                                                ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                                            }`}
                                    >
                                        {isAdded ? <Check size={18} /> : <Plus size={18} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
