'use client';

import React from 'react';

// Tab 1: Overview
export function InventoryOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Item Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Product Name</span>
                            <span className="text-gray-900 font-medium">Model X-Pro Bike</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">SKU</span>
                            <span className="text-gray-900">SKU-BIKE-XPRO-001</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Category</span>
                            <span className="text-gray-900">Vehicles</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Stock Status</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total On Hand</span>
                            <span className="text-gray-900 font-bold">45 Units</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Allocated</span>
                            <span className="text-gray-900">5 Units</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Available</span>
                            <span className="text-green-600 font-medium">40 Units</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Warehouse Location</h3>
                <div className="flex gap-8 text-sm text-gray-700">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Warehouse</span>
                        <span className="font-medium">Main Hub - Mumbai</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Aisle</span>
                        <span className="font-medium">A-12</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Shelf</span>
                        <span className="font-medium">S-04</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Stock Movements)
export function InventoryTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🔄</span>
            </div>
            <p className="text-sm font-medium">Stock Movements</p>
            <p className="text-xs mt-1">Inward and Outward stock history will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function InventoryDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📋</span>
            <p className="text-sm font-medium">Upload Stock Transfer / Adjustment Docs</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function InventoryActivity() {
    return (
        <div className="space-y-4">
            {[1, 10, 25].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Internal Transfer In' : (i === 10 ? 'Stock Audit Verified' : 'Initial Stock In')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function InventoryStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Stock Valuation Log</p>
            <p className="mt-1">FIFO/Weighted Average valuation history.</p>
        </div>
    );
}
