'use client';

import React, { useState, useEffect } from 'react';
import { DealerProduct, ProductVariant } from '@/types/productMaster';
import { Calculator, Save, AlertTriangle } from 'lucide-react';

interface DealerProductFormProps {
    dealerProduct: DealerProduct;
    masterProduct: ProductVariant;
    onSave: (updated: DealerProduct) => void;
    onCancel: () => void;
}

export default function DealerProductForm({ dealerProduct, masterProduct, onSave, onCancel }: DealerProductFormProps) {
    const [formData, setFormData] = useState<DealerProduct>(dealerProduct);

    const handleChange = (field: keyof DealerProduct, value: any) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            // Auto-calculate margin
            if (field === 'purchasePrice' || field === 'sellingPrice') {
                updated.margin = updated.sellingPrice - updated.purchasePrice;
            }
            return updated;
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Read-Only Master Details */}
            <div className="p-6 bg-gray-50 border-b border-gray-200 space-y-4">
                <div className="flex items-start gap-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border mt-1 shrink-0 ${masterProduct.type === 'VEHICLE' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                        {masterProduct.type}
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">{masterProduct.label}</h2>
                        <p className="text-sm text-gray-500 mt-1 font-mono">{masterProduct.sku}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div className="bg-white p-3 rounded border border-gray-200">
                        <span className="block text-xs text-gray-400 uppercase">Make</span>
                        <span className="font-medium">{masterProduct.make}</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                        <span className="block text-xs text-gray-400 uppercase">Model</span>
                        <span className="font-medium">{masterProduct.model}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                    <AlertTriangle size={14} />
                    <span>Master details cannot be edited by Dealership.</span>
                </div>
            </div>

            {/* Editable Commercials */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Commercial Configuration
                </h3>

                <div className="space-y-4">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                            <span className="block font-medium text-gray-900">Enable for Sale</span>
                            <span className="text-xs text-gray-500">Show this product in sales lists</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.isActive}
                                onChange={(e) => handleChange('isActive', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Pricing Inputs */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                value={formData.purchasePrice}
                                onChange={(e) => handleChange('purchasePrice', Number(e.target.value))}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Cost to Dealership</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900 font-mono"
                                value={formData.sellingPrice}
                                onChange={(e) => handleChange('sellingPrice', Number(e.target.value))}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Base Price / Ex-Showroom Override</p>
                        </div>
                    </div>

                    {/* Computed Margin */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-800">
                            <Calculator size={18} />
                            <span className="font-medium text-sm">Projected Margin</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-bold text-green-700 font-mono">
                                ₹{formData.margin.toLocaleString()}
                            </span>
                            <span className="text-xs text-green-600">
                                {formData.sellingPrice > 0 ? ((formData.margin / formData.sellingPrice) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSave(formData)}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2"
                >
                    <Save size={18} />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
