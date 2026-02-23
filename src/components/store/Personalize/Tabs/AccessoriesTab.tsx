import React from 'react';
import { Check, Plus } from 'lucide-react';

// Define the shape of an Accessory here or import from types
// Assuming a simplified interface for now based on existing usage
export interface AccessoryItem {
    id: string;
    name: string;
    displayName?: string;
    price: number;
    description?: string;
    isMandatory?: boolean;
    image?: string;
    suitableFor?: string;
    inclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    brand?: string | null;
    subCategory?: string | null;
    discountPrice?: number;
}

interface AccessoriesTabProps {
    items: AccessoryItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}

export default function AccessoriesTab({ items, selectedIds, onToggle }: AccessoriesTabProps) {
    // Sort logic:
    // 1. Selected items (pre-selected and user-selected) always on top
    // 2. Within selected: Mandatory/Bundle first
    // 3. Within unselected: Mandatory/Bundle first (safe fallback)
    const sortedItems = [...items].sort((a, b) => {
        const aSelected = selectedIds.includes(a.id);
        const bSelected = selectedIds.includes(b.id);

        if (aSelected !== bSelected) return aSelected ? -1 : 1;

        const isAPriority = a.inclusionType === 'MANDATORY' || a.inclusionType === 'BUNDLE';
        const isBPriority = b.inclusionType === 'MANDATORY' || b.inclusionType === 'BUNDLE';

        if (isAPriority && !isBPriority) return -1;
        if (!isAPriority && isBPriority) return 1;

        return 0;
    });

    return (
        <div className="space-y-4">
            {sortedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isMandatory = item.isMandatory;

                // Price Logic
                const basePrice = item.price;
                const finalPrice = (item.discountPrice !== undefined && item.discountPrice < basePrice)
                    ? item.discountPrice
                    : basePrice;
                const hasDiscount = finalPrice < basePrice;
                const isFree = finalPrice === 0;

                return (
                    <div
                        key={item.id}
                        onClick={() => !isMandatory && onToggle(item.id)}
                        className={`
                            group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                            ${isSelected
                                ? 'bg-brand-primary/10 border-brand-primary/50 shadow-lg shadow-brand-primary/10'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }
                            ${isMandatory ? 'cursor-default opacity-80' : ''}
                        `}
                    >
                        <div className="flex items-center justify-between gap-4">
                            {/* Graphic / Icon Placeholder */}
                            <div className={`
                                w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                ${isSelected ? 'bg-brand-primary text-black' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
                            `}>
                                {isSelected ? <Check size={20} className="stroke-[3]" /> : <Plus size={20} />}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h4 className={`text-sm font-black uppercase italic tracking-wider ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                    {item.displayName || item.name}
                                </h4>
                                {/* Tags for Hierarchy */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {item.brand && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium uppercase tracking-wider">
                                            {item.brand}
                                        </span>
                                    )}
                                    {item.subCategory && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium uppercase tracking-wider">
                                            {item.subCategory}
                                        </span>
                                    )}
                                    {item.inclusionType === 'BUNDLE' && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-600 font-bold uppercase tracking-wider">
                                            BUNDLE
                                        </span>
                                    )}
                                </div>
                                {item.description && (
                                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                        {item.description}
                                    </p>
                                )}
                                {isMandatory && (
                                    <span className="inline-block mt-2 px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[8px] font-bold uppercase tracking-widest rounded">
                                        Mandatory
                                    </span>
                                )}
                            </div>

                            {/* Price Section */}
                            <div className="text-right">
                                {isFree ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-500 line-through decoration-slate-500/50">
                                            ₹{basePrice.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-sm font-bold font-mono text-emerald-400">
                                            FREE
                                        </span>
                                    </div>
                                ) : hasDiscount ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-500 line-through decoration-slate-500/50">
                                            ₹{basePrice.toLocaleString('en-IN')}
                                        </span>
                                        <span className={`text-sm font-bold font-mono ${isSelected ? 'text-brand-primary' : 'text-slate-400'}`}>
                                            ₹{finalPrice.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ) : (
                                    <span className={`text-sm font-bold font-mono ${isSelected ? 'text-brand-primary' : 'text-slate-400'}`}>
                                        ₹{basePrice.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Active Glow Effect */}
                        {isSelected && (
                            <div className="absolute inset-0 border-2 border-brand-primary/20 rounded-xl pointer-events-none" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
