'use client';

import React from 'react';

// Tab 1: Overview
export function LeadOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Lead Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Lead #</span>
                            <span className="text-gray-900 font-medium">LEAD-8001</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer Name</span>
                            <span className="text-gray-900 font-medium">Rahul Sharma</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Mobile</span>
                            <span className="text-gray-900">+91 98765 43210</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Source</span>
                            <span className="text-gray-900">Website Enquiry</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignment Info</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Assigned To</span>
                            <span className="text-gray-900 font-medium">Sales Team A</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Campaign</span>
                            <span className="text-gray-900">Summer Sale 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Created Date</span>
                            <span className="text-gray-900">01 Jun 2025</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Status</span>
                            <span className="text-blue-600 font-medium">New</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Interest</h3>
                <p className="text-sm text-gray-700">
                    Interested in Electric Models. Looking for financing options.
                </p>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Interaction History Placeholder)
export function LeadTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>📞</span>
            </div>
            <p className="text-sm font-medium">Interaction History</p>
            <p className="text-xs mt-1">Calls, Visits, and Follow-ups will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function LeadDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">🆔</span>
            <p className="text-sm font-medium">Upload ID Proof / Docs</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function LeadActivity() {
    return (
        <div className="space-y-4">
            {[1, 2, 5].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Follow-up Call Scheduled' : (i === 2 ? 'Lead Assigned to Sales Team A' : 'Lead Created via Website')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function LeadStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Lead Audit Log</p>
            <p className="mt-1">Detailed system audit trail for this lead.</p>
        </div>
    );
}
