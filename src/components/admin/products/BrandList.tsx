'use client';

import React from 'react';
// import { HierarchyNode } from '@/lib/productHierarchy'; // Missing
interface HierarchyNode {
    name: string;
    children: Map<string, any>; // Inferred from usage
}
import { ChevronRight, Plus } from 'lucide-react';

interface BrandListProps {
    type: string;
    brands: Map<string, HierarchyNode>;
    selectedBrandName: string | null;
    onSelect: (brand: string) => void;
    onAddBrand: () => void;
}

export default function BrandList({ type, brands, selectedBrandName, onSelect, onAddBrand }: BrandListProps) {
    const sortedBrands = Array.from(brands.values()).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-gray-800 text-sm">{type} Brands</h2>
                <button
                    onClick={onAddBrand}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sortedBrands.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400">
                        No brands found. Start by adding one.
                    </div>
                )}
                {sortedBrands.map(node => (
                    <button
                        key={node.name}
                        onClick={() => onSelect(node.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${selectedBrandName === node.name
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <div>
                            <span className="font-bold block text-sm">{node.name}</span>
                            <span className={`text-[10px] ${selectedBrandName === node.name ? 'text-blue-200' : 'text-gray-500'}`}>
                                {node.children.size} Models
                            </span>
                        </div>
                        {selectedBrandName === node.name && <ChevronRight size={16} />}
                    </button>
                ))}
            </div>
        </div>
    );
}
