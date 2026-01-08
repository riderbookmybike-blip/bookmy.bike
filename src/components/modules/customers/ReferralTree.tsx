'use client';

import React from 'react';
import { Network, User, ChevronRight, ChevronDown } from 'lucide-react';

interface ReferralNode {
    id: string;
    name: string;
    displayId: string;
    referrals: ReferralNode[];
}

interface ReferralTreeProps {
    root: ReferralNode;
}

const TreeNode = ({ node, level = 0 }: { node: ReferralNode, level?: number }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const hasChildren = node.referrals && node.referrals.length > 0;

    return (
        <div className="relative">
            <div
                className={`flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 cursor-pointer ${level === 0 ? 'bg-blue-50 border-blue-100' : ''}`}
                style={{ marginLeft: `${level * 24}px` }}
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                <div className="mr-2 text-gray-400">
                    {hasChildren ? (
                        isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    ) : (
                        <div className="w-4 h-4" />
                    )}
                </div>

                <div className={`p-2 rounded-full mr-3 ${level === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    <User size={16} />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`font-medium ${level === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {node.name}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {node.displayId}
                        </span>
                    </div>
                </div>

                {hasChildren && (
                    <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {node.referrals.length} referrals
                    </div>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="relative">
                    {/* Visual Guide Line */}
                    <div
                        className="absolute w-px bg-gray-200 h-full"
                        style={{ left: `${(level * 24) + 19}px`, top: '0' }}
                    />
                    {node.referrals.map((child) => (
                        <TreeNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function ReferralTree({ root }: ReferralTreeProps) {
    if (!root) return <div className="text-gray-400 p-4">No referral data available</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Network size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Referral Network</h3>
                    <p className="text-sm text-gray-500">Downline hierarchy for {root.name}</p>
                </div>
            </div>

            <div className="border rounded-lg p-4 bg-white/50 min-h-[300px]">
                <TreeNode node={root} />
            </div>
        </div>
    );
}
