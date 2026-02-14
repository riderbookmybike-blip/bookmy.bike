// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { DealerProduct, ProductVariant } from '@/types/productMaster';
import { Plus, Search, Loader2 } from 'lucide-react';
import SlideOver from '@/components/ui/SlideOver';
import MasterProductSelector from './MasterProductSelector';
import { getAllProducts } from '@/actions/product';
import { toast } from 'sonner';

interface DealerProductListProps {
    products: DealerProduct[];
    selectedId: string | null;
    onSelect: (product: DealerProduct) => void;
    onAdd: (product: DealerProduct) => void;
}

export default function DealerProductList({ products, selectedId, onSelect, onAdd }: DealerProductListProps) {
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [masterProducts, setMasterProducts] = useState<ProductVariant[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(true);

    useEffect(() => {
        const fetchMaster = async () => {
            try {
                const { products, error } = await getAllProducts();
                if (error) {
                    toast.error('Failed to load product details');
                } else {
                    setMasterProducts(products);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingMaster(false);
            }
        };
        fetchMaster();
    }, []);

    // Helper to look up Master details
    const getMasterDetails = (variantId: string): ProductVariant | undefined => {
        return masterProducts.find(p => p.id === variantId);
    };

    // 1. Handle Adding from Master
    const handleAddProduct = (variant: ProductVariant) => {
        const newDealerProduct: DealerProduct = {
            id: `dp-${Date.now()}`,
            dealerId: 'current-user',
            productVariantId: variant.id,
            isActive: true, // Default to active on add
            purchasePrice: 0,
            sellingPrice: 0,
            margin: 0,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'Current User',
        };
        onAdd(newDealerProduct);
        setIsAddOpen(false);
    };

    // Filter
    const filtered = products.filter(dp => {
        const master = getMasterDetails(dp.productVariantId);
        // If master details aren't loaded yet, or not found, exclude or include based on policy?
        // Ideally should wait. For now if not found, it won't match search unless search is empty?
        // Actually if validation fails, just skip.
        if (!master) return false;
        return master.label.toLowerCase().includes(search.toLowerCase());
    });

    if (loadingMaster) {
        return (
            <div className="h-full flex items-center justify-center bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/10">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/10">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-700 dark:text-slate-200">Product List</h2>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                        title="Add from Master"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                    {filtered.map(dp => {
                        const master = getMasterDetails(dp.productVariantId);
                        if (!master) return null;
                        const isSelected = dp.id === selectedId;

                        return (
                            <div
                                key={dp.id}
                                onClick={() => onSelect(dp)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p
                                            className={`text-sm font-medium truncat ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}
                                        >
                                            {master.label}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-mono mt-0.5">
                                            {master.sku}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-block w-2 h-2 rounded-full mt-1.5 ${dp.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                                    ></span>
                                </div>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                            master.type === 'VEHICLE'
                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/20'
                                                : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-white/10'
                                        }`}
                                    >
                                        {master.type}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-slate-200">
                                        ₹{dp.sellingPrice.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SlideOver: Add from Master */}
            <SlideOver
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Select Data from Master Product"
                width="xl"
            >
                <MasterProductSelector
                    onSelect={handleAddProduct}
                    existingIds={products.map(p => p.productVariantId)}
                />
            </SlideOver>
        </div>
    );
}
// @ts-nocheck
