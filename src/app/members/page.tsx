'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Zap,
    Copy,
    LogOut,
    Car,
    Headphones,
    Calendar,
    Share2
} from 'lucide-react';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';

export default function MembersHome() {
    const [referralCode] = useState('R9K2X7P4M');
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-rose-500/30 font-sans">
            <MarketplaceHeader onLoginClick={() => { }} />

            <main className="max-w-[1400px] mx-auto px-6 py-12 md:py-24 space-y-16">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 italic">Live Session</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic">
                                Welcome Back, <span className="text-rose-600">Ajit M Singh Rathore</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">ID: X7R9K2</p>
                                <span className="px-3 py-0.5 bg-rose-600/10 border border-rose-600 text-rose-600 text-[10px] font-black uppercase tracking-widest italic rounded">Founder Member</span>
                            </div>
                        </div>
                    </div>

                    <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all group">
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Invite Members - Large Card */}
                    <div className="md:col-span-2 lg:col-span-1 group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-rose-600/30 transition-all duration-700">
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-rose-600/10 flex items-center justify-center text-rose-600 border border-rose-600/20 group-hover:scale-110 transition-transform">
                                <Share2 size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Invite Members</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Unlimited Referrals</p>
                            </div>

                            <div className="relative group/copy">
                                <div className="w-full p-6 bg-black rounded-2xl border border-white/5 flex items-center justify-between group-hover/copy:border-rose-600/50 transition-colors">
                                    <span className="text-xl font-black tracking-[0.2em] text-rose-600 uppercase font-mono">{referralCode}</span>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-3 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <Copy size={20} className={copied ? 'text-emerald-500' : ''} />
                                    </button>
                                </div>
                                {copied && (
                                    <span className="absolute -top-8 right-0 text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">Copied!</span>
                                )}
                            </div>

                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                Share your unique referral code. This code is permanently linked to your profile.
                            </p>
                        </div>

                        {/* Abstract Background Icon */}
                        <Share2 size={200} className="absolute -right-16 -top-16 text-white/5 -rotate-12 pointer-events-none" />
                    </div>

                    {/* My Garage */}
                    <div className="group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-blue-600/30 transition-all duration-700">
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20 group-hover:scale-110 transition-transform">
                                <Car size={24} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">My Garage</h3>
                                    <p className="text-[10px] text-slate-500 font-medium italic">View your collection and service history.</p>
                                </div>
                                <div className="w-10 h-1 bg-slate-800 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Concierge */}
                    <div className="group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-amber-600/30 transition-all duration-700">
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600 border border-amber-600/20 group-hover:scale-110 transition-transform">
                                <Headphones size={24} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Concierge</h3>
                                    <p className="text-[10px] text-slate-500 font-medium italic">24/7 dedicated support for your needs.</p>
                                </div>
                                <div className="w-10 h-1 bg-slate-800 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Events */}
                    <div className="group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-emerald-600/30 transition-all duration-700">
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 border border-emerald-600/20 group-hover:scale-110 transition-transform">
                                <Calendar size={24} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Events</h3>
                                    <p className="text-[10px] text-slate-500 font-medium italic">Exclusive rides and meetups near you.</p>
                                </div>
                                <div className="w-10 h-1 bg-slate-800 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Pro Tip/Ad */}
                    <div className="group relative bg-gradient-to-br from-rose-600 to-rose-900 border border-white/10 rounded-[3rem] p-10 overflow-hidden shadow-2xl shadow-rose-600/20">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <Zap size={32} className="text-white fill-white animate-pulse" />
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Upgrade Your <br /> Experience</h3>
                                    <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest italic">Get priority allocation on new drops.</p>
                                </div>
                                <button className="w-full py-4 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">Elite Circle Pro</button>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                    </div>
                </div>

                {/* Membership Status Footer */}
                <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 flex flex-col md:row items-center justify-between gap-6 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Membership Status:</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-sm font-black uppercase italic tracking-widest text-emerald-500">Active</span>
                        </div>
                    </div>
                    <button className="px-10 py-4 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl active:scale-95 italic">
                        Manage Subscription
                    </button>
                </div>
            </main>

            <MarketplaceFooter />
        </div>
    );
}
