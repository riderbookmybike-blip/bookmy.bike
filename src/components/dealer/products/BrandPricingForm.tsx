'use client';

import React, { useState } from 'react';
import { DealerBrandConfig } from '@/types/productMaster';
import { Calculator, Save, AlertTriangle } from 'lucide-react';

interface BrandPricingFormProps {
    brandName: string;
    onSave: (config: DealerBrandConfig) => void;
}

export default function BrandPricingForm({ brandName, onSave }: BrandPricingFormProps) {
    const [config, setConfig] = useState<DealerBrandConfig>({
        id: `temp-${brandName}`, // Mock initial
        dealerId: 'current',
        brandName: brandName,
        isActive: true,
        defaultMarginType: 'FIXED',
        defaultMarginValue: 0,
        lastUpdated: ''
    });

    const [applyToAll, setApplyToAll] = useState(false);

    const handleSave = () => {
        if (applyToAll) {
            // Logic to update all variants would go here (or be flagged for backend)
            alert(`Applying ${config.defaultMarginType} margin of ${config.defaultMarginValue} to ALL ${brandName} variants.`);
        }
        onSave({ ...config, lastUpdated: new Date().toISOString() });
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                <AlertTriangle className="text-blue-600 mt-0.5" size={18} />
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Brand Level Pricing</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        Define default margins for {brandName}. New variants added to the master will automatically inherit these rules.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Default Margin Rule</label>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="marginType"
                                className="text-blue-600 focus:ring-blue-500"
                                checked={config.defaultMarginType === 'FIXED'}
                                onChange={() => setConfig({ ...config, defaultMarginType: 'FIXED' })}
                            />
                            <span className="text-sm text-gray-900">Fixed Amount (₹)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="marginType"
                                className="text-blue-600 focus:ring-blue-500"
                                checked={config.defaultMarginType === 'PERCENTAGE'}
                                onChange={() => setConfig({ ...config, defaultMarginType: 'PERCENTAGE' })}
                            />
                            <span className="text-sm text-gray-900">Percentage (%)</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {config.defaultMarginType === 'FIXED' ? 'Margin Amount (₹)' : 'Margin Percentage (%)'}
                    </label>
                    <input
                        type="number"
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        value={config.defaultMarginValue}
                        onChange={(e) => setConfig({ ...config, defaultMarginValue: Number(e.target.value) })}
                        placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This margin will be added to the Purchase Price to calculate the Selling Price.
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="rounded text-blue-600 focus:ring-blue-500"
                            checked={applyToAll}
                            onChange={(e) => setApplyToAll(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-gray-900">Apply to all existing variants immediately</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6 mt-1">
                        If unchecked, this rule only applies to new variants. Existing overrides are preserved.
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
                >
                    <Save size={18} />
                    Save Pricing Rules
                </button>
            </div>
        </div>
    );
}
