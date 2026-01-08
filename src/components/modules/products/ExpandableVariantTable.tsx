'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react';

interface ExpandableVariantTableProps {
    modelId: string;
    modelName: string;
    variants: any[];
    onAddVariant: (name: string) => void;
    onEditVariant: (variant: any) => void;
    onDeleteVariant: (variantId: string) => void;
    onUpdateSpec: (variantId: string, category: string, field: string, value: string) => void;
}

export const ExpandableVariantTable: React.FC<ExpandableVariantTableProps> = ({
    modelId,
    modelName,
    variants,
    onAddVariant,
    onEditVariant,
    onDeleteVariant,
    onUpdateSpec
}) => {
    const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
    const [activeSpecTab, setActiveSpecTab] = useState<Record<string, string>>({});
    const [isAdding, setIsAdding] = useState(false);
    const [newVariantName, setNewVariantName] = useState('');

    const toggleExpand = (variantId: string) => {
        const newExpanded = new Set(expandedVariants);
        if (newExpanded.has(variantId)) {
            newExpanded.delete(variantId);
        } else {
            newExpanded.add(variantId);
        }
        setExpandedVariants(newExpanded);
    };

    const specCategories = [
        { id: 'engine', label: 'Engine', icon: '⚙️' },
        { id: 'tyres', label: 'Tyres & Brakes', icon: '🛞' },
        { id: 'dimensions', label: 'Dimensions', icon: '📏' },
        { id: 'battery', label: 'Battery', icon: '🔋' },
        { id: 'features', label: 'Features', icon: '✨' }
    ];

    const getFieldsForCategory = (category: string) => {
        const fieldMap: Record<string, Array<{ label: string, key: string, placeholder: string }>> = {
            engine: [
                { label: 'Displacement (CC)', key: 'displacement', placeholder: 'e.g., 109.51 cc' },
                { label: 'Max Power', key: 'maxPower', placeholder: 'e.g., 7.84 PS @ 8000 rpm' },
                { label: 'Max Torque', key: 'maxTorque', placeholder: 'e.g., 8.90 Nm @ 5250 rpm' },
                { label: 'Horsepower', key: 'horsepower', placeholder: 'e.g., 7.84 HP' },
                { label: 'Cooling', key: 'cooling', placeholder: 'Air Cooled / Liquid' }
            ],
            tyres: [
                { label: 'Front Tyre', key: 'frontTyre', placeholder: 'e.g., 90/100-10' },
                { label: 'Rear Tyre', key: 'rearTyre', placeholder: 'e.g., 90/100-10' },
                { label: 'Front Brake', key: 'frontBrake', placeholder: 'Drum / Disc' },
                { label: 'Rear Brake', key: 'rearBrake', placeholder: 'Drum / Disc' }
            ],
            dimensions: [
                { label: 'Length', key: 'length', placeholder: 'e.g., 1761 mm' },
                { label: 'Width', key: 'width', placeholder: 'e.g., 710 mm' },
                { label: 'Weight', key: 'kerbWeight', placeholder: 'e.g., 110 kg' },
                { label: 'Fuel Capacity', key: 'fuelCapacity', placeholder: 'e.g., 5.3 L' }
            ],
            battery: [
                { label: 'Capacity', key: 'batteryCapacity', placeholder: 'e.g., 3.5 kWh' },
                { label: 'Range', key: 'range', placeholder: 'e.g., 100 km' },
                { label: 'Charging Time', key: 'chargingTime', placeholder: 'e.g., 4 hours' }
            ],
            features: [
                { label: 'Digital Console', key: 'digitalConsole', placeholder: 'Yes / No' },
                { label: 'LED Lights', key: 'ledLights', placeholder: 'Yes / No' },
                { label: 'USB Charging', key: 'usbCharging', placeholder: 'Yes / No' }
            ]
        };
        return fieldMap[category] || [];
    };

    const handleAddVariant = () => {
        if (newVariantName.trim()) {
            onAddVariant(newVariantName.trim());
            setNewVariantName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Variant Management</p>
                    <h3 className="text-lg font-black text-white">{modelName}</h3>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2"
                >
                    <Plus size={14} />
                    Add Variant
                </button>
            </div>

            {/* Variants Table */}
            <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
                {variants.map((variant, idx) => {
                    const isExpanded = expandedVariants.has(variant.id);
                    const currentTab = activeSpecTab[variant.id] || 'engine';
                    const specs = variant.specifications || {};
                    const categoryData = specs[currentTab] || {};

                    return (
                        <div key={variant.id} className={`border-b border-white/5 ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                            {/* Variant Row */}
                            <div className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => toggleExpand(variant.id)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </button>
                                    <div>
                                        <h4 className="text-sm font-black text-white">{variant.name || variant.variant}</h4>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{variant.sku}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[9px] font-black uppercase">
                                        {variant.status}
                                    </div>
                                    <button
                                        onClick={() => onEditVariant(variant)}
                                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteVariant(variant.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Specifications Section */}
                            {isExpanded && (
                                <div className="px-6 pb-6 border-t border-white/5">
                                    {/* Spec Category Tabs */}
                                    <div className="flex gap-2 py-4 border-b border-white/5 mb-4">
                                        {specCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setActiveSpecTab({ ...activeSpecTab, [variant.id]: cat.id })}
                                                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${currentTab === cat.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="mr-1">{cat.icon}</span>
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Specification Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {getFieldsForCategory(currentTab).map(field => (
                                            <div key={field.key} className="space-y-1">
                                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={categoryData[field.key] || ''}
                                                    onChange={(e) => onUpdateSpec(variant.id, currentTab, field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add Variant Row */}
                {isAdding && (
                    <div className="px-6 py-4 bg-indigo-500/10 border-t-2 border-indigo-500">
                        <div className="flex items-center gap-3">
                            <input
                                autoFocus
                                type="text"
                                value={newVariantName}
                                onChange={(e) => setNewVariantName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddVariant()}
                                placeholder="Variant name (e.g., Deluxe, Unicorn)"
                                className="flex-1 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            />
                            <button
                                onClick={handleAddVariant}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-500 transition-all"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewVariantName('');
                                }}
                                className="px-4 py-2 bg-slate-700 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-600 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {variants.length === 0 && !isAdding && (
                <div className="text-center py-12 bg-slate-900 rounded-2xl border border-white/10">
                    <p className="text-slate-400 text-sm">No variants yet. Click "+ Add Variant" to get started.</p>
                </div>
            )}
        </div>
    );
};

export default ExpandableVariantTable;
