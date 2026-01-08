'use client';

import React from 'react';

// Tab 1: Overview
export function PhysicalAuditOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Audit Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Audit #</span>
                            <span className="text-gray-900 font-medium">AUD-2025-Q3</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Location</span>
                            <span className="text-gray-900 font-medium">Main Warehouse (Zone A)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="text-gray-900">15 Jul 2025</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-gray-500">Status</span>
                            <span className="text-orange-600 font-medium">In Progress</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary Metrics</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">System Stock (Est.)</span>
                            <span className="text-gray-900">450 Units</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Physical Count</span>
                            <span className="text-gray-900">448 Units</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Difference</span>
                            <span className="text-red-600 font-bold">-2 Units</span>
                        </div>
                        <a href="#" className="block mt-2 text-blue-600 text-xs hover:underline">View Variance Report</a>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Instructions</h3>
                <p className="text-sm text-gray-700">
                    Please scan all bins in Zone A. Ensure damaged items are segregated and marked in the "Damaged" category during scan.
                </p>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Scan Logs)
export function PhysicalAuditTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🔍</span>
            </div>
            <p className="text-sm font-medium">Scan Logs</p>
            <p className="text-xs mt-1">Real-time scan entries will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function PhysicalAuditDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📊</span>
            <p className="text-sm font-medium">Upload Audit Report / Sign-offs</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function PhysicalAuditActivity() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Audit Started by Supervisor' : 'Audit Scheduled'}</p>
                        <p className="text-xs text-gray-500">{i} hour(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement
export function PhysicalAuditStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Audit Trail</p>
            <p className="mt-1">Detailed system logs for this Audit session.</p>
        </div>
    );
}
