'use client';

import React from 'react';

// Tab 1: Overview
export function QuoteOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Quote Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subject</span>
                            <span className="text-gray-900 font-medium">Bulk Order - Helmets</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="text-gray-900">Tech Corp Pvt Ltd</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Sales Person</span>
                            <span className="text-gray-900">Alex Sales</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Dates & Terms</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Quote Date</span>
                            <span className="text-gray-900">10 May 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Valid Until</span>
                            <span className="text-gray-900">10 Jun 2025</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Terms</span>
                            <span className="text-gray-900">Net 30</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Line Items Summary</h3>
                <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Helmet Premium x 50</span>
                        <span>$7,500.00</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Gloves Racing x 50</span>
                        <span>$2,500.00</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1">
                        <span>Total</span>
                        <span>$10,000.00</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Placeholder for Related orders/invoices)
export function QuoteTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🔗</span>
            </div>
            <p className="text-sm font-medium">No related transactions</p>
            <p className="text-xs mt-1">Converted orders or invoices will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function QuoteDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📄</span>
            <p className="text-sm font-medium">Upload Quote PDF / Attachments</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function QuoteActivity() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Quote Sent to Customer' : 'Quote Created'}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function QuoteStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Quote Ledger</p>
            <p className="mt-1">N/A for Quotes (Non-financial posting document).</p>
        </div>
    );
}
