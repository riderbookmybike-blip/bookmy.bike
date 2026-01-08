'use client';

import React from 'react';

// Tab 1: Overview
export function CampaignOverview() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Campaign Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subject</span>
                            <span className="text-gray-900 font-medium">Summer Service Sale</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Channel</span>
                            <span className="text-gray-900">Email</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Scheduled For</span>
                            <span className="text-gray-900">10 Jun 2025, 10:00 AM</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Audience</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Target Segment</span>
                            <span className="text-gray-900 font-medium">Active - Last 3 Months</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Est. Reach</span>
                            <span className="text-gray-900 font-bold">1,250 Users</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-500">Status</span>
                            <span className="text-blue-600 font-medium">Scheduled</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Content Preview</h3>
                <div className="p-4 bg-white border border-gray-300 rounded text-sm text-gray-600">
                    <p><strong>Subject:</strong> Get 20% off on your next service!</p>
                    <p className="mt-2">Hi [Name], keep your bike in top condition for the summer rides...</p>
                    <div className="mt-4 h-20 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        [Banner Image Placeholder]
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab 2: Transactions (Engagement Metrics Placeholder)
export function CampaignTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span>📈</span>
            </div>
            <p className="text-sm font-medium">Engagement Metrics</p>
            <p className="text-xs mt-1">Clicks, Opens, and Conversion stats will appear here.</p>
        </div>
    );
}

// Tab 3: Documents
export function CampaignDocuments() {
    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <span className="text-4xl mb-2">🖼️</span>
            <p className="text-sm font-medium">Upload Creative Assets</p>
            <p className="text-xs mt-1">Images, HTML templates, or SMS scripts</p>
        </div>
    );
}

// Tab 4: Activity
export function CampaignActivity() {
    return (
        <div className="space-y-4">
            {[1, 2, 5].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-4">
                        <p className="text-sm text-gray-900">{i === 1 ? 'Campaign Scheduled' : (i === 2 ? 'Content Approved' : 'Draft Created')}</p>
                        <p className="text-xs text-gray-500">{i} day(s) ago</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab 5: Statement (Placeholder)
export function CampaignStatement() {
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-600 text-sm">
            <p className="font-medium">Audience Log</p>
            <p className="mt-1">Detailed list of recipients and delivery status.</p>
        </div>
    );
}
