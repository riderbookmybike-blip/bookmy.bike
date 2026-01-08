'use client';

import React from 'react';

// Tab 1: Overview
export function FinanceOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Application Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Applicant</span>
                            <span className="text-gray-900 font-medium">Rajesh Kumar</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Application Date</span>
                            <span className="text-gray-900">15 May 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Loan Type</span>
                            <span className="text-gray-900">Two Wheeler Loan</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Loan Terms</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Requested Amount</span>
                            <span className="text-gray-900 font-medium">$2,500.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tenure</span>
                            <span className="text-gray-900">24 Months</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">EMI Scheme</span>
                            <span className="text-gray-900">Standard Reduced Balance</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">KYC Status</h3>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Identity Proof Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Address Proof Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>Income Proof Pending</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Placeholder for Disbursals/Repayments)
export function FinanceTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>💸</span>
            </div>
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="text-xs mt-1">Disbursals and EMI repayments will be listed here.</p>
        </div>
    );
}

// Tab 3: Documents
export function FinanceDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📂</span>
            <p className="text-sm font-medium">Upload KYC / Income Documents</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function FinanceActivity() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Application Submitted' : 'Credit Check Initiated'}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Loan Statement Placeholder)
export function FinanceStatement() {
    return (
        <div className="bg-blue-50 p-4 rounded border border-blue-200 text-blue-800 text-sm">
            <p className="font-medium">Loan Statement</p>
            <p className="mt-1">Detailed amortization schedule available after disbursal.</p>
        </div>
    );
}
