'use client';

import React from 'react';

// Tab 1: Overview
export function InsuranceOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Policy Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Insurer</span>
                            <span className="text-gray-900 font-medium">SafeGuard Insurance</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="text-blue-600 cursor-pointer">Rahul Sharma</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Policy Type</span>
                            <span className="text-gray-900">Comprehensive</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Coverage & Premium</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Expiry Date</span>
                            <span className="text-gray-900 font-medium">15 Aug 2026</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">IDV Value</span>
                            <span className="text-gray-900">$850.00</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Premium</span>
                            <span className="text-green-600 font-bold">$120.00 / yr</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Model X-Pro Bike</span>
                        <span>Reg: MH-02-XY-9999</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 text-gray-900">
                        <span>Engine #: EN-88776655</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Premium Payment History Placeholder)
export function InsuranceTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>💳</span>
            </div>
            <p className="text-sm font-medium">Premium History</p>
            <p className="text-xs mt-1">Payment records for this policy will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function InsuranceDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📜</span>
            <p className="text-sm font-medium">Upload Policy PDF / Cover Note</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function InsuranceActivity() {
    return (
        <div className="space-y-4">
            {[1, 30, 365].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Renewal Notice Sent' : (i === 30 ? 'Policy Endorsement' : 'Policy Issued')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function InsuranceStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Policy Log</p>
            <p className="mt-1">Detailed history of policy changes and claims.</p>
        </div>
    );
}
