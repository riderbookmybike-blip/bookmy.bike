'use client';

import React, { useState } from 'react';
import { DealerProduct, ProductVariant, MOCK_VEHICLES, MOCK_ACCESSORIES, MOCK_SERVICES, MOCK_DEALER_PRODUCTS } from '@/types/productMaster';
import { Plus, Search } from 'lucide-react';
import SlideOver from '@/components/ui/SlideOver';
import MasterProductSelector from './MasterProductSelector';

// Helper to look up Master details
const getMasterDetails = (variantId: string): ProductVariant | undefined => {
    return [...MOCK_VEHICLES, ...MOCK_ACCESSORIES, ...MOCK_SERVICES].find(p => p.id === variantId);
};

interface DealerProductListProps {
    products: DealerProduct[];
    selectedId: string | null;
    onSelect: (product: DealerProduct) => void;
    onAdd: (product: DealerProduct) => void;
}

export default function DealerProductList({ products, selectedId, onSelect, onAdd }: DealerProductListProps) {
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);

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
            updatedBy: 'Current User'
        };
        onAdd(newDealerProduct);
        setIsAddOpen(false);
    };

    // Filter
    const filtered = products.filter(dp => {
        const master = getMasterDetails(dp.productVariantId);
        if (!master) return false;
        return master.label.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-700">Product List</h2>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        title="Add from Master"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                    {filtered.map(dp => {
                        const master = getMasterDetails(dp.productVariantId);
                        if (!master) return null;
                        const isSelected = dp.id === selectedId;

                        return (
                            <div
                                key={dp.id}
                                onClick={() => onSelect(dp)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className={`text-sm font-medium truncat ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {master.label}
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{master.sku}</p>
                                    </div>
                                    <span className={`inline-block w-2 h-2 rounded-full mt-1.5 ${dp.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                </div>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${master.type === 'VEHICLE' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                        {master.type}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-gray-700">
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
