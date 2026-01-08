'use client';

import React from 'react';

// Tab 1: Overview
export function AdminOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Setting Configuration</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Key</span>
                            <span className="text-gray-900 font-medium">GLOBAL_TAX_RATE</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Scope</span>
                            <span className="text-gray-900">Global</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Data Type</span>
                            <span className="text-gray-900">Percentage</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Value</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Value</span>
                            <span className="text-gray-900 font-bold">18.00%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Effective From</span>
                            <span className="text-gray-900">01 Jan 2024</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Status</span>
                            <span className="text-green-600 font-medium">Active</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-sm text-gray-700">
                    Default tax rate applied to all taxable items unless overridden by specific product or category settings.
                </p>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Change History Placeholder)
export function AdminTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🔄</span>
            </div>
            <p className="text-sm font-medium">Change History</p>
            <p className="text-xs mt-1">History of value changes (Old Value &rarr; New Value) will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function AdminDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📁</span>
            <p className="text-sm font-medium">Upload Config / Backup</p>
            <p className="text-xs mt-1">Drag and drop JSON config files or backup archives</p>
        </div>
    );
}

// Tab 4: Activity
export function AdminActivity() {
    return (
        <div className="space-y-4">
            {[1, 30, 180].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Value Updated by Admin' : (i === 30 ? 'System Backup Created' : 'Setting Initialized')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function AdminStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Audit Log</p>
            <p className="mt-1">Detailed system audit trail for this setting.</p>
        </div>
    );
}
