'use client';

import React from 'react';

// Tab 1: Overview
export function TeamOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Employee Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Full Name</span>
                            <span className="text-gray-900 font-medium">Amit Singh</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Employee ID</span>
                            <span className="text-gray-900">EMP-2023-005</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Position</span>
                            <span className="text-gray-900">Sales Manager</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Unit Info</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Department</span>
                            <span className="text-gray-900 font-medium">Sales</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Reporting Manager</span>
                            <span className="text-blue-600 cursor-pointer">Sarah Connor</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Email</span>
                            <span className="text-gray-900">amit.singh@bookmy.bike</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Access & Shift</h3>
                <div className="flex gap-8 text-sm text-gray-700">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Role</span>
                        <span className="font-medium">Admin</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Shift</span>
                        <span className="font-medium">General (9AM - 6PM)</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Location</span>
                        <span className="font-medium">HQ - Mumbai</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Payroll/Expenses Placeholder)
export function TeamTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>💰</span>
            </div>
            <p className="text-sm font-medium">Payroll & Expenses</p>
            <p className="text-xs mt-1">Payslips and reimbursement history will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function TeamDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">📁</span>
            <p className="text-sm font-medium">Upload Contract / ID Proof / NDA</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function TeamActivity() {
    return (
        <div className="space-y-4">
            {[1, 10, 30].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Logged In' : (i === 10 ? 'Password Changed' : 'Profile Updated')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function TeamStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Attendance & Leave Log</p>
            <p className="mt-1">Detailed attendance records and leave balance.</p>
        </div>
    );
}
