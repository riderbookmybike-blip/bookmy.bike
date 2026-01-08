'use client';

import React from 'react';

// Tab 1: Overview
export function ReceivingOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">GRN Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">GRN #</span>
                            <span className="text-gray-900 font-medium">GRN-2025-042</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Linked PO #</span>
                            <span className="text-blue-600 font-medium cursor-pointer">PO-2025-001</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Vendor</span>
                            <span className="text-gray-900">AutoParts Global Ltd.</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Received Date</span>
                            <span className="text-gray-900">12 Jul 2025</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-gray-500">Status</span>
                            <span className="text-green-600 font-medium">Received</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Shipment Info</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Carrier</span>
                            <span className="text-gray-900">FedEx Logistics</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tracking #</span>
                            <span className="text-gray-900">TRK-99887766</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Receiver</span>
                            <span className="text-gray-900">Store Manager</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Received Items (Placeholder)</h3>
                <p className="text-sm text-gray-700">
                    - 10x Brake Pads (Model X) | Cond: Good
                    <br />
                    - 5x Oil Filters (Premium) | Cond: Good
                    <br />
                    - 20x Spark Plugs | Cond: Good
                </p>
            </div>
        </div>
    );
}

// Tab 2: Transactions
export function ReceivingTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>📦</span>
            </div>
            <p className="text-sm font-medium">Inventory Movements</p>
            <p className="text-xs mt-1">Stock ledger updates will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function ReceivingDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📎</span>
            <p className="text-sm font-medium">Upload Delivery Challan / Invoice</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function ReceivingActivity() {
    return (
        <div className="space-y-4">
            {[1].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">Goods Received & Verified</p>
                        <p className="text-xs text-gray-500">Just now</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement
export function ReceivingStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Audit Log</p>
            <p className="mt-1">Detailed system logs for this GRN.</p>
        </div>
    );
}
