'use client';

import React, { useState } from 'react';
import { MOCK_VEHICLES, MOCK_ACCESSORIES, MOCK_SERVICES, ProductVariant } from '@/types/productMaster';
import { calculateDealerPrice, isProductEnabledForDealer } from '@/lib/pricing';
import { Search, ChevronRight, Calculator } from 'lucide-react';

interface QuoteProductSelectorProps {
    onSelect: (variant: ProductVariant, price: number) => void;
}

export default function QuoteProductSelector({ onSelect }: QuoteProductSelectorProps) {
    const [search, setSearch] = useState('');

    // Flatten and Filter
    const allProducts = [...MOCK_VEHICLES, ...MOCK_ACCESSORIES, ...MOCK_SERVICES];
    const availableProducts = allProducts.filter(p => isProductEnabledForDealer(p.id));

    // Filter by Search
    const filtered = availableProducts.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white border boundary-gray-200 rounded-lg overflow-hidden flex flex-col h-[400px]">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Select Product..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No enabled products found. <br /> Check Brand Enablement settings.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map(p => {
                            const pricing = calculateDealerPrice(p.id);

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p, pricing.sellingPrice)}
                                    className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-1 py-0.5 rounded border ${p.type === 'VEHICLE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {p.make}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {p.model} {p.variant}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5 pl-14">
                                            {p.label}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900 font-mono">
                                            ₹{pricing.sellingPrice.toLocaleString()}
                                        </div>
                                        <span className="text-[10px] text-green-600">
                                            {pricing.source === 'BRAND_RULE' ? 'Brand Price' :
                                                pricing.source === 'VARIANT_OVERRIDE' ? 'Special Price' : 'Standard'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
