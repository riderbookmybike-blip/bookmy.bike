'use client';

import React from 'react';

// Tab 1: Overview
export function ExpenseOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Expense Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payee</span>
                            <span className="text-gray-900 font-medium">John Doe (Sales)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date Incurred</span>
                            <span className="text-gray-900">01 Jun 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Category</span>
                            <span className="text-gray-900">Travel & Accommodation</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Amount</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Claimed Amount</span>
                            <span className="text-gray-900 font-bold">$450.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Approved Amount</span>
                            <span className="text-gray-900">$450.00</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Status</span>
                            <span className="text-green-600 font-medium">Approved</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Purpose</h3>
                <p className="text-sm text-gray-700">
                    Client meeting with ABC Logistics in Chicago. Includes flight and 1-night hotel stay.
                </p>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Reimbursement History Placeholder)
export function ExpenseTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>💸</span>
            </div>
            <p className="text-sm font-medium">Reimbursement History</p>
            <p className="text-xs mt-1">Payment records for this claim will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function ExpenseDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">🧾</span>
            <p className="text-sm font-medium">Upload Receipts</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function ExpenseActivity() {
    return (
        <div className="space-y-4">
            {[1, 2, 5].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Approved by Manager' : (i === 2 ? 'Submitted for Approval' : 'Draft Created')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function ExpenseStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Audit Log</p>
            <p className="mt-1">Detailed system audit log for this expense record.</p>
        </div>
    );
}
