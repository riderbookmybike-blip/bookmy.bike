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
                    <div className="md:col-span-2 lg:col-span-1 group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-blue-600/30 transition-all duration-700">
                        {/* Metallic Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20 group-hover:scale-110 transition-transform">
                                <Share2 size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Invite Members</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Unlimited Referrals</p>
                            </div>

                            <div className="relative group/copy">
                                <div className="w-full p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between group-hover/copy:border-blue-600/50 transition-colors shadow-2xl">
                                    <span className="text-xl font-black tracking-[0.2em] text-blue-500 uppercase font-mono">{referralCode}</span>
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
                                Share your unique referral code. This code is permanently linked to your profile and unlocks Founder rewards.
                            </p>
                        </div>

                        {/* Abstract Background Icon */}
                        <Share2 size={200} className="absolute -right-16 -top-16 text-white/5 -rotate-12 pointer-events-none group-hover:text-blue-500/10 transition-colors duration-700" />
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
                                    <p className="text-[10px] text-slate-500 font-medium italic">Track your deliveries and service milestones.</p>
                                </div>
                                <Link href="/store/catalog" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-colors">
                                    Add Vehicle <ArrowRight size={12} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Concierge */}
                    <a
                        href="https://wa.me/91XXXXXXXXXX"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-emerald-600/30 transition-all duration-700"
                    >
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 border border-emerald-600/20 group-hover:scale-110 transition-transform">
                                <Headphones size={24} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Concierge</h3>
                                    <p className="text-[10px] text-slate-500 font-medium italic">Direct WhatsApp line to your Elite account manager.</p>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white transition-colors">
                                    Chat Now <ArrowRight size={12} />
                                </div>
                            </div>
                        </div>
                    </a>

                    {/* Events */}
                    <div className="group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-amber-600/30 transition-all duration-700">
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600 border border-amber-600/20 group-hover:scale-110 transition-transform">
                                <Calendar size={24} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Events</h3>
                                    <p className="text-[10px] text-slate-500 font-medium italic">Exclusive rides and meetups near you.</p>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">No events scheduled</span>
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
                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-2xl group hover:border-blue-600/30 transition-all duration-700">
                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Membership Status</p>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-2xl font-black uppercase italic tracking-widest text-white">Elite Verified</span>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/5" />
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Rewards Earned</p>
                            <p className="text-2xl font-black uppercase italic tracking-widest text-blue-500">₹12,450</p>
                        </div>
                    </div>
                    <button className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95 italic">
                        Access Founder Perks
                    </button>
                </div>
            </main>

            <MarketplaceFooter />
        </div>
    );
}
