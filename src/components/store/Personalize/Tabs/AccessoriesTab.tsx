import React from 'react';
import { Check, Plus } from 'lucide-react';

// Define the shape of an Accessory here or import from types
// Assuming a simplified interface for now based on existing usage
export interface AccessoryItem {
    id: string;
    name: string;
    price: number;
    description?: string;
    isMandatory?: boolean;
    image?: string;
}

interface AccessoriesTabProps {
    items: AccessoryItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}

export default function AccessoriesTab({ items, selectedIds, onToggle }: AccessoriesTabProps) {
    return (
        <div className="space-y-4">
            {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isMandatory = item.isMandatory;

                return (
                    <div
                        key={item.id}
                        onClick={() => !isMandatory && onToggle(item.id)}
                        className={`
                            group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                            ${isSelected
                                ? 'bg-brand-primary/10 border-brand-primary/50 shadow-lg shadow-brand-primary/10'
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                            }
                            ${isMandatory ? 'cursor-default opacity-80' : ''}
                        `}
                    >
                        <div className="flex items-center justify-between gap-4">
                            {/* Graphic / Icon Placeholder */}
                            <div className={`
                                w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                ${isSelected ? 'bg-brand-primary text-black' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}
                            `}>
                                {isSelected ? <Check size={20} className="stroke-[3]" /> : <Plus size={20} />}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h4 className={`text-sm font-black uppercase italic tracking-wider ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                    {item.name}
                                </h4>
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

                            {/* Price */}
                            <div className="text-right">
                                <span className={`text-sm font-bold font-mono ${isSelected ? 'text-brand-primary' : 'text-slate-400'}`}>
                                    ₹{item.price.toLocaleString('en-IN')}
                                </span>
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
