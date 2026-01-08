'use client';

import React from 'react';

interface DetailWorkspaceProps {
    leftContent: React.ReactNode;
    rightContent: React.ReactNode;
    className?: string;
}

/**
 * DetailWorkspace - 2-Column Layout Component
 * 
 * Left: 65-70% - Primary work area (editor, tables, lists)
 * Right: 30-35% - Context intelligence (dependencies, impact, activity)
 * 
 * Ensures NO blank right side - full width utilization
 */
export const DetailWorkspace: React.FC<DetailWorkspaceProps> = ({
    leftContent,
    rightContent,
    className = ''
}) => {
    return (
        <div className={`flex gap-6 w-full h-full ${className}`}>
            {/* LEFT: Primary Work Area (65-70%) */}
            <div className="flex-[7] min-w-0 overflow-auto">
                {leftContent}
            </div>

            {/* RIGHT: Context Intelligence (30-35%) */}
            <div className="flex-[3] min-w-0 overflow-auto">
                {rightContent}
            </div>
        </div>
    );
};

export default DetailWorkspace;
