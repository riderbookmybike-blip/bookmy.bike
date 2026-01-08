'use client';

import React from 'react';

// Tab 1: Overview
export function RegistrationOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Application Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Applicant</span>
                            <span className="text-gray-900 font-medium">John Doe</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">RTO Location</span>
                            <span className="text-gray-900">MH-02 Mumbai West</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Application Type</span>
                            <span className="text-gray-900">New Registration</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Model</span>
                            <span className="text-gray-900 font-medium">Model X-Pro Bike</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Engine / Chassis</span>
                            <span className="text-gray-900">EN-123 / CH-456</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Temp Reg No</span>
                            <span className="text-gray-900">TR-MH-02-1122</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Fees & Tax</h3>
                <div className="flex gap-8 text-sm text-gray-700">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Road Tax</span>
                        <span className="font-medium text-green-600">Paid ($150)</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Reg Fee</span>
                        <span className="font-medium text-green-600">Paid ($50)</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">HSRP Fee</span>
                        <span className="font-medium text-orange-600">Pending</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Fee Payment History Placeholder)
export function RegistrationTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>🧾</span>
            </div>
            <p className="text-sm font-medium">Fee Payments</p>
            <p className="text-xs mt-1">Challans and receipt history will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function RegistrationDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📂</span>
            <p className="text-sm font-medium">Upload Form 20, 21 / ID Proof</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function RegistrationActivity() {
    return (
        <div className="space-y-4">
            {[1, 5, 7].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Documents Verified at RTO' : (i === 5 ? 'Application Submitted' : 'Vehicle Invoiced')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function RegistrationStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Application Log</p>
            <p className="mt-1">Detailed audit trail of the application process.</p>
        </div>
    );
}
