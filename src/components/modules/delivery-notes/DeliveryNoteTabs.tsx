'use client';

import React from 'react';

// Tab 1: Overview
export function DeliveryNoteOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="text-gray-900 font-medium">Safe Rides Logistics</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Dispatch Date</span>
                            <span className="text-gray-900">28 May 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Sales Order</span>
                            <span className="text-blue-600 cursor-pointer">SO-2025-105</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Shipping Info</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Carrier</span>
                            <span className="text-gray-900 font-medium">FastTrack Couriers</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tracking #</span>
                            <span className="text-gray-900">FT-99887766</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Destination</span>
                            <span className="text-gray-900">Mumbai Central Hub</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Packed Items</h3>
                <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Model Y-Standard Bike</span>
                        <span>Qty: 5</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span>Safety Helmet</span>
                        <span>Qty: 10</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 text-green-600">
                        <span>All Items Packed</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Related Orders Placeholder)
export function DeliveryNoteTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>📦</span>
            </div>
            <p className="text-sm font-medium">Related Records</p>
            <p className="text-xs mt-1">Links to Invoices and Orders will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function DeliveryNoteDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">🖊️</span>
            <p className="text-sm font-medium">Upload POD (Proof of Delivery)</p>
            <p className="text-xs mt-1">Drag and drop signed delivery note here</p>
        </div>
    );
}

// Tab 4: Activity
export function DeliveryNoteActivity() {
    return (
        <div className="space-y-4">
            {[1, 2, 4].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Out for Delivery' : (i === 2 ? 'Dispatched from Warehouse' : 'Packing Completed')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function DeliveryNoteStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Logistics Log</p>
            <p className="mt-1">Detailed movement history available.</p>
        </div>
    );
}
