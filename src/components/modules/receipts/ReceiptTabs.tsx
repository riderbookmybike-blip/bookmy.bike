'use client';

import React from 'react';

// Tab 1: Overview
export function ReceiptOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Receipt Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="text-gray-900 font-medium">Auto World Inc</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Date</span>
                            <span className="text-gray-900">22 May 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Receipt Ref</span>
                            <span className="text-gray-900">REC-2025-001</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Info</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Amount Received</span>
                            <span className="text-gray-900 font-bold">$2,500.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Mode</span>
                            <span className="text-gray-900">Bank Transfer (NEFT)</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Bank Ref</span>
                            <span className="text-gray-900">UTR-1234567890</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Allocation Status</h3>
                <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Unallocated Amount</span>
                        <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 text-green-600">
                        <span>Fully Allocated</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Allocations)
export function ReceiptTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🧾</span>
            </div>
            <p className="text-sm font-medium">Allocation History</p>
            <p className="text-xs mt-1">Invoices against which this payment was matched.</p>
        </div>
    );
}

// Tab 3: Documents
export function ReceiptDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📎</span>
            <p className="text-sm font-medium">Upload Bank Advice / Cheque Copy</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function ReceiptActivity() {
    return (
        <div className="space-y-4">
            {[1].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">Payment Received & Recorded</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago by Accounts Team</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function ReceiptStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">GL Posting</p>
            <p className="mt-1">Journal entry details available.</p>
        </div>
    );
}
