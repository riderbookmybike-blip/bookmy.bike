'use client';

import React, { useState, useEffect } from 'react';
import { ProductType, ProductVariant, VehicleStatus } from '@/types/productMaster';
import { Check, Info, X } from 'lucide-react';

interface ProductFormProps {
    type: ProductType;
    initialData?: ProductVariant | null;
    onCancel: () => void;
}

export default function ProductForm({ type, initialData, onCancel }: ProductFormProps) {
    const [formData, setFormData] = useState<any>({
        type: type,
        status: 'ACTIVE' as VehicleStatus,
        make: '',
        model: '',
        variant: '',
        color: '',
        size: '',
        duration: '',
        compatibility: { makes: [] },
    });

    // Populate on Edit
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    // Live Label Generation
    const generatedLabel = React.useMemo(() => {
        const parts = [formData.make, formData.model, formData.variant];
        if (type === 'VEHICLE' && formData.color) parts.push(formData.color);
        if (type === 'ACCESSORY' && formData.size) parts.push(formData.size);
        if (type === 'SERVICE' && formData.duration) parts.push(formData.duration);
        return parts.filter(Boolean).join(' / ');
    }, [formData, type]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleCompatibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // Simple mock for compatibility selection
        // In real app, this would be a multi-select component.
        // For UI demo, allow typing or single select that appends?
        // Let's just use text area for "Makes" for now or a simple predefined list toggle.
        // Or better: Checkboxes for top makes.
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Simulating Save for: ${generatedLabel}`);
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Hierarchy Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Hierarchy Definitions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Make / Brand</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Honda"
                            value={formData.make}
                            onChange={e => handleChange('make', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model Family</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Activa 6G"
                            value={formData.model}
                            onChange={e => handleChange('model', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Standard / DLX"
                            value={formData.variant}
                            onChange={e => handleChange('variant', e.target.value)}
                        />
                    </div>
                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                            value={formData.status}
                            onChange={e => handleChange('status', e.target.value)}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="DISCONTINUED">Discontinued</option>
                            <option value="UPCOMING">Upcoming</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Variant Specific Attributes */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Variant Attributes
                </h3>

                {/* VEHICLE Fields */}
                {type === 'VEHICLE' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color Name</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Imperial Red"
                                value={formData.color || ''}
                                onChange={e => handleChange('color', e.target.value)}
                            />
                            {/* Color Picker Mock */}
                            <div
                                className="w-10 h-10 rounded-lg border border-gray-200 bg-red-600 cursor-pointer"
                                title="Pick Color Hex"
                            ></div>
                        </div>
                    </div>
                )}

                {/* ACCESSORY Fields */}
                {type === 'ACCESSORY' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Size / Dimensions</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. L (58cm) or Universal"
                            value={formData.size || ''}
                            onChange={e => handleChange('size', e.target.value)}
                        />
                    </div>
                )}

                {/* SERVICE Fields */}
                {type === 'SERVICE' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration / Validity</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 1 Year / 10,000 KM"
                            value={formData.duration || ''}
                            onChange={e => handleChange('duration', e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* 3. Compatibility Engine (Acc/Svc Only) */}
            {type !== 'VEHICLE' && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                        Compatibility Engine
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full">New</span>
                    </h3>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <p className="text-xs text-gray-500">
                            Select which Vehicles this {type.toLowerCase()} applies to.
                        </p>

                        {/* Mock Compatibility UI */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <input type="checkbox" checked={true} className="rounded text-blue-600" readOnly />
                                All Makes (Universal)
                            </label>
                            <div className="pl-6 space-y-1 opacity-50 pointer-events-none">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" className="rounded text-blue-600" />
                                    Honda Only
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" className="rounded text-blue-600" />
                                    Royal Enfield Only
                                </label>
                            </div>
                            <p className="text-xs text-orange-600 pt-2">
                                * For this demo, 'All Makes' is selected by default for simpler verification.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Generated Preview */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                    <Info className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Label Preview</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 mb-2">
                            This is how the product will appear in global search and invoices.
                        </p>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded border border-indigo-200 dark:border-indigo-500/30 text-sm font-mono text-gray-800 dark:text-slate-200 break-all">
                            {generatedLabel || '...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-transform active:scale-95"
                >
                    {initialData ? 'Save Changes' : 'Create Product'}
                </button>
            </div>
        </form>
    );
}
