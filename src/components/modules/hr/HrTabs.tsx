'use client';

import React from 'react';

// Tab 1: Overview
export function HrOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Employment Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Designation</span>
                            <span className="text-gray-900 font-medium">Senior Technician</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Grade</span>
                            <span className="text-gray-900">L3</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Confirmation Date</span>
                            <span className="text-gray-900">15 Jan 2024</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Reporting</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Department</span>
                            <span className="text-gray-900 font-medium">Service</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Supervisor</span>
                            <span className="text-blue-600 cursor-pointer">Alex Lead</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Shift</span>
                            <span className="text-gray-900">Morning (8AM - 5PM)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Indicators</h3>
                <div className="flex gap-8 text-sm text-gray-700">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Last Rating</span>
                        <span className="font-medium text-green-600">4.5 / 5.0</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Attendance</span>
                        <span className="font-medium">98%</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Status</span>
                        <span className="font-medium">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Salary/Bonus History Placeholder)
export function HrTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>💰</span>
            </div>
            <p className="text-sm font-medium">Compensation History</p>
            <p className="text-xs mt-1">Salary revisions and bonus records will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function HrDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">🏅</span>
            <p className="text-sm font-medium">Upload Appraisal / Warning Letters</p>
            <p className="text-xs mt-1">Drag and drop or click to upload</p>
        </div>
    );
}

// Tab 4: Activity
export function HrActivity() {
    return (
        <div className="space-y-4">
            {[1, 90, 180].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Quarterly Review Completed' : (i === 90 ? 'Training Completed' : 'Promotion to Senior Tech')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function HrStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Appraisal Log</p>
            <p className="mt-1">Detailed history of performance appraisals.</p>
        </div>
    );
}
