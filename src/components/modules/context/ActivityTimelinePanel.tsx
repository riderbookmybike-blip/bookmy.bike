'use client';

import React from 'react';
import { Clock, User } from 'lucide-react';

interface ActivityItem {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details?: string;
}

interface ActivityTimelinePanelProps {
    entity: {
        name: string;
        id: string;
    };
    activities?: ActivityItem[];
}

/**
 * ActivityTimelinePanel - Audit trail and recent changes
 */
export const ActivityTimelinePanel: React.FC<ActivityTimelinePanelProps> = ({
    entity,
    activities = []
}) => {
    // Mock data if none provided
    const displayActivities = activities.length > 0 ? activities : [
        { id: '1', action: 'Created', user: 'System', timestamp: '2 hours ago', details: 'Initial setup' },
        { id: '2', action: 'Updated', user: 'Admin', timestamp: '1 hour ago', details: 'Modified specifications' }
    ];

    return (
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 space-y-4">
            <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Activity Log</p>
                <h4 className="text-xs font-black text-white">Recent Changes</h4>
            </div>

            <div className="space-y-3">
                {displayActivities.map((activity, idx) => (
                    <div key={activity.id} className="relative pl-6">
                        {/* Timeline line */}
                        {idx < displayActivities.length - 1 && (
                            <div className="absolute left-[7px] top-6 bottom-0 w-[1px] bg-white/10" />
                        )}

                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900" />

                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white">{activity.action}</span>
                                <span className="text-[10px] text-slate-500">•</span>
                                <span className="text-[10px] text-slate-400">{activity.timestamp}</span>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <User size={10} />
                                <span>{activity.user}</span>
                            </div>

                            {activity.details && (
                                <p className="text-[11px] text-slate-400 italic">{activity.details}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityTimelinePanel;
