'use client';

import React from 'react';

// Tab 1: Overview
export function StockTransferOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Transfer Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">From</span>
                            <span className="text-gray-900 font-medium">Main Hub - Mumbai</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">To</span>
                            <span className="text-gray-900 font-medium">Regional Center - Pune</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Transfer Date</span>
                            <span className="text-gray-900">01 Jun 2025</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Logistics Info</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Carrier</span>
                            <span className="text-gray-900 font-medium">SafeTrans Logistics</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Vehicle #</span>
                            <span className="text-gray-900">MH-12-AB-1234</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Gate Pass #</span>
                            <span className="text-gray-900">GP-2025-001</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Items Summary</h3>
                <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Model X-Pro Bike</span>
                        <span>Qty: 20</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Spare Parts Box</span>
                        <span>Qty: 5</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 text-blue-600">
                        <span>Total Items: 25</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Transfer Items List)
export function StockTransferTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>📦</span>
            </div>
            <p className="text-sm font-medium">Itemized List</p>
            <p className="text-xs mt-1">Detailed list of SKUs in this transfer.</p>
        </div>
    );
}

// Tab 3: Documents
export function StockTransferDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📄</span>
            <p className="text-sm font-medium">Upload Gate Pass / E-Way Bill</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function StockTransferActivity() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Arrived at Destination' : (i === 2 ? 'In Transit' : 'Gate Pass Created')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function StockTransferStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Movement Log</p>
            <p className="mt-1">Detailed audit trail of stock movement.</p>
        </div>
    );
}
