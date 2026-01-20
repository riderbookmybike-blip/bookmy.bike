'use client';

import React, { useEffect, useState } from 'react';
import { PriceSnapshot } from '@/types/pricing';
import { generateMockSnapshot } from '@/lib/pricingEngine';
import { ProductVariant } from '@/types/productMaster';

interface ProductPriceViewProps {
    product: ProductVariant;
    rtoCode?: string; // Default to DL-01
}

export default function ProductPriceView({ product, rtoCode = 'DL-01' }: ProductPriceViewProps) {
    const [snapshot, setSnapshot] = useState<PriceSnapshot | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate "Fetch Snapshot" behavior
        // In real app: await fetch(`/api/pricing/snapshot?sku=${product.sku}&rto=${rtoCode}`)
        const loadPrice = async () => {
            setLoading(true);
            await new Promise(r => setTimeout(r, 500)); // Network delay
            const snap = generateMockSnapshot(product, rtoCode.split('-')[0], rtoCode);
            setSnapshot(snap);
            setLoading(false);
        };

        loadPrice();
    }, [product, rtoCode]);

    if (loading) {
        return <div className="animate-pulse h-24 bg-gray-100 dark:bg-slate-800 rounded-lg w-full"></div>;
    }

    if (!snapshot) return null;

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm">
            <h3 className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400 mb-2">
                On-Road Price Estimate ({snapshot.rtoCode})
            </h3>

            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{snapshot.totalOnRoad.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                    {snapshot.ruleVersion}
                </span>
            </div>

            {/* Breakdown - Read Only */}
            <div className="space-y-2 text-sm border-t border-gray-100 dark:border-white/10 pt-3">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Ex-Showroom</span>
                    <span className="font-medium text-gray-900 dark:text-white">₹{snapshot.exShowroom.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">RTO & Registration</span>
                    <span className="font-medium text-gray-900 dark:text-white">₹{snapshot.rtoCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Insurance (1+5yr)</span>
                    <span className="font-medium text-gray-900 dark:text-white">₹{snapshot.insuranceBase.toLocaleString()}</span>
                </div>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-white/10 text-[10px] text-gray-400 dark:text-slate-500 text-center">
                Snapshot ID: {snapshot.id} • {snapshot.calculatedAt.split('T')[0]}
            </div>
        </div>
    );
}
