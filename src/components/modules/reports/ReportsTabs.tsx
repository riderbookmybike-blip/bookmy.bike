'use client';

import React from 'react';

// Tab 1: Overview
export function ReportsOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Report Configuration</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Category</span>
                            <span className="text-gray-900 font-medium">Sales</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Frequency</span>
                            <span className="text-gray-900">Monthly</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Description</span>
                            <span className="text-gray-900">Monthly sales performance by region.</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Output Parameters</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Format</span>
                            <span className="text-gray-900 font-medium">PDF, Excel</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Recipients</span>
                            <span className="text-blue-600 cursor-pointer">View List (5)</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Last Generated</span>
                            <span className="text-gray-900">30 May 2025</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Filters</h3>
                <div className="flex gap-8 text-sm text-gray-700">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Date Range</span>
                        <span className="font-medium">Last 30 Days</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Branch</span>
                        <span className="font-medium">All Branches</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Status</span>
                        <span className="font-medium text-green-600">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Execution History Placeholder)
export function ReportsTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🔄</span>
            </div>
            <p className="text-sm font-medium">Execution History</p>
            <p className="text-xs mt-1">Past run logs and status will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function ReportsDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📥</span>
            <p className="text-sm font-medium">Download Generated Reports</p>
            <p className="text-xs mt-1">Click to access archived report files</p>
        </div>
    );
}

// Tab 4: Activity
export function ReportsActivity() {
    return (
        <div className="space-y-4">
            {[1, 7, 30].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Report Viewed by Manager' : (i === 7 ? 'Validation Check Passed' : 'Scheduled Run Completed')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function ReportsStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">System Logs</p>
            <p className="mt-1">Detailed system utilization and resource consumption log.</p>
        </div>
    );
}
