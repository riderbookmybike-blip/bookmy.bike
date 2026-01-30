'use client';

import React, { useState, useEffect } from 'react';
import { ProductVariant } from '@/types/productMaster';
import { calculateDealerPrice, isProductEnabledForDealer } from '@/lib/pricing';
import { Search, Loader2 } from 'lucide-react';
import { getAllProducts } from '@/actions/product';
import { toast } from 'sonner';

interface QuoteProductSelectorProps {
    onSelect: (variant: ProductVariant, price: number) => void;
    district?: string;
}

export default function QuoteProductSelector({ onSelect, district }: QuoteProductSelectorProps) {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<ProductVariant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { products, error } = await getAllProducts();
                if (error) {
                    toast.error(error);
                    return;
                }
                setProducts(products);
            } catch (error) {
                toast.error('Failed to load products');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Filter available products
    const availableProducts = products.filter(p => isProductEnabledForDealer(p.id));

    // Filter by Search
    const filtered = availableProducts.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden flex flex-col h-[400px]">
            <div className="p-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Select Product..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <Loader2 className="animate-spin mr-2" size={20} /> Loading products...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                        No enabled products found. <br /> Check Brand Enablement settings.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/10">
                        {filtered.map(p => {
                            // Find the best price based on district
                            let sellingPrice = p.price.exShowroom;
                            let source = 'STANDARD';

                            if (district) {
                                const distMatch = p.districtPrices?.find(dp => dp.district === district);
                                if (distMatch) {
                                    sellingPrice = distMatch.exShowroom;
                                    source = 'DISTRICT_MATCH';
                                }
                            }

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p, sellingPrice)}
                                    className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-1 py-0.5 rounded border ${p.type === 'VEHICLE' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/20' :
                                                'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-white/10'
                                                }`}>
                                                {p.make}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {p.model} {p.variant}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 pl-14">
                                            {p.label}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                            ₹{sellingPrice.toLocaleString()}
                                        </div>
                                        <span className="text-[10px] text-green-600 dark:text-green-400">
                                            {source === 'DISTRICT_MATCH' ? 'Dealership Price' : 'Standard'}
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
