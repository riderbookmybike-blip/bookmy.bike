'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface VariantSpecificationEditorProps {
    brands: any[];
    onBrandChange: (brandId: string) => void;
    onModelChange: (modelId: string) => void;
    onVariantChange: (variantId: string) => void;
    selectedBrandId?: string;
    selectedModelId?: string;
    selectedVariantId?: string;
    models: any[];
    variants: any[];
    currentVariant?: any;
    onSpecUpdate: (category: string, field: string, value: string) => void;
}

type SpecCategory = 'engine' | 'tyres' | 'dimensions' | 'battery' | 'features';

export const VariantSpecificationEditor = ({
    brands,
    models,
    variants,
    selectedBrandId,
    selectedModelId,
    selectedVariantId,
    currentVariant,
    onBrandChange,
    onModelChange,
    onVariantChange,
    onSpecUpdate
}: VariantSpecificationEditorProps) => {
    const [activeCategory, setActiveCategory] = React.useState<SpecCategory>('engine');

    const categories = [
        { id: 'engine' as SpecCategory, label: 'Engine', icon: '⚙️' },
        { id: 'tyres' as SpecCategory, label: 'Tyres & Brakes', icon: '🛞' },
        { id: 'dimensions' as SpecCategory, label: 'Dimensions', icon: '📏' },
        { id: 'battery' as SpecCategory, label: 'Battery & Electric', icon: '🔋' },
        { id: 'features' as SpecCategory, label: 'Features', icon: '✨' }
    ];

    const renderCascadingSelectors = () => (
        <div className="flex items-end gap-3 mb-4">
            {/* Brand Selector */}
            <div className="flex-1 space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Brand</label>
                <div className="relative">
                    <select
                        value={selectedBrandId || ''}
                        onChange={(e) => onBrandChange(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer pr-10"
                    >
                        <option value="">Select Brand</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Model Selector */}
            <div className="flex-1 space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Model</label>
                <div className="relative">
                    <select
                        value={selectedModelId || ''}
                        onChange={(e) => onModelChange(e.target.value)}
                        disabled={!selectedBrandId}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Model</option>
                        {models.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Variant Selector */}
            <div className="flex-1 space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Variant</label>
                <div className="relative">
                    <select
                        value={selectedVariantId || ''}
                        onChange={(e) => onVariantChange(e.target.value)}
                        disabled={!selectedModelId}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Variant</option>
                        {variants.map(variant => (
                            <option key={variant.id} value={variant.id}>{variant.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Add Variant Button */}
            <button
                disabled={!selectedModelId}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="Add New Variant"
            >
                + Add Variant
            </button>
        </div>
    );

    const renderCategoryTabs = () => (
        <div className="flex gap-2 mb-3 border-b border-white/10 pb-2">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                >
                    <span className="mr-1.5">{cat.icon}</span>
                    {cat.label}
                </button>
            ))}
        </div>
    );

    const renderSpecificationTable = () => {
        if (!currentVariant) {
            return (
                <div className="text-center py-8">
                    <p className="text-slate-400 text-sm font-bold">Select a variant to edit specifications</p>
                </div>
            );
        }

        const specs = currentVariant.specifications || {};

        const fieldsByCategory: Record<SpecCategory, Array<{ label: string, key: string, placeholder: string }>> = {
            engine: [
                { label: 'Displacement (CC)', key: 'displacement', placeholder: 'e.g., 124.9 cc' },
                { label: 'Max Power (BHP)', key: 'maxPower', placeholder: 'e.g., 8.2 BHP @ 6500 rpm' },
                { label: 'Max Torque', key: 'maxTorque', placeholder: 'e.g., 10.9 Nm @ 5000 rpm' },
                { label: 'Horsepower (HP)', key: 'horsepower', placeholder: 'e.g., 8.2 HP' },
                { label: 'Cooling System', key: 'cooling', placeholder: 'Air Cooled / Liquid Cooled' }
            ],
            tyres: [
                { label: 'Front Tyre', key: 'frontTyre', placeholder: 'e.g., 90/100-10' },
                { label: 'Rear Tyre', key: 'rearTyre', placeholder: 'e.g., 90/100-10' },
                { label: 'Front Brake', key: 'frontBrake', placeholder: 'Drum / Disc' },
                { label: 'Rear Brake', key: 'rearBrake', placeholder: 'Drum / Disc' },
                { label: 'Wheel Size', key: 'wheelSize', placeholder: 'e.g., 10 inch' }
            ],
            dimensions: [
                { label: 'Length', key: 'length', placeholder: 'e.g., 1761 mm' },
                { label: 'Width', key: 'width', placeholder: 'e.g., 710 mm' },
                { label: 'Height', key: 'height', placeholder: 'e.g., 1156 mm' },
                { label: 'Wheelbase', key: 'wheelbase', placeholder: 'e.g., 1238 mm' },
                { label: 'Ground Clearance', key: 'groundClearance', placeholder: 'e.g., 165 mm' },
                { label: 'Seat Height', key: 'seatHeight', placeholder: 'e.g., 765 mm' },
                { label: 'Kerb Weight', key: 'kerbWeight', placeholder: 'e.g., 110 kg' },
                { label: 'Fuel Capacity', key: 'fuelCapacity', placeholder: 'e.g., 5.3 L' }
            ],
            battery: [
                { label: 'Battery Capacity', key: 'batteryCapacity', placeholder: 'e.g., 3.5 kWh' },
                { label: 'Range', key: 'range', placeholder: 'e.g., 100 km' },
                { label: 'Charging Time', key: 'chargingTime', placeholder: 'e.g., 4 hours' },
                { label: 'Motor Type', key: 'motorType', placeholder: 'e.g., BLDC' }
            ],
            features: [
                { label: 'Digital Console', key: 'digitalConsole', placeholder: 'Yes / No' },
                { label: 'LED Lights', key: 'ledLights', placeholder: 'Yes / No' },
                { label: 'USB Charging', key: 'usbCharging', placeholder: 'Yes / No' },
                { label: 'Storage Space', key: 'storageSpace', placeholder: 'e.g., 18L' }
            ]
        };

        const fields = fieldsByCategory[activeCategory];
        const categoryData = specs[activeCategory] || {};

        return (
            <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Specification</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field, idx) => (
                            <tr key={field.key} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                                <td className="px-6 py-4 text-sm font-bold text-white">{field.label}</td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        value={categoryData[field.key] || ''}
                                        onChange={(e) => onSpecUpdate(activeCategory, field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {renderCascadingSelectors()}
            {renderCategoryTabs()}
            {renderSpecificationTable()}

            {/* Save Button */}
            {currentVariant && (
                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                        onClick={() => {
                            console.log('Saving specifications...', { variantId: currentVariant.id });
                            // Show success feedback
                            const btn = document.activeElement as HTMLButtonElement;
                            if (btn) {
                                btn.innerHTML = '✓ Saved!';
                                btn.classList.add('bg-green-600');
                                btn.classList.remove('bg-indigo-600');
                                setTimeout(() => {
                                    btn.innerHTML = 'Save Changes';
                                    btn.classList.remove('bg-green-600');
                                    btn.classList.add('bg-indigo-600');
                                }, 2000);
                            }
                        }}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};
