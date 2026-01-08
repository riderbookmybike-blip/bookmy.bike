'use client';

import React from 'react';

// Tab 1: Overview
export function ReturnsOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Return Request</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="text-gray-900 font-medium">Biker Zone Ltd</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Original Order</span>
                            <span className="text-blue-600 cursor-pointer">SO-2025-108</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Reason</span>
                            <span className="text-gray-900">Defective / Damaged</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Resolution</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Requested Action</span>
                            <span className="text-gray-900 font-medium">Refund</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Condition</span>
                            <span className="text-gray-900">Opened, Original Packaging</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Refund Amount</span>
                            <span className="text-red-600 font-bold">$1,200.00</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Items Returned</h3>
                <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Model Y-Standard Bike</span>
                        <span>Qty: 1</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 text-gray-900">
                        <span>Total Items: 1</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Refund Placeholder)
export function ReturnsTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>💸</span>
            </div>
            <p className="text-sm font-medium">Refund Transactions</p>
            <p className="text-xs mt-1">Refunds related to this return will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function ReturnsDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📸</span>
            <p className="text-sm font-medium">Upload Photos of Damage / Return Label</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function ReturnsActivity() {
    return (
        <div className="space-y-4">
            {[1, 3].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Inspection Completed' : 'Return Requested by Customer'}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function ReturnsStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Adjustment Log</p>
            <p className="mt-1">Inventory adjustment and credit note log.</p>
        </div>
    );
}
