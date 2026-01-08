'use client';

import React from 'react';

// Tab 1: Overview
export function SalesOrderOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="text-gray-900 font-medium">Biker Zone Ltd</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Order Date</span>
                            <span className="text-gray-900">12 May 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Sales Rep</span>
                            <span className="text-gray-900">John Salesman</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Shipping & Terms</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ship To</span>
                            <span className="text-gray-900">Warehouse 4, Plot 10</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Expected Delivery</span>
                            <span className="text-gray-900">20 May 2025</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Payment Terms</span>
                            <span className="text-gray-900">Net 45</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Model X-Pro Bike x 2</span>
                        <span>$30,000.00</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Helmet Premium x 2</span>
                        <span>$300.00</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1">
                        <span>Total</span>
                        <span>$30,300.00</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Placeholder for Invoices/Payments)
export function SalesOrderTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>💰</span>
            </div>
            <p className="text-sm font-medium">No linked invoices</p>
            <p className="text-xs mt-1">Invoices and payments will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function SalesOrderDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📦</span>
            <p className="text-sm font-medium">Upload POD / Delivery Notes</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function SalesOrderActivity() {
    return (
        <div className="space-y-4">
            {[1, 3, 5].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Order Confirmed' : (i === 3 ? 'Credit Check Approved' : 'Order Created')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function SalesOrderStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Order Ledger</p>
            <p className="mt-1">N/A for single Order.</p>
        </div>
    );
}
