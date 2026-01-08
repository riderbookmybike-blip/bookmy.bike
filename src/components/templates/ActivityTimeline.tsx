'use client';

import React from 'react';
import { Circle, User, CheckCircle, Edit, FilePlus, Trash2 } from 'lucide-react';

// Mock Activity Data
const MOCK_ACTIVITIES = [
    { id: 1, type: 'create', user: 'Admin User', action: 'Created record', time: '2 hours ago', icon: FilePlus, color: 'text-green-500 bg-green-50' },
    { id: 2, type: 'update', user: 'Manager', action: 'Updated status to Active', time: '5 hours ago', icon: Edit, color: 'text-blue-500 bg-blue-50' },
    { id: 3, type: 'approve', user: 'Supervisor', action: 'Approved request', time: '1 day ago', icon: CheckCircle, color: 'text-purple-500 bg-purple-50' },
    { id: 4, type: 'delete', user: 'System', action: 'Deleted attachment', time: '2 days ago', icon: Trash2, color: 'text-red-500 bg-red-50' },
];

export interface ActivityItem {
    id: number | string;
    type: string;
    user: string;
    action: string;
    time: string;
    icon?: any;
    color?: string;
}

interface ActivityTimelineProps {
    items?: ActivityItem[];
}

export default function ActivityTimeline({ items }: ActivityTimelineProps) {
    const activities = items && items.length > 0 ? items : MOCK_ACTIVITIES;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Timeline</h3>
            <div className="relative border-l border-gray-200 ml-3 space-y-8">
                {activities.map((activity) => {
                    const Icon = activity.icon || Circle;
                    return (
                        <div key={activity.id} className="relative pl-8">
                            {/* Connector Line Dot */}
                            <div className={`absolute -left-3 top-1 p-1 rounded-full border-2 border-white shadow-sm ${activity.color}`}>
                                <Icon size={14} />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900">
                                    {activity.user} <span className="font-normal text-gray-500">{activity.action}</span>
                                </span>
                                <span className="text-xs text-gray-400 mt-1">{activity.time}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Start Item */}
                <div className="relative pl-8 opactiy-50">
                    <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-gray-200 border-2 border-white"></div>
                    <span className="text-xs text-gray-400">Record created on Jan 1, 2025</span>
                </div>
            </div>
        </div>
    );
}
