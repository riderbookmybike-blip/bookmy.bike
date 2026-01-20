'use client';

import React, { useState, useMemo } from 'react';
import { MOCK_VEHICLES, MOCK_ACCESSORIES, MOCK_SERVICES, DealerBrandConfig, MOCK_DEALER_BRANDS } from '@/types/productMaster';
import { Search, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DealerBrandListProps {
    onSelect?: (brand: string) => void;
    selectedBrand: string | null;
    basePath?: string;
}

export default function DealerBrandList({ onSelect, selectedBrand, basePath }: DealerBrandListProps) {
    const [search, setSearch] = useState('');
    const [brands, setBrands] = useState<DealerBrandConfig[]>(MOCK_DEALER_BRANDS);
    const router = useRouter();

    // 1. Get Unique Brands from Master
    const allMasterProducts = [...MOCK_VEHICLES, ...MOCK_ACCESSORIES, ...MOCK_SERVICES];
    const uniqueBrands = useMemo(() => {
        const brandNames = Array.from(new Set(allMasterProducts.map(p => p.make)));
        return brandNames.sort();
    }, []);

    // 2. Merge with Dealer Config
    const displayBrands = useMemo(() => {
        return uniqueBrands.map(brandName => {
            const config = brands.find(b => b.brandName === brandName);
            // Default config if not exists
            return config || {
                id: `temp-${brandName}`,
                dealerId: 'current',
                brandName: brandName,
                isActive: false,
                defaultMarginType: 'FIXED',
                defaultMarginValue: 0,
                lastUpdated: ''
            } as DealerBrandConfig;
        });
    }, [uniqueBrands, brands]);

    // 3. Filter
    const filtered = displayBrands.filter(b => b.brandName.toLowerCase().includes(search.toLowerCase()));

    const toggleBrand = (brandName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setBrands(prev => {
            const existing = prev.find(b => b.brandName === brandName);
            if (existing) {
                return prev.map(b => b.brandName === brandName ? { ...b, isActive: !b.isActive } : b);
            } else {
                // Initialize as Active
                return [...prev, {
                    id: `db-${Date.now()}`,
                    dealerId: 'current',
                    brandName: brandName,
                    isActive: true,
                    defaultMarginType: 'FIXED',
                    defaultMarginValue: 0,
                    lastUpdated: new Date().toISOString()
                }];
            }
        });
    };

    const handleRowClick = (brandName: string) => {
        if (basePath) {
            // Encode brand name to handle spaces or special chars
            const encoded = encodeURIComponent(brandName);
            router.push(`${basePath}/${encoded}`);
        } else if (onSelect) {
            onSelect(brandName);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/10">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 space-y-3">
                <h2 className="font-bold text-gray-700 dark:text-slate-200">Brand Management</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search Brands..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                    {filtered.map(brand => {
                        const isSelected = brand.brandName === selectedBrand;
                        // Count variants
                        const variantCount = allMasterProducts.filter(p => p.make === brand.brandName).length;

                        return (
                            <div
                                key={brand.brandName}
                                onClick={() => handleRowClick(brand.brandName)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`font-medium ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                            {brand.brandName}
                                        </h3>
                                        <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full">
                                            {variantCount} items
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        {brand.isActive ? 'Enabled for Sale' : 'Not Selling'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Toggle */}
                                    <div
                                        onClick={(e) => toggleBrand(brand.brandName, e)}
                                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${brand.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`bg-white dark:bg-slate-900 w-4 h-4 rounded-full shadow-md transform transition-transform ${brand.isActive ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    {isSelected && <ChevronRight size={16} className="text-blue-400" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
