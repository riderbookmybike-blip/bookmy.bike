'use client';

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ImpactItem {
    type: 'warning' | 'info' | 'success';
    message: string;
    count?: number;
}

interface ImpactAnalysisPanelProps {
    entity: {
        name: string;
        id: string;
    };
    impacts?: ImpactItem[];
}

/**
 * ImpactAnalysisPanel - "If you change this → what breaks"
 */
export const ImpactAnalysisPanel: React.FC<ImpactAnalysisPanelProps> = ({
    entity,
    impacts = []
}) => {
    const hasWarnings = impacts.some(i => i.type === 'warning');

    return (
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-2">
                {hasWarnings ? (
                    <AlertCircle size={16} className="text-amber-500" />
                ) : (
                    <CheckCircle size={16} className="text-green-500" />
                )}
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Impact Analysis</p>
                    <h4 className="text-xs font-black text-white">Change Impact</h4>
                </div>
            </div>

            {impacts.length > 0 ? (
                <div className="space-y-2">
                    {impacts.map((impact, idx) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-xl border ${impact.type === 'warning'
                                    ? 'bg-amber-500/10 border-amber-500/20'
                                    : impact.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/20'
                                        : 'bg-blue-500/10 border-blue-500/20'
                                }`}
                        >
                            <p className="text-xs text-white font-medium">
                                {impact.message}
                                {impact.count && (
                                    <span className="ml-1 font-black">({impact.count})</span>
                                )}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-6 text-center">
                    <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No breaking changes detected</p>
                </div>
            )}
        </div>
    );
};

export default ImpactAnalysisPanel;
