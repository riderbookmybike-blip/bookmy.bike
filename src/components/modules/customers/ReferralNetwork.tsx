'use client';

import React from 'react';
import { Network, User, Megaphone, Calendar, Tag, Gift } from 'lucide-react';
import { ReferralSource } from '@/lib/referral';
import ReferralTree from './ReferralTree'; // Re-use the existing tree for Person type

interface ReferralNetworkProps {
    source: ReferralSource;
    // For PERSON type, we might want the downline tree. 
    // But sticking to the "Source" view first as requested by "Platform-wise".
    // If the customer was referred by this source, we show this source.
    // If we want to show who this customer referred, that's their "Downline".
}

const CampaignCard = ({ source }: { source: ReferralSource }) => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-500/10 dark:to-blue-500/10 p-6 rounded-lg border border-purple-100 dark:border-white/10 flex items-center gap-6">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm text-purple-600 dark:text-purple-300">
            {source.type === 'EVENT' ? <Calendar size={32} /> : <Megaphone size={32} />}
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-purple-200 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 text-xs font-bold rounded uppercase">
                    {source.type}
                </span>
                {source.validTo && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">Valid till {source.validTo}</span>
                )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{source.name}</h3>
            <p className="text-gray-600 dark:text-slate-400 mt-1">{source.description}</p>
            <div className="mt-4 flex items-center gap-2">
                <Tag size={16} className="text-gray-400 dark:text-slate-500" />
                <span className="font-mono text-sm bg-white dark:bg-slate-900 px-2 py-1 rounded border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200">
                    {source.code}
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-500 ml-2">Referral Code</span>
            </div>
        </div>
        <div className="text-center px-4 border-l border-gray-200 dark:border-white/10">
            <Gift className="mx-auto text-purple-400 mb-2" />
            <p className="text-sm font-medium text-purple-900 dark:text-purple-200">Platform Linked</p>
        </div>
    </div>
);

const PersonCard = ({ source }: { source: ReferralSource }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-100 dark:border-white/10 flex items-center gap-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-300">
            <User size={32} />
        </div>
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-200 text-xs font-bold rounded uppercase">
                    Direct Referral
                </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{source.name}</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Existing Customer</p>
            <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-sm bg-gray-50 dark:bg-white/5 px-2 py-1 rounded text-gray-700 dark:text-slate-200">
                    {source.code}
                </span>
            </div>
        </div>
    </div>
);

export default function ReferralNetwork({ source }: ReferralNetworkProps) {
    if (!source) return <div className="text-gray-400 dark:text-slate-500 p-4">No referral source linked.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-lg">
                    <Network size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Referral Origin</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">This customer joined via:</p>
                </div>
            </div>

            {source.type === 'PERSON' ? (
                <PersonCard source={source} />
            ) : (
                <CampaignCard source={source} />
            )}

            {/* In a real app, we might also show the customer's *own* referral code/link to share here */}
            <div className="mt-8 pt-8 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Referral Performance</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase">Referrals Made</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase">Rewards Earned</p>
                        <p className="text-2xl font-bold text-gray-900">₹0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
