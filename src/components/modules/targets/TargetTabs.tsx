'use client';

import React from 'react';

// Tab 1: Overview
export function TargetOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Target Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Target Name</span>
                            <span className="text-gray-900 font-medium">Q2 Sales Goals</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Period</span>
                            <span className="text-gray-900">Q2 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Assignee</span>
                            <span className="text-gray-900">Sales Team - North</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Achievement</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Target Value</span>
                            <span className="text-gray-900 font-bold">$100,000.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Achieved</span>
                            <span className="text-gray-900">$85,400.00</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Projected Incentive</span>
                            <span className="text-green-600 font-medium">$5,000.00</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Progress</h3>
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                            85.4% Achieved
                        </span>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                        <div style={{ width: "85.4%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                    </div>
                    <p className="text-xs text-gray-500">15 days remaining in period.</p>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Payout History Placeholder)
export function TargetTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🏆</span>
            </div>
            <p className="text-sm font-medium">Incentive Payouts</p>
            <p className="text-xs mt-1">Payout history for this target will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function TargetDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📜</span>
            <p className="text-sm font-medium">Upload Policy / Proof</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function TargetActivity() {
    return (
        <div className="space-y-4">
            {[1, 15, 45].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Milestone Reached: 80%' : (i === 15 ? 'Weekly Update' : 'Target Assigned')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function TargetStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Performance Log</p>
            <p className="mt-1">Detailed daily/weekly performance contribution log.</p>
        </div>
    );
}
