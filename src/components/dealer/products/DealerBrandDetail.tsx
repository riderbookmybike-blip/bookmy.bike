'use client';

import React from 'react';
import DetailPanel from '@/components/templates/DetailPanel';
import { MOCK_VEHICLES, MOCK_ACCESSORIES, MOCK_SERVICES } from '@/types/productMaster';
import BrandPricingForm from './BrandPricingForm';

interface DealerBrandDetailProps {
    brandName: string | null;
    onClose: () => void;
}

export default function DealerBrandDetail({ brandName, onClose }: DealerBrandDetailProps) {
    if (!brandName) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-500">
                <div className="text-center">
                    <p>Select a Brand to manage enablement & pricing</p>
                </div>
            </div>
        );
    }

    // Filter products for this brand
    const allProducts = [...MOCK_VEHICLES, ...MOCK_ACCESSORIES, ...MOCK_SERVICES];
    const brandProducts = allProducts.filter(p => p.make === brandName);

    // Stats
    const models = new Set(brandProducts.map(p => p.model)).size;
    const variants = brandProducts.length;

    const renderContent = (activeTab: string) => {
        switch (activeTab) {
            case 'Overview':
                return (
                    <div className="space-y-6">
                        {/* Banner */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold">Variants Auto-Enabled</h3>
                            <p className="opacity-90 mt-1">
                                Enabling {brandName} automatically activates all {variants} variants from the Master Catalog.
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg">
                                <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Total Models</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{models}</div>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg">
                                <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Total Variants</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{variants}</div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-lg">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Included Models</h4>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(brandProducts.map(p => p.model))).map(m => (
                                    <span key={m} className="px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded text-xs font-medium text-gray-700 dark:text-slate-300">
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'Pricing Rules':
                return <BrandPricingForm brandName={brandName} onSave={() => { }} />;
            case 'Variants':
                return (
                    <div className="bg-white dark:bg-slate-900 border boundary-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Variant</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3 text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                {brandProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 dark:text-white">{p.model}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">{p.variant} {p.color}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-slate-500">
                                            {p.sku}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                                Override
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DetailPanel
            title={brandName}
            status={'Enabled'} // Mock status for now
            onClose={onClose}
            tabs={['Overview', 'Pricing Rules', 'Variants']}
            renderContent={renderContent}
        />
    );
}
