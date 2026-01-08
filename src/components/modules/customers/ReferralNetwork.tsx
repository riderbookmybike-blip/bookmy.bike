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
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100 flex items-center gap-6">
        <div className="p-4 bg-white rounded-full shadow-sm text-purple-600">
            {source.type === 'EVENT' ? <Calendar size={32} /> : <Megaphone size={32} />}
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs font-bold rounded uppercase">
                    {source.type}
                </span>
                {source.validTo && (
                    <span className="text-xs text-gray-500">Valid till {source.validTo}</span>
                )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{source.name}</h3>
            <p className="text-gray-600 mt-1">{source.description}</p>
            <div className="mt-4 flex items-center gap-2">
                <Tag size={16} className="text-gray-400" />
                <span className="font-mono text-sm bg-white px-2 py-1 rounded border border-gray-200 text-gray-700">
                    {source.code}
                </span>
                <span className="text-xs text-gray-400 ml-2">Referral Code</span>
            </div>
        </div>
        <div className="text-center px-4 border-l border-gray-200">
            <Gift className="mx-auto text-purple-400 mb-2" />
            <p className="text-sm font-medium text-purple-900">Platform Linked</p>
        </div>
    </div>
);

const PersonCard = ({ source }: { source: ReferralSource }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-100 flex items-center gap-6">
        <div className="p-4 bg-blue-50 rounded-full text-blue-600">
            <User size={32} />
        </div>
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded uppercase">
                    Direct Referral
                </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{source.name}</h3>
            <p className="text-gray-500 text-sm mt-1">Existing Customer</p>
            <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-sm bg-gray-50 px-2 py-1 rounded text-gray-700">
                    {source.code}
                </span>
            </div>
        </div>
    </div>
);

export default function ReferralNetwork({ source }: ReferralNetworkProps) {
    if (!source) return <div className="text-gray-400 p-4">No referral source linked.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Network size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Referral Origin</h3>
                    <p className="text-sm text-gray-500">This customer joined via:</p>
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
