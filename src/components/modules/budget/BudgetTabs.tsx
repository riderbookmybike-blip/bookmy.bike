'use client';

import React from 'react';

// Tab 1: Overview
export function BudgetOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Budget Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Department</span>
                            <span className="text-gray-900 font-medium">Marketing</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Period</span>
                            <span className="text-gray-900">Q2 2025 (Apr - Jun)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Manager</span>
                            <span className="text-blue-600 cursor-pointer">Sarah Connor</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Utilization</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Allocated</span>
                            <span className="text-gray-900 font-bold">$50,000.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Spent</span>
                            <span className="text-gray-900">$35,200.00</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Remaining</span>
                            <span className="text-green-600 font-medium">$14,800.00</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Progress</h3>
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                            70.4% Used
                        </span>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                        <div style={{ width: "70.4%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Expenses against Budget Placeholder)
export function BudgetTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>📉</span>
            </div>
            <p className="text-sm font-medium">Expense Entries</p>
            <p className="text-xs mt-1">List of expenses charged to this budget will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function BudgetDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📎</span>
            <p className="text-sm font-medium">Upload Approval Docs / Policy</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function BudgetActivity() {
    return (
        <div className="space-y-4">
            {[1, 15, 60].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Budget Re-allocated' : (i === 15 ? 'Alert: 70% Utilized' : 'Budget Approved')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function BudgetStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Utilization Log</p>
            <p className="mt-1">Detailed audit of budget utilization and allocation changes.</p>
        </div>
    );
}
