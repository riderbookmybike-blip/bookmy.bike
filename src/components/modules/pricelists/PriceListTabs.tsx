'use client';

import React from 'react';

// Tab 1: Overview
export function PriceListOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Price List Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Currency</span>
                            <span className="text-gray-900 font-medium">USD ($)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Type</span>
                            <span className="text-gray-900">Sales Price List</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Active Status</span>
                            <span className="text-green-600 font-medium">Active</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Validity Period</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Valid From</span>
                            <span className="text-gray-900">01 Jan 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Valid To</span>
                            <span className="text-gray-900">31 Dec 2025</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Description / Notes</h3>
                <p className="text-sm text-gray-700">
                    Standard global price list for the fiscal year 2025.
                    Applies to all standard customers unless overridden.
                </p>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Placeholder for "Applied Orders" or similar)
export function PriceListTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🧾</span>
            </div>
            <p className="text-sm font-medium">No linked transactions</p>
            <p className="text-xs mt-1">Orders using this price list will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function PriceListDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📄</span>
            <p className="text-sm font-medium">Upload Approval Documents</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function PriceListActivity() {
    return (
        <div className="space-y-4">
            {[1].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">Price List Activated</p>
                        <p className="text-xs text-gray-500">1 week ago by Sales Admin</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Impact Analysis Placeholder)
export function PriceListStatement() {
    return (
        <div className="bg-blue-50 p-4 rounded border border-blue-200 text-blue-800 text-sm">
            <p className="font-medium">Impact Analysis</p>
            <p className="mt-1">Report on margin impact is available.</p>
        </div>
    );
}
