'use client';

import React from 'react';

// Tab 1: Overview
export function VendorOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Vendor Information</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="text-gray-900">vendor@example.com</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Phone</span>
                            <span className="text-gray-900">+91 99887 76655</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tax ID</span>
                            <span className="text-gray-900">GSTIN987654321</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Contact Person</span>
                            <span className="text-gray-900">John Doe</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Terms</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Standard Terms</span>
                            <span className="text-gray-900">Net 45</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Bank Name</span>
                            <span className="text-gray-900">HDFC Bank</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Addresses</h3>
                <div className="text-sm text-gray-700">
                    <p className="font-medium">Registered Office</p>
                    <p>456 Industrial Area, Phase 2,</p>
                    <p>Pune, Maharashtra, 411001</p>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions
export function VendorTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>$</span>
            </div>
            <p className="text-sm font-medium">No purchase orders found</p>
            <p className="text-xs mt-1">Create a new PO to see it here.</p>
        </div>
    );
}

// Tab 3: Documents
export function VendorDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📄</span>
            <p className="text-sm font-medium">Upload Contracts / Agreements</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function VendorActivity() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">Vendor onboarding completed</p>
                        <p className="text-xs text-gray-500">5 days ago by Ops Manager</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement
export function VendorStatement() {
    return (
        <div className="bg-blue-50 p-4 rounded border border-blue-200 text-blue-800 text-sm">
            <p className="font-medium">Vendor Ledger</p>
            <p className="mt-1">Ledger reconciliation is up to date.</p>
        </div>
    );
}
