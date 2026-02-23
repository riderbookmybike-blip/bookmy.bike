'use client';

import React, { useState, useEffect } from 'react';
// Legacy mock type — kept locally for demo UI compatibility
interface InventoryItem {
    id: string;
    sku: string;
    brand: string;
    model: string;
    variant: string;
    color: string;
    totalStock: number;
    reserved: number;
    allotted: number;
    available: number;
    lastUpdated: string;
}
import { Package, Activity, Fingerprint } from 'lucide-react';
// import { getVins } from '@/lib/dataStore'; // Missing
const getVins = (): VehicleUnit[] => []; // Stub
import { VehicleUnit } from '@/types/vehicleUnit';

interface InventoryDetailProps {
    item: InventoryItem | null;
}

export default function InventoryDetail({ item }: InventoryDetailProps) {
    const [relatedVins, setRelatedVins] = useState<VehicleUnit[]>([]);

    useEffect(() => {
        if (item) {
            // In a real app, strict check on SKU.
            // Demo: Match based on mapped SKU in mock data
            const all = getVins();
            const filtered = all.filter(v => v.sku === item.sku);
            setRelatedVins(filtered);
        }
    }, [item]);

    if (!item) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-slate-500">
                <div className="text-center">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Select a SKU to view details</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 flex-shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-mono text-sm text-blue-600 mb-1">{item.sku}</div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {item.brand} {item.model}
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400">
                            {item.variant} - {item.color}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{item.available}</div>
                        <div className="text-xs text-green-600 uppercase font-bold tracking-wider">
                            Available to Sell
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="text-xs text-gray-500 dark:text-slate-400 uppercase font-bold mb-1">
                            Total Physical
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.totalStock}</div>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl border border-yellow-200 dark:border-yellow-500/20">
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 uppercase font-bold mb-1">
                            Soft Locked
                        </div>
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{item.reserved}</div>
                        <div className="text-[10px] text-yellow-600 dark:text-yellow-300 mt-1">
                            Pending Confirmation
                        </div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                        <div className="text-xs text-red-700 dark:text-red-300 uppercase font-bold mb-1">
                            Hard Locked
                        </div>
                        <div className="text-2xl font-bold text-red-900 dark:text-red-200">{item.allotted}</div>
                        <div className="text-[10px] text-red-600 dark:text-red-300 mt-1">Awaiting Delivery</div>
                    </div>
                </div>

                {/* VIN List Section (Step 9) */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Fingerprint size={18} /> Associated VINs / Chassis
                </h3>
                <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden mb-8">
                    {relatedVins.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 dark:text-slate-500 text-sm">
                            No VINs tracked for this SKU yet.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="px-4 py-3">VIN</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Inward Date</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                {relatedVins.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-4 py-3 font-mono text-blue-700 font-bold">{v.vin}</td>
                                        <td className="px-4 py-3 text-gray-900 dark:text-white">{v.location}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{v.inwardDate}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    v.status === 'AVAILABLE'
                                                        ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                                        : v.status === 'ASSIGNED'
                                                          ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-400'
                                                }`}
                                            >
                                                {v.status}
                                            </span>
                                            {v.bookingId && (
                                                <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                                                    Ref: {v.bookingId}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Audit / Info */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity size={18} /> Activity Log
                </h3>
                <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Change</th>
                                <th className="px-4 py-3">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Mock Activity */}
                            <tr>
                                <td className="px-4 py-3 text-gray-500">Just now</td>
                                <td className="px-4 py-3">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                                        SYSTEM
                                    </span>
                                </td>
                                <td className="px-4 py-3">Sync</td>
                                <td className="px-4 py-3 text-gray-400">Auto-update</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
