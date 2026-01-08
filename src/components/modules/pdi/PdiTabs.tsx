'use client';

import React from 'react';

// Tab 1: Overview
export function PdiOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Model</span>
                            <span className="text-gray-900 font-medium">Model X-Pro Bike</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">VIN</span>
                            <span className="text-gray-900">VN-2025-998877</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Color</span>
                            <span className="text-gray-900">Midnight Blue</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Inspection Info</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Technician</span>
                            <span className="text-gray-900 font-medium">Alex Mechanic</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Scheduled Date</span>
                            <span className="text-gray-900">30 May 2025</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Location</span>
                            <span className="text-gray-900">Service Bay 4</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Checklist Summary</h3>
                <div className="flex gap-4 text-sm mt-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                        <span>✓ Mechanical</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                        <span>✓ Electrical</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                        <span>⚠ Cosmetic</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Linked Service Job Placeholder)
export function PdiTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🔧</span>
            </div>
            <p className="text-sm font-medium">Linked Service Record</p>
            <p className="text-xs mt-1">Service job details linked to this PDI will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function PdiDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📸</span>
            <p className="text-sm font-medium">Upload Inspection Report / Photos</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function PdiActivity() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Inspection Completed' : 'PDI Scheduled'}</p>
                        <p className="text-xs text-gray-500">{i} hour(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function PdiStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Maintenance Log</p>
            <p className="mt-1">Detailed service log for this VIN.</p>
        </div>
    );
}
