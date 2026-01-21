'use client';

import React, { useState, useEffect } from 'react';
import { ProductVariant } from '@/types/productMaster';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { getAllProducts } from '@/actions/product';
import { toast } from 'sonner';

interface MasterProductSelectorProps {
    onSelect: (product: ProductVariant) => void;
    existingIds: string[]; // To disable already added products
}

export default function MasterProductSelector({ onSelect, existingIds }: MasterProductSelectorProps) {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'VEHICLE' | 'ACCESSORY' | 'SERVICE'>('ALL');
    const [allMasterProducts, setAllMasterProducts] = useState<ProductVariant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { products, error } = await getAllProducts();
                if (error) {
                    toast.error(error);
                    return;
                }
                setAllMasterProducts(products);
            } catch (error) {
                toast.error('Failed to load master products');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filtered = allMasterProducts.filter(p => {
        const matchesType = filterType === 'ALL' || p.type === filterType;
        const matchesSearch = p.label.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 space-y-3 bg-gray-50 dark:bg-slate-950">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search Master Catalog..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
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
                                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <Loader2 className="animate-spin mr-2" size={20} /> Loading catalog...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-slate-400 text-sm">
                        No active master products found matching your criteria.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/10">
                        {filtered.map(product => {
                            const isAdded = existingIds.includes(product.id);
                            return (
                                <div key={product.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group">
                                    <div className="pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${product.type === 'VEHICLE' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/20' :
                                                product.type === 'ACCESSORY' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-500/20' :
                                                    'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-500/20'
                                                }`}>
                                                {product.type}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">{product.sku}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{product.label}</h4>
                                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                            {product.make} • {product.model} • {product.variant}
                                        </div>
                                    </div>

                                    <button
                                        disabled={isAdded}
                                        onClick={() => onSelect(product)}
                                        className={`shrink-0 p-2 rounded-lg border transition-all ${isAdded
                                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-slate-500 border-gray-100 dark:border-white/10 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-900 text-blue-600 border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300'
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
