'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Award, TrendingUp, Gift, Users, Copy, Check,
    Zap, Star, Trophy, Crown, ChevronRight
} from 'lucide-react';

// Mock data - will be replaced with real API later
const MEMBERSHIP_DATA = {
    tier: 'Gold', // 'Bronze', 'Silver', 'Gold', 'Platinum'
    points: 5240,
    pointsToNextTier: 2760, // Points needed to reach Platinum
    nextTier: 'Platinum',
    lifetimePoints: 12450,
    expiringPoints: 150,
    expiringDate: 'Feb 15, 2026',
};

const EXCLUSIVE_OFFERS = [
    {
        id: 1,
        title: '₹5,000 Off',
        description: 'On any premium bike',
        validUntil: 'Mar 31, 2026',
        code: 'GOLD5K',
    },
    {
        id: 2,
        title: 'Free Insurance',
        description: 'First year coverage',
        validUntil: 'Apr 30, 2026',
        code: 'GOLDINS',
    },
    {
        id: 3,
        title: 'Priority Service',
        description: 'Skip the queue',
        validUntil: 'Always',
        code: 'GOLDVIP',
    },
];

const TIER_COLORS = {
    Bronze: 'from-[#CD7F32] to-[#8B4513]',
    Silver: 'from-[#C0C0C0] to-[#808080]',
    Gold: 'from-[#FFD700] to-[#F4B000]',
    Platinum: 'from-[#E5E4E2] to-[#B9B8B5]',
};

export const OClubDashboard = () => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const referralCode = 'RATHI2026';

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const tierProgress = (MEMBERSHIP_DATA.points / (MEMBERSHIP_DATA.points + MEMBERSHIP_DATA.pointsToNextTier)) * 100;

    return (
        <div className="min-h-screen bg-black pb-24">
            {/* Header */}
            <div className="px-5 pt-6 pb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Crown size={24} className="text-[#F4B000]" />
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                        O-Club
                    </h1>
                </div>
                <p className="text-sm text-zinc-500 font-medium">
                    Your exclusive membership rewards
                </p>
            </div>

            <div className="px-5 space-y-6">
                {/* Membership Tier Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${TIER_COLORS[MEMBERSHIP_DATA.tier as keyof typeof TIER_COLORS]} p-6 shadow-2xl`}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Trophy size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                                        Member Tier
                                    </p>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                                        {MEMBERSHIP_DATA.tier}
                                    </h2>
                                </div>
                            </div>
                            <Award size={48} className="text-white/30" />
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
                            <div className="flex items-baseline justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                                    Points Balance
                                </p>
                                <p className="text-3xl font-black text-white">
                                    {MEMBERSHIP_DATA.points.toLocaleString()}
                                </p>
                            </div>
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${tierProgress}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-white rounded-full"
                                />
                            </div>
                            <p className="text-xs text-white/70 font-medium mt-2">
                                {MEMBERSHIP_DATA.pointsToNextTier.toLocaleString()} points to {MEMBERSHIP_DATA.nextTier}
                            </p>
                        </div>

                        <button className="w-full h-12 bg-white text-black rounded-xl font-black uppercase tracking-wider text-sm active:scale-95 transition-transform">
                            Upgrade Now
                        </button>
                    </div>
                </motion.div>

                {/* Points Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Star size={16} className="text-[#F4B000]" />
                            <p className="text-xs font-black uppercase tracking-wider text-zinc-500">
                                Lifetime
                            </p>
                        </div>
                        <p className="text-2xl font-black text-white">
                            {MEMBERSHIP_DATA.lifetimePoints.toLocaleString()}
                        </p>
                        <p className="text-xs text-zinc-600 font-medium mt-1">Total earned</p>
                    </div>

                    <div className="bg-zinc-900 rounded-2xl p-4 border border-[#FF1F50]/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={16} className="text-[#FF1F50]" />
                            <p className="text-xs font-black uppercase tracking-wider text-zinc-500">
                                Expiring Soon
                            </p>
                        </div>
                        <p className="text-2xl font-black text-[#FF1F50]">
                            {MEMBERSHIP_DATA.expiringPoints}
                        </p>
                        <p className="text-xs text-zinc-600 font-medium mt-1">{MEMBERSHIP_DATA.expiringDate}</p>
                    </div>
                </motion.div>

                {/* Exclusive Offers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Gift size={20} className="text-[#F4B000]" />
                            <h3 className="text-lg font-black uppercase tracking-tight text-white">
                                Exclusive Offers
                            </h3>
                        </div>
                        <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">
                            View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {EXCLUSIVE_OFFERS.map((offer, idx) => (
                            <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 active:scale-95 transition-transform"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-lg font-black text-white mb-1">{offer.title}</p>
                                        <p className="text-sm text-zinc-400 font-medium mb-2">
                                            {offer.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-zinc-600">
                                                Valid until {offer.validUntil}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopyCode(offer.code)}
                                        className="ml-4 px-4 py-2 bg-[#F4B000] rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
                                    >
                                        {copiedCode === offer.code ? (
                                            <Check size={16} className="text-black" />
                                        ) : (
                                            <Copy size={16} className="text-black" />
                                        )}
                                        <span className="text-xs font-black uppercase text-black">
                                            {copiedCode === offer.code ? 'Copied!' : offer.code}
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Referral Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-[#138808] to-[#0a5505] rounded-3xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 opacity-10">
                        <Users size={120} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={24} className="text-white" />
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
                                Invite Friends
                            </h3>
                        </div>
                        <p className="text-sm text-white/80 font-medium mb-4">
                            Share your code and earn <span className="font-black text-white">500 points</span> for each friend who books a bike!
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-1">
                                    Your Referral Code
                                </p>
                                <p className="text-2xl font-black text-white tracking-wider">{referralCode}</p>
                            </div>
                            <button
                                onClick={() => handleCopyCode(referralCode)}
                                className="w-14 h-14 bg-white rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                            >
                                {copiedCode === referralCode ? (
                                    <Check size={24} className="text-[#138808]" />
                                ) : (
                                    <Copy size={24} className="text-[#138808]" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Activity Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-[#F4B000]" />
                            <h3 className="text-lg font-black uppercase tracking-tight text-white">
                                Recent Activity
                            </h3>
                        </div>
                        <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                            View All
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {[
                            { action: 'Booking completed', points: '+1,200', date: 'Jan 28' },
                            { action: 'Friend referral', points: '+500', date: 'Jan 25' },
                            { action: 'Profile completed', points: '+100', date: 'Jan 20' },
                        ].map((activity, idx) => (
                            <div
                                key={idx}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">{activity.action}</p>
                                    <p className="text-xs text-zinc-600 font-medium">{activity.date}, 2026</p>
                                </div>
                                <p className="text-lg font-black text-[#138808]">{activity.points}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
