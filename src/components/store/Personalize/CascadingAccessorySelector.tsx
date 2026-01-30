'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Check, Zap } from 'lucide-react';
import { Accessory } from '@/types/store';

interface CascadingAccessorySelectorProps {
    category: string;
    items: Accessory[];
    selectedId?: string;
    onSelect: (id: string) => void;
    label?: string;
}

export default function CascadingAccessorySelector({ category, items, selectedId, onSelect, label }: CascadingAccessorySelectorProps) {
    // 0. Compute available options based on hierarchy
    const makes = useMemo(() => Array.from(new Set(items.map(i => i.make || 'Generic'))), [items]);

    // 1. Internal State for the "Path"
    const [selectedMake, setSelectedMake] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    // Initialize state from selectedId if present
    useEffect(() => {
        if (selectedId) {
            const item = items.find(i => i.id === selectedId);
            if (item) {
                setSelectedMake(item.make || null);
                setSelectedModel(item.model || null);
            }
        } else if (items.length > 0 && !selectedMake) {
            // Default to first available if nothing selected
            const first = items[0];
            setSelectedMake(first.make || null);
            setSelectedModel(first.model || null);
            // Logic to auto-select if mandatory? Let parent handle that. 
        }
    }, [selectedId, items]);

    // Derived Lists
    const availableModels = useMemo(() => {
        if (!selectedMake) return [];
        return Array.from(new Set(items.filter(i => (i.make || 'Generic') === selectedMake).map(i => i.model || 'Standard')));
    }, [items, selectedMake]);

    const availableVariants = useMemo(() => {
        if (!selectedMake || !selectedModel) return [];
        return items.filter(i => (i.make || 'Generic') === selectedMake && (i.model || 'Standard') === selectedModel);
    }, [items, selectedMake, selectedModel]);


    // Handle Logic
    const handleMakeSelect = (make: string) => {
        setSelectedMake(make);
        setSelectedModel(null); // Reset downstream
    };

    const handleModelSelect = (model: string) => {
        setSelectedModel(model);
        // If there's only 1 variant, auto-select? 
        // For now, let user pick variant/color from the list
    };

    const activeItem = items.find(i => i.id === selectedId);

    return (
        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label || category}</p>
                    <h4 className="text-xl font-black italic text-slate-900 dark:text-white">
                        {activeItem ? (activeItem.displayName || activeItem.name) : 'Select Option'}
                    </h4>
                </div>
                {activeItem && (
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</p>
                        <p className="text-lg font-black italic font-mono text-brand-primary">₹{activeItem.price.toLocaleString()}</p>
                    </div>
                )}
            </div>

            {/* Step 1: Make Selector (Pills) */}
            <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Brand</p>
                <div className="flex gap-2 flex-wrap">
                    {makes.map(make => (
                        <button
                            key={make}
                            onClick={() => handleMakeSelect(make)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all
                                ${selectedMake === make
                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white'
                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}
                            `}
                        >
                            {make}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Model Selector (Pills) - Only if Make selected */}
            {selectedMake && availableModels.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Model</p>
                    <div className="flex gap-2 flex-wrap">
                        {availableModels.map(model => (
                            <button
                                key={model}
                                onClick={() => handleModelSelect(model)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all
                                    ${selectedModel === model
                                        ? 'bg-brand-primary/20 text-brand-primary border-brand-primary'
                                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}
                                `}
                            >
                                {model}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Variants/Colors (Cards) - Only if Model selected */}
            {selectedMake && selectedModel && availableVariants.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-slate-200 dark:border-white/5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select Variant</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableVariants.map(variant => (
                            <button
                                key={variant.id}
                                onClick={() => onSelect(variant.id)}
                                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group
                                    ${variant.id === selectedId
                                        ? 'bg-brand-primary border-brand-primary shadow-lg shadow-brand-primary/20'
                                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-brand-primary/50'}
                                `}
                            >
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${variant.id === selectedId ? 'text-black' : 'text-slate-500'}`}>
                                        {variant.variant || 'Standard'} {variant.color ? `• ${variant.color}` : ''}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-black italic ${variant.id === selectedId ? 'text-black' : 'text-slate-900 dark:text-white'}`}>
                                            ₹{variant.price.toLocaleString()}
                                        </span>
                                        {variant.size && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${variant.id === selectedId ? 'border-black/30 text-black' : 'border-slate-300 text-slate-400'}`}>
                                                {variant.size}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${variant.id === selectedId ? 'border-black bg-black text-brand-primary' : 'border-slate-300 text-transparent group-hover:border-brand-primary'}`}>
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
