'use client';

import React from 'react';
import { Activity, GitBranch, AlertTriangle, Info } from 'lucide-react';

export type ContextPanelType = 'context' | 'dependencies' | 'activity' | 'impact';

interface ContextSidePanelProps {
    type?: ContextPanelType;
    children: React.ReactNode;
    title?: string;
}

/**
 * ContextSidePanel - Intelligent right-side panel
 *
 * Provides context-aware intelligence based on current entity and tab
 */
export const ContextSidePanel: React.FC<ContextSidePanelProps> = ({ type = 'context', children, title }) => {
    const getIcon = () => {
        switch (type) {
            case 'dependencies':
                return <GitBranch size={18} />;
            case 'activity':
                return <Activity size={18} />;
            case 'impact':
                return <AlertTriangle size={18} />;
            default:
                return <Info size={18} />;
        }
    };

    const getTitle = () => {
        if (title) return title;
        switch (type) {
            case 'dependencies':
                return 'Dependencies';
            case 'activity':
                return 'Activity';
            case 'impact':
                return 'Impact Analysis';
            default:
                return 'Context';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 px-1">
                <div className="text-blue-500">{getIcon()}</div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{getTitle()}</h3>
            </div>

            {/* Content */}
            <div className="space-y-4">{children}</div>
        </div>
    );
};

export default ContextSidePanel;
