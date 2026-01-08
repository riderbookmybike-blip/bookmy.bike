'use client';

import React from 'react';

// Tab 1: Overview
export function CustomerOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="text-gray-900">customer@example.com</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Phone</span>
                            <span className="text-gray-900">+91 98765 43210</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tax ID</span>
                            <span className="text-gray-900">GSTIN123456789</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Credit Terms</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Credit Limit</span>
                            <span className="text-gray-900 font-medium">$10,000.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Terms</span>
                            <span className="text-gray-900">Net 30</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Addresses</h3>
                <div className="text-sm text-gray-700">
                    <p className="font-medium">Billing Address</p>
                    <p>123 Business Park, Tech Road,</p>
                    <p>Bangalore, Karnataka, 560100</p>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions
export function CustomerTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>$</span>
            </div>
            <p className="text-sm font-medium">No transactions found</p>
            <p className="text-xs mt-1">Create a new transaction to see it here.</p>
        </div>
    );
}

// Tab 3: Documents
export function CustomerDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📄</span>
            <p className="text-sm font-medium">Upload Documents</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function CustomerActivity() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">Updated profile information</p>
                        <p className="text-xs text-gray-500">2 hours ago by Admin</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement
export function CustomerStatement() {
    return (
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-800 text-sm">
            <p className="font-medium">Statement of Accounts</p>
            <p className="mt-1">Statement generation is pending for this period.</p>
        </div>
    );
}
