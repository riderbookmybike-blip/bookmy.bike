'use client';

import React from 'react';

// Tab 1: Overview
export function PurchaseOrderOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">PO #</span>
                            <span className="text-gray-900 font-medium">PO-2025-001</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Vendor</span>
                            <span className="text-gray-900 font-medium">AutoParts Global Ltd.</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="text-gray-900">01 Jul 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Expected Delivery</span>
                            <span className="text-gray-900">10 Jul 2025</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Financials</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-900">₹45,000</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tax</span>
                            <span className="text-gray-900">₹8,100</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-900 font-medium">Total Amount</span>
                            <span className="text-gray-900 font-bold">₹53,100</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-gray-500">Status</span>
                            <span className="text-blue-600 font-medium">Issued</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Line Items (Placeholder)</h3>
                <p className="text-sm text-gray-700">
                    - 10x Brake Pads (Model X)
                    <br />
                    - 5x Oil Filters (Premium)
                    <br />
                    - 20x Spark Plugs
                </p>
            </div>
        </div>
    );
}

// Tab 2: Transactions
export function PurchaseOrderTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🧾</span>
            </div>
            <p className="text-sm font-medium">Related Transactions</p>
            <p className="text-xs mt-1">Payment records or advance payments will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function PurchaseOrderDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📄</span>
            <p className="text-sm font-medium">Upload PO / Vendor Docs</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function PurchaseOrderActivity() {
    return (
        <div className="space-y-4">
            {[1, 3].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'PO Approved by Manager' : 'PO Created'}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement
export function PurchaseOrderStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Audit Log</p>
            <p className="mt-1">Detailed system logs for this Purchase Order.</p>
        </div>
    );
}
